import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GC_BASE = 'https://bankaccountdata.gocardless.com/api/v2'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

async function gcToken(): Promise<string> {
  const res = await fetch(`${GC_BASE}/token/new/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret_id: Deno.env.get('GOCARDLESS_SECRET_ID'),
      secret_key: Deno.env.get('GOCARDLESS_SECRET_KEY'),
    }),
  })
  const data = await res.json()
  if (!data.access) throw new Error(`GoCardless token error: ${JSON.stringify(data)}`)
  return data.access
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json()
    const token = await gcToken()

    // --- List institutions ---
    if (body.action === 'institutions') {
      const country = body.country ?? 'ES'
      const res = await fetch(`${GC_BASE}/institutions/?country=${country}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      return json(data)
    }

    // --- Start OAuth flow ---
    if (body.action === 'create') {
      const { institutionId, institutionName, householdId, redirectUrl } = body
      const res = await fetch(`${GC_BASE}/requisitions/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect: redirectUrl,
          institution_id: institutionId,
          reference: `${householdId}:${user.id}:${Date.now()}`,
        }),
      })
      const requisition = await res.json()
      if (!requisition.id) return json({ error: 'GoCardless error', detail: requisition }, 502)

      await admin.from('bank_connections').insert({
        household_id: householdId,
        user_id: user.id,
        institution_id: institutionId,
        institution_name: institutionName,
        requisition_id: requisition.id,
        status: 'pending',
      })

      return json({ link: requisition.link, requisitionId: requisition.id })
    }

    // --- Confirm after OAuth redirect ---
    if (body.action === 'confirm') {
      const { requisitionId, householdId } = body
      const res = await fetch(`${GC_BASE}/requisitions/${requisitionId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const requisition = await res.json()

      if (requisition.status !== 'LN') {
        return json({ error: 'Bank not yet authorized', status: requisition.status }, 400)
      }

      // Fetch account details
      const accountDetails = await Promise.all(
        (requisition.accounts ?? []).map(async (accountId: string) => {
          const detailRes = await fetch(`${GC_BASE}/accounts/${accountId}/details/`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const detail = await detailRes.json()
          return { external_account_id: accountId, ...detail.account }
        })
      )

      // Update connection to active
      const { data: conn } = await admin
        .from('bank_connections')
        .update({ status: 'active', last_sync_at: new Date().toISOString() })
        .eq('requisition_id', requisitionId)
        .select('id')
        .single()

      if (!conn) return json({ error: 'Connection not found' }, 404)

      // Upsert accounts
      for (const acct of accountDetails) {
        await admin.from('bank_accounts').upsert(
          {
            bank_connection_id: conn.id,
            household_id: householdId,
            external_account_id: acct.external_account_id,
            iban: acct.iban ?? null,
            name: acct.name ?? acct.product ?? 'Cuenta',
            currency: acct.currency ?? 'EUR',
            is_active: true,
          },
          { onConflict: 'external_account_id,bank_connection_id' }
        )
      }

      return json({ success: true, accountCount: accountDetails.length })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err: any) {
    return json({ error: err.message }, 500)
  }
})
