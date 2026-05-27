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
    const { householdId } = await req.json()

    // Get active connections for the household
    const { data: connections } = await admin
      .from('bank_connections')
      .select('id')
      .eq('household_id', householdId)
      .eq('status', 'active')

    if (!connections?.length) return json({ synced: 0 })

    const connIds = connections.map((c: any) => c.id)
    const { data: accounts } = await admin
      .from('bank_accounts')
      .select('*')
      .in('bank_connection_id', connIds)
      .eq('is_active', true)

    if (!accounts?.length) return json({ synced: 0 })

    const token = await gcToken()
    let totalSynced = 0
    const errors: string[] = []

    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - 90)
    const dateFromStr = dateFrom.toISOString().split('T')[0]

    for (const account of accounts) {
      try {
        const res = await fetch(
          `${GC_BASE}/accounts/${account.external_account_id}/transactions/?date_from=${dateFromStr}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const txData = await res.json()
        const booked: any[] = txData.transactions?.booked ?? []

        for (const tx of booked) {
          if (!tx.transactionId) continue

          // Skip if already imported
          const { data: existing } = await admin
            .from('transactions')
            .select('id')
            .eq('external_tx_id', tx.transactionId)
            .maybeSingle()

          if (existing) continue

          const rawAmount = parseFloat(tx.transactionAmount?.amount ?? '0')
          const amount = Math.abs(rawAmount)
          const type = rawAmount >= 0 ? 'income' : 'expense'
          const description =
            tx.remittanceInformationUnstructured ||
            tx.creditorName ||
            tx.debtorName ||
            tx.remittanceInformationStructured ||
            ''

          await admin.from('transactions').insert({
            household_id: householdId,
            user_id: user.id,
            amount,
            type,
            description: description.slice(0, 500),
            date: tx.bookingDate,
            source: 'bank',
            external_tx_id: tx.transactionId,
          })

          totalSynced++
        }

        // Update last sync timestamp
        await admin
          .from('bank_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.bank_connection_id)
      } catch (err: any) {
        errors.push(`Account ${account.id}: ${err.message}`)
      }
    }

    return json({ synced: totalSynced, errors })
  } catch (err: any) {
    return json({ error: err.message }, 500)
  }
})
