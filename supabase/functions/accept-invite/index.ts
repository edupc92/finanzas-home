// Accept household invitation — Phase 2
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (_req) => {
  return new Response(JSON.stringify({ message: 'Not implemented — Phase 2' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  })
})
