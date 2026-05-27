// Send household invitation email — Phase 2
// Requires RESEND_API_KEY or SMTP config as Supabase secrets.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (_req) => {
  return new Response(JSON.stringify({ message: 'Not implemented — configure SMTP in Phase 2' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  })
})
