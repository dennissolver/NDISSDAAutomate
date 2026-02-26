# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PF Platform (Property Friends) — automates NDIS SDA (Specialist Disability Accommodation) claims, reconciliation, and property management. The main codebase lives in `pf-platform/`.

A `scaffold.py` script at the root was used to generate the initial project structure (skeleton with `.gitkeep` placeholders). The full implementation specs are in `ProjectSetup/`.

## Planning Documents (`ProjectSetup/`)

These are the authoritative blueprints for the target system:

- **`pf-platform-file-structure-final.txt`** — Complete target file structure with descriptions of every file's purpose. Consult this when creating new files to match the planned structure.
- **`pf-supabase-schema.txt`** — Full database schema: 18 tables, all Postgres enums, RLS policies, triggers, storage buckets, edge functions, and entity relationships. This is the source of truth for the data model.
- **`pf-data-input-mapping.txt`** — Maps each automated function to its data sources, capture methods, and historical bootstrapping approach.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui → deployed to Vercel
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **API:** tRPC
- **Monorepo:** Turborepo + pnpm 9 (Node >=20)
- **Testing:** Vitest
- **Linting:** ESLint + Prettier
- **Voice:** ElevenLabs (voice summaries via Supabase Edge Functions)
- **CI:** GitHub Actions — typecheck, lint, test on PRs to main

## Commands

All commands run from `pf-platform/`:

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start dev server (web on port 3000)
pnpm build                # Build all packages
pnpm lint                 # Lint all packages
pnpm typecheck            # Type-check all packages
pnpm test                 # Run all tests (vitest)
pnpm db:migrate           # Run database migrations
pnpm db:seed              # Seed reference data (SDA rates, location factors, MRRC)
pnpm db:reset             # Reset local database
```

Run a single package test:
```bash
cd pf-platform/packages/core && pnpm test
```

## Architecture

### Monorepo Layout (`pf-platform/`)

**Apps:**
- `apps/web` (`@pf/web`) — Coordinator dashboard (Next.js App Router). Auth via Google OAuth. Routes: properties, participants, reconciliation, claims, clients, calculator, exceptions, settings.
- `apps/portal` (`@pf/portal`) — Client/investor portal (Next.js). Auth via magic link. Routes: properties, statements, payments, settings, voice summaries.

**Packages:**
- `packages/shared` (`@pf/shared`) — Types, enums, constants, and utilities shared across all packages. This is the dependency root.
- `packages/core` (`@pf/core`) — Domain business logic (zero framework deps). Modules: pricing (SDA calculator, MRRC calculator, pro-rata), reconciliation (service, calculator, validator), claims (service with NDIA/agency strategy pattern, validator, reference generator), properties, participants, clients, exceptions.
- `packages/db` (`@pf/db`) — Supabase database layer: client factory, generated types, typed query modules per entity. Migrations in `supabase/migrations/` (12 sequential SQL files).
- `packages/api` (`@pf/api`) — tRPC routers per domain (property, participant, reconciliation, claims, client, calculator, documents, exceptions, dashboard, settings, auth) + middleware (auth, role, audit).
- `packages/integrations` — External service adapters: NDIA API (payment requests, service bookings, participant lookup), Xero (invoices, payments, contacts), Google Workspace (Gmail watcher, Drive, Chat), ElevenLabs (TTS), DocuSign (Phase 4).
- `packages/ingestion` — Statement parser with per-agency adapters (Century 21, Aaron Moon, generic fallback), email watcher (Gmail push notifications), document classifier.
- `packages/orchestration` — Workflow engine (monthly claim cycle, statement processing, claim submission, client statements, annual rollover), exception rules (claim rejection, plan expiry, insufficient funds, missing statement, payment overdue), notification templates + channels (email, Google Chat, voice).

**Supabase Edge Functions** (`supabase/functions/`):
- `process-statement` — Triggered by Storage upload → parse PDF → populate DB
- `ndia-webhook-handler` — NDIA notification receiver
- `generate-voice-summary` — Triggered by recon published → ElevenLabs TTS → Storage

**Vercel Cron Jobs** (in `apps/web/app/api/cron/`):
- `monthly-cycle` — 1st of month → trigger reconciliation pipeline
- `ndia-sync` — Daily → sync participant plans + bookings
- `exception-check` — Daily → detect missing statements, plan expiries
- `payment-followup` — Daily → chase overdue agency invoices
- `annual-rollover` — 1 July → pricing update workflow

### Dependency Flow

```
apps/web, apps/portal
  → @pf/api → @pf/core → @pf/shared
                → @pf/db → @pf/shared
```

### Key Domain Concepts

- **SDA Pricing:** Annual base rates keyed by `BuildingType|DesignCategory`, multiplied by location factors, plus supplements (OOA, breakout room, fire sprinklers). Rates updated each July (currently FY 2025-26). Constants in `packages/shared/src/constants/`.
- **MRRC (Maximum Reasonable Rent Contribution):** Formula: `(DSP × 0.25) + (Pension Supplement × 0.25) + (CRA × 1.0)`. Calculated per fortnight.
- **Claims:** Two pathways — NDIA-managed (direct API submission) and agency-managed (Xero invoice to plan manager). Strategy pattern in `packages/core/src/claims/`. Claim ref format: `PF-2026-02-PROP-PART`.
- **Reconciliation:** Monthly per-property. Compares money in (rent + SDA subsidy) against deductions (agency fee 4.4%, PF fee 8.8%, GST, energy, maintenance) → net client payout. Replaces manual spreadsheet.
- **Participants:** NDIS participants with service bookings linked to properties via occupancies table. Plan status tracking (active/expiring/expired), PACE transition support.
- **Exceptions:** Automated detection rules create exception queue items with severity (info/warning/critical). Types: claim rejection, plan expiry, insufficient funds, missing statement, payment overdue, booking expiry, PACE transition.

### Database Design

18 Supabase tables — full schema in `ProjectSetup/pf-supabase-schema.txt`. Key points:
- Money stored as `decimal(10,2)` in DB; application layer uses integer cents for arithmetic
- Two Supabase Auth pools: Google OAuth (PF team → `users` table) and magic link (clients → `clients` table)
- RLS enforces role-based access: admin, coordinator, finance, client
- Realtime enabled on `claims`, `reconciliations`, `exceptions`
- Google Drive dual-write columns maintained for backward compatibility during migration to Supabase Storage
- Audit log is append-only (INSERT only, no UPDATE/DELETE)
- Postgres triggers auto-calculate: `total_money_in`, `remaining_amount` on bookings, `calculated_mrrc`, `updated_at`

### Conventions

- Workspace packages use `@pf/` scope prefix
- Package entry points are `src/index.ts` (using TypeScript directly, no pre-compilation for internal packages)
- Tests live alongside source in `__tests__/` directories
- ESLint: unused vars prefixed with `_` are allowed; `no-explicit-any` is a warning
- Environment config via `.env.local` (see `.env.example`)
- Supabase Storage paths follow convention: `{entity_id}/{year}/{month}/filename`
- Statement parser uses adapter pattern — one adapter per rental agency format
