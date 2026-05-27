// GoCardless OAuth bank connection — Phase 2
// This edge function initiates the bank authorization flow.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (_req) => {
  return new Response(JSON.stringify({ message: 'Not implemented — Phase 2' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  })
})
