import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

function tlBase() {
  const sandbox = Deno.env.get('TRUELAYER_ENV') === 'sandbox'
  return sandbox ? 'https://api.truelayer-sandbox.com' : 'https://api.truelayer.com'
}

function tlAuth() {
  const sandbox = Deno.env.get('TRUELAYER_ENV') === 'sandbox'
  return sandbox ? 'https://auth.truelayer-sandbox.com' : 'https://auth.truelayer.com'
}

async function refreshAccessToken(conn: any): Promise<string | null> {
  const now = new Date()
  // Return existing token if still valid (with 5 min buffer)
  if (conn.token_expires_at && new Date(conn.token_expires_at) > new Date(now.getTime() + 5 * 60 * 1000)) {
    return conn.access_token
  }
  if (!conn.refresh_token) return null

  const res = await fetch(`${tlAuth()}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: Deno.env.get('TRUELAYER_CLIENT_ID')!,
      client_secret: Deno.env.get('TRUELAYER_CLIENT_SECRET')!,
      refresh_token: conn.refresh_token,
    }),
  })
  const tokens = await res.json()
  return tokens.access_token ?? null
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
    const dataBase = tlBase()

    // Get active connections with token data
    const { data: connections } = await admin
      .from('bank_connections')
      .select('id, access_token, refresh_token, token_expires_at')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .eq('provider', 'truelayer')

    if (!connections?.length) return json({ synced: 0 })

    let totalSynced = 0
    const errors: string[] = []

    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - 90)
    const dateFromStr = dateFrom.toISOString().split('T')[0]

    for (const conn of connections) {
      try {
        const token = await refreshAccessToken(conn)
        if (!token) {
          errors.push(`Connection ${conn.id}: token refresh failed`)
          continue
        }

        // Update token if it was refreshed
        if (token !== conn.access_token) {
          await admin.from('bank_connections').update({
            access_token: token,
            token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          }).eq('id', conn.id)
        }

        // Get accounts for this connection
        const { data: accounts } = await admin
          .from('bank_accounts')
          .select('external_account_id')
          .eq('bank_connection_id', conn.id)
          .eq('is_active', true)

        for (const acct of accounts ?? []) {
          try {
            const txRes = await fetch(
              `${dataBase}/data/v1/accounts/${acct.external_account_id}/transactions?from=${dateFromStr}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            const txData = await txRes.json()
            const txList: any[] = txData.results ?? []

            for (const tx of txList) {
              const txId = tx.transaction_id ?? tx.normalised_provider_transaction_id
              if (!txId) continue

              const { data: existing } = await admin
                .from('transactions')
                .select('id')
                .eq('external_tx_id', txId)
                .maybeSingle()

              if (existing) continue

              const rawAmount = parseFloat(tx.amount ?? '0')
              const amount = Math.abs(rawAmount)
              const type = rawAmount >= 0 ? 'income' : 'expense'
              const date = (tx.timestamp ?? tx.booking_date ?? '').split('T')[0]
              if (!date) continue

              await admin.from('transactions').insert({
                household_id: householdId,
                user_id: user.id,
                amount,
                type,
                description: (tx.description ?? tx.merchant_name ?? '').slice(0, 500),
                date,
                source: 'bank',
                external_tx_id: txId,
              })

              totalSynced++
            }
          } catch (err: any) {
            errors.push(`Account ${acct.external_account_id}: ${err.message}`)
          }
        }

        await admin.from('bank_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', conn.id)
      } catch (err: any) {
        errors.push(`Connection ${conn.id}: ${err.message}`)
      }
    }

    return json({ synced: totalSynced, errors })
  } catch (err: any) {
    return json({ error: err.message }, 500)
  }
})
