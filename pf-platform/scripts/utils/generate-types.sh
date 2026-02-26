#!/bin/bash
# Generate Supabase TypeScript types
# Requires: supabase CLI + running local instance or linked project
supabase gen types typescript --local > packages/db/src/types.ts
echo "✓ Types generated at packages/db/src/types.ts"
