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
  return {
    auth: sandbox ? 'https://auth.truelayer-sandbox.com' : 'https://auth.truelayer.com',
    data: sandbox ? 'https://api.truelayer-sandbox.com' : 'https://api.truelayer.com',
    providers: sandbox ? 'mock' : 'es-ob-all es-oauth-all',
  }
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

  const clientId = Deno.env.get('TRUELAYER_CLIENT_ID')!
  const clientSecret = Deno.env.get('TRUELAYER_CLIENT_SECRET')!

  try {
    const body = await req.json()
    const tl = tlBase()

    // --- Generate auth URL ---
    if (body.action === 'link') {
      const { redirectUri, householdId } = body
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: 'accounts transactions offline_access',
        redirect_uri: redirectUri,
        providers: tl.providers,
        // pass householdId in state so we get it back on redirect
        state: householdId,
      })
      return json({ url: `${tl.auth}/?${params}` })
    }

    // --- Exchange code for tokens after OAuth redirect ---
    if (body.action === 'callback') {
      const { code, redirectUri, householdId } = body

      // Exchange code for tokens
      const tokenRes = await fetch(`${tl.auth}/connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      })
      const tokens = await tokenRes.json()
      if (!tokens.access_token) {
        return json({ error: 'Token exchange failed', detail: tokens }, 502)
      }

      // Fetch accounts
      const accountsRes = await fetch(`${tl.data}/data/v1/accounts`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const accountsData = await accountsRes.json()
      const accounts: any[] = accountsData.results ?? []

      if (!accounts.length) {
        return json({ error: 'No accounts returned by bank' }, 400)
      }

      const provider = accounts[0]?.provider ?? {}
      const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()

      // Save connection
      const { data: conn, error: connErr } = await admin
        .from('bank_connections')
        .insert({
          household_id: householdId,
          user_id: user.id,
          provider: 'truelayer',
          institution_id: provider.provider_id ?? 'unknown',
          institution_name: provider.display_name ?? 'Banco',
          requisition_id: `tl-${Date.now()}`,
          status: 'active',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          last_sync_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (connErr || !conn) return json({ error: 'Failed to save connection', detail: connErr?.message, code: connErr?.code }, 500)

      // Save accounts
      for (const acct of accounts) {
        await admin.from('bank_accounts').upsert(
          {
            bank_connection_id: conn.id,
            household_id: householdId,
            external_account_id: acct.account_id,
            iban: acct.account_number?.iban ?? null,
            name: acct.display_name ?? 'Cuenta',
            currency: acct.currency ?? 'EUR',
            is_active: true,
          },
          { onConflict: 'bank_connection_id,external_account_id' }
        )
      }

      return json({ success: true, accountCount: accounts.length })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err: any) {
    return json({ error: err.message }, 500)
  }
})
