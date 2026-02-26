// Supabase Edge Function: ndia-webhook-handler
// Implemented in Phase 2/3

Deno.serve(async (req) => {
  return new Response(JSON.stringify({ status: 'ok', function: 'ndia-webhook-handler' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
