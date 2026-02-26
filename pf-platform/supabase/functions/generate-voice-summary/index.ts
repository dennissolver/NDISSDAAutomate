// Supabase Edge Function: generate-voice-summary
// Implemented in Phase 2/3

Deno.serve(async (req) => {
  return new Response(JSON.stringify({ status: 'ok', function: 'generate-voice-summary' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
