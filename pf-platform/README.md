# PF Platform

Integrated system to automate SDA claims, reconciliation, and property management
for NDIS provider operations (Property Friends).

## Stack
- **Frontend:** Next.js 14 (App Router) → Vercel
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **API:** tRPC
- **Monorepo:** Turborepo + pnpm
- **Voice:** ElevenLabs

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
pnpm db:migrate

# Seed reference data (SDA rates, location factors, MRRC)
pnpm db:seed

# Start development
pnpm dev
```

## Project Structure
- `apps/web` — Coordinator dashboard (Next.js)
- `apps/portal` — Client investor portal (Next.js)
- `packages/core` — Domain business logic
- `packages/db` — Supabase database layer
- `packages/api` — tRPC API routers
- `packages/integrations` — External service adapters
- `packages/ingestion` — Data ingestion & extraction
- `packages/orchestration` — Workflow orchestration
- `packages/shared` — Shared types, constants, utilities

## Documentation
See `docs/` for architecture, data model, and workflow documentation.
