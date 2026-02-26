#!/usr/bin/env python3
"""
PF Platform — Monorepo Scaffolding Script
==========================================
Run: python scaffold.py
Creates the complete project structure with functional Phase 1 code.
Stack: Next.js / Supabase / Vercel / tRPC / Turborepo / ElevenLabs

Phase 1 scope (functional code):
  - packages/shared (types, constants, enums, utils)
  - packages/core/reconciliation (reconciliation engine + calculator)
  - packages/core/pricing (SDA calculator + MRRC calculator)
  - packages/db (Supabase migrations + typed queries)
  - packages/ingestion/statement-parser (PDF parser + agency adapters)
  - packages/api (tRPC routers — reconciliation, property, calculator)
  - apps/web foundation (Next.js app shell, key pages, components)

Later phases (folder structure + placeholder files):
  - packages/core/claims, participants, clients, exceptions
  - packages/integrations (NDIA, Google, Xero, ElevenLabs, DocuSign)
  - packages/orchestration (workflows, exception rules, notifications)
  - apps/portal (client investor portal)
  - supabase/functions (edge functions)
"""

import os
import sys

# ─── Base path detection ───
# If run from within the project folder, use current dir
# Otherwise create/use the project folder
PROJECT_NAME = "pf-platform"

if os.path.basename(os.getcwd()) == "NDISSDAAutomate":
    BASE = os.path.join(os.getcwd(), PROJECT_NAME)
elif os.path.basename(os.getcwd()) == PROJECT_NAME:
    BASE = os.getcwd()
else:
    BASE = os.path.join(os.getcwd(), PROJECT_NAME)

print(f"\n{'='*70}")
print(f"  PF Platform Scaffolding")
print(f"  Target: {BASE}")
print(f"{'='*70}\n")


def write_file(rel_path: str, content: str):
    """Create a file with content, creating parent dirs as needed."""
    full_path = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"  ✓ {rel_path}")


def make_dirs(rel_path: str):
    """Create directory (and parents) with .gitkeep."""
    full_path = os.path.join(BASE, rel_path)
    os.makedirs(full_path, exist_ok=True)
    gitkeep = os.path.join(full_path, ".gitkeep")
    if not os.path.exists(gitkeep):
        open(gitkeep, "w").close()


# ═══════════════════════════════════════════════════════════════════════
#  ROOT CONFIG FILES
# ═══════════════════════════════════════════════════════════════════════
def create_root_configs():
    print("📁 Root configs...")

    write_file("package.json", """{
  "name": "pf-platform",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "db:generate": "cd packages/db && pnpm run generate",
    "db:migrate": "cd packages/db && pnpm run migrate",
    "db:seed": "cd packages/db && pnpm run seed",
    "db:reset": "cd packages/db && pnpm run reset",
    "scaffold:seed": "tsx scripts/seed/seed-sda-rates.ts"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "tsx": "^4.7.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "vitest": "^1.6.0"
  },
  "packageManager": "pnpm@9.1.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
""")

    write_file("pnpm-workspace.yaml", """packages:
  - "apps/*"
  - "packages/*"
""")

    write_file("turbo.json", """{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
""")

    write_file("tsconfig.base.json", """{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist", ".next"]
}
""")

    write_file(".eslintrc.js", """module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: { node: true, es2022: true },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['dist/', '.next/', 'node_modules/'],
};
""")

    write_file(".prettierrc", """{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
""")

    write_file(".nvmrc", "20\n")

    write_file(".gitignore", """# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.next/
.turbo/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Supabase
supabase/.temp/
supabase/.env.local

# Test
coverage/
""")

    write_file(".env.example", """# ─── Supabase ───
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# ─── Google Workspace ───
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_SERVICE_ACCOUNT_KEY=

# ─── Xero ───
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=

# ─── ElevenLabs ───
ELEVENLABS_API_KEY=

# ─── NDIA API (via aggregator) ───
NDIA_API_BASE_URL=
NDIA_API_KEY=

# ─── DocuSign ───
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_SECRET_KEY=

# ─── App ───
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-cron-secret
""")

    write_file("README.md", """# PF Platform

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
""")


# ═══════════════════════════════════════════════════════════════════════
#  PACKAGES/SHARED — Types, Constants, Enums, Utils
# ═══════════════════════════════════════════════════════════════════════
def create_shared_package():
    print("\n📦 packages/shared...")

    write_file("packages/shared/package.json", """{
  "name": "@pf/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
""")

    write_file("packages/shared/tsconfig.json", """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
""")

    # ─── Enums ───
    write_file("packages/shared/src/enums/claim-status.ts", """export enum ClaimStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}
""")

    write_file("packages/shared/src/enums/claim-pathway.ts", """export enum ClaimPathway {
  NDIA_MANAGED = 'ndia_managed',
  AGENCY_MANAGED = 'agency_managed',
}
""")

    write_file("packages/shared/src/enums/recon-status.ts", """export enum ReconStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  PUBLISHED = 'published',
}
""")

    write_file("packages/shared/src/enums/plan-status.ts", """export enum PlanStatus {
  ACTIVE = 'active',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
}
""")

    write_file("packages/shared/src/enums/exception-type.ts", """export enum ExceptionType {
  CLAIM_REJECTION = 'claim_rejection',
  PLAN_EXPIRY = 'plan_expiry',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  MISSING_STATEMENT = 'missing_statement',
  PAYMENT_OVERDUE = 'payment_overdue',
  BOOKING_EXPIRY = 'booking_expiry',
  PACE_TRANSITION = 'pace_transition',
}

export enum ExceptionSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum ExceptionStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}
""")

    write_file("packages/shared/src/enums/booking-status.ts", """export enum BookingStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}
""")

    write_file("packages/shared/src/enums/index.ts", """export * from './claim-status';
export * from './claim-pathway';
export * from './recon-status';
export * from './plan-status';
export * from './exception-type';
export * from './booking-status';
""")

    # ─── Types ───
    write_file("packages/shared/src/types/common.types.ts", """/**
 * Money is always stored as integer cents to avoid floating-point errors.
 * Display layer converts to AUD with 2 decimal places.
 */
export type Cents = number;

export interface AuditMeta {
  createdAt: Date;
  updatedAt: Date;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface Period {
  month: number; // 1-12
  year: number;  // e.g. 2026
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}
""")

    write_file("packages/shared/src/types/pricing.types.ts", """export enum BuildingType {
  HOUSE_2_RESIDENTS = 'house_2_residents',
  HOUSE_3_RESIDENTS = 'house_3_residents',
  VILLA_1_RESIDENT = 'villa_1_resident',
  VILLA_2_RESIDENTS = 'villa_2_residents',
}

export enum DesignCategory {
  BASIC = 'basic',
  IMPROVED_LIVEABILITY = 'improved_liveability',
  FULLY_ACCESSIBLE = 'fully_accessible',
  ROBUST = 'robust',
  HIGH_PHYSICAL_SUPPORT = 'high_physical_support',
}

export interface SdaPricingInput {
  buildingType: BuildingType;
  designCategory: DesignCategory;
  locationFactor: number;
  hasOoa: boolean;
  hasBreakoutRoom: boolean;
  hasFireSprinklers: boolean;
  financialYear?: string;
}

export interface SdaPricingResult {
  baseAnnualRate: number;
  ooaSupplement: number;
  breakoutSupplement: number;
  fireSprinklerSupplement: number;
  subtotalBeforeLocation: number;
  locationFactor: number;
  annualSdaAmount: number;
  monthlySdaAmount: number;
  dailySdaAmount: number;
}

export interface MrrcInput {
  dspBasicFortnight: number;
  pensionSuppFortnight: number;
  craMaxFortnight: number;
}

export interface MrrcResult {
  dspComponent: number;       // 25% of DSP
  pensionComponent: number;   // 25% of Pension Supp
  craComponent: number;       // 100% of CRA
  totalFortnightly: number;
  totalMonthly: number;       // Approx: fortnightly × 26 / 12
  totalAnnual: number;        // fortnightly × 26
}
""")

    write_file("packages/shared/src/types/reconciliation.types.ts", """import { type Cents, type Period } from './common.types';
import { type ReconStatus } from '../enums/recon-status';

export interface ReconciliationInput {
  propertyId: string;
  period: Period;
  statementNumber?: number;
  lineItems: ReconciliationLineItemInput[];
  sdaSubsidyAmount: Cents;
}

export interface ReconciliationLineItemInput {
  category: LineItemCategory;
  description: string;
  amount: Cents; // positive = money in, negative = money out
  source: LineItemSource;
  sourceReference?: string;
}

export enum LineItemCategory {
  RENT = 'rent',
  SDA_SUBSIDY = 'sda_subsidy',
  ENERGY_REIMBURSEMENT = 'energy_reimbursement',
  ENERGY_INVOICE = 'energy_invoice',
  MAINTENANCE = 'maintenance',
  MANAGEMENT_FEE = 'management_fee',
  OTHER = 'other',
}

export enum LineItemSource {
  RENTAL_STATEMENT = 'rental_statement',
  PRODA_CLAIM = 'proda_claim',
  ENERGY_INVOICE = 'energy_invoice',
  MANUAL = 'manual',
}

export interface ReconciliationResult {
  propertyId: string;
  period: Period;
  status: ReconStatus;
  statementNumber?: number;

  // Money In
  totalRentReceived: Cents;
  totalSdaSubsidy: Cents;
  totalMoneyIn: Cents;

  // Deductions
  agencyManagementFee: Cents;
  pfManagementFee: Cents;
  gstPayable: Cents;
  energyReimbursement: Cents;
  energyInvoiceAmount: Cents;
  maintenanceCosts: Cents;
  otherDeductions: Cents;

  // Result
  netClientPayout: Cents;

  // Detail
  lineItems: ReconciliationLineItemInput[];
}
""")

    write_file("packages/shared/src/types/property.types.ts", """import { type BuildingType, type DesignCategory } from './pricing.types';

export enum SdaEnrolmentStatus {
  PENDING = 'pending',
  ENROLLED = 'enrolled',
  CANCELLED = 'cancelled',
}

export interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyLabel?: string;
  buildingType: BuildingType;
  designCategory: DesignCategory;
  hasOoa: boolean;
  hasBreakoutRoom: boolean;
  hasFireSprinklers: boolean;
  locationFactor: number;
  maxResidents: number;
  sdaEnrolmentId?: string;
  sdaEnrolmentStatus: SdaEnrolmentStatus;
  sdaEnrolmentDate?: Date;
  annualSdaAmount?: number;
  ownerId: string;
  rentalAgencyId?: string;
  storagePath?: string;
  createdAt: Date;
  updatedAt: Date;
}
""")

    write_file("packages/shared/src/types/participant.types.ts", """import { type PlanStatus } from '../enums/plan-status';

export enum PlanManagementType {
  NDIA_MANAGED = 'ndia_managed',
  PLAN_MANAGED = 'plan_managed',
  SELF_MANAGED = 'self_managed',
}

export interface Participant {
  id: string;
  ndisNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;
  phone?: string;
  planManagementType: PlanManagementType;
  planManagerId?: string;
  planStatus: PlanStatus;
  planStartDate?: Date;
  planEndDate?: Date;
  paceTransitioned: boolean;
  sdaCategoryFunded?: string;
  createdAt: Date;
  updatedAt: Date;
}
""")

    write_file("packages/shared/src/types/claim.types.ts", """import { type ClaimStatus } from '../enums/claim-status';
import { type ClaimPathway } from '../enums/claim-pathway';
import { type Cents } from './common.types';

export interface Claim {
  id: string;
  claimReference: string;
  propertyId: string;
  participantId: string;
  serviceBookingId?: string;
  reconciliationId?: string;
  claimPathway: ClaimPathway;
  periodStart: Date;
  periodEnd: Date;
  sdaAmount: Cents;
  mrrcAmount?: Cents;
  totalAmount: Cents;
  ndisItemNumber: string;
  status: ClaimStatus;
  ndiaRequestId?: string;
  ndiaResponse?: Record<string, unknown>;
  xeroInvoiceId?: string;
  rejectionReason?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
""")

    write_file("packages/shared/src/types/client.types.ts", """export enum ClientEntityType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  TRUST = 'trust',
}

export interface Client {
  id: string;
  authUserId?: string;
  fullName: string;
  email: string;
  phone?: string;
  entityType: ClientEntityType;
  entityName?: string;
  abn?: string;
  bankBsb?: string;
  bankAccountNumber?: string;
  notificationEmail: boolean;
  notificationVoice: boolean;
  createdAt: Date;
  updatedAt: Date;
}
""")

    write_file("packages/shared/src/types/index.ts", """export * from './common.types';
export * from './pricing.types';
export * from './reconciliation.types';
export * from './property.types';
export * from './participant.types';
export * from './claim.types';
export * from './client.types';
""")

    # ─── Constants ───
    write_file("packages/shared/src/constants/fee-structure.ts", """/**
 * Property Friends fee structure.
 * PF takes 8.8% of total money in (rent + SDA subsidy).
 * Rental agency fee varies per agency (default 4.4%).
 */
export const PF_FEE_RATE = 0.088;
export const DEFAULT_AGENCY_FEE_RATE = 0.044;

/**
 * GST rate in Australia.
 * GST-inclusive amount × (1/11) = GST component.
 */
export const GST_RATE = 0.10;
export const GST_DIVISOR = 11;
""")

    write_file("packages/shared/src/constants/sda-pricing.ts", """import { BuildingType, DesignCategory } from '../types/pricing.types';

/**
 * SDA base annual rates for FY 2025-26.
 * Source: NDIS Pricing Arrangements for Specialist Disability Accommodation.
 * Updated each July.
 *
 * Key: `${BuildingType}|${DesignCategory}`
 * Value: base annual rate in dollars (before location factor)
 *
 * NOTE: These are approximate rates for development. Actual rates must be
 * verified against the published NDIS SDA Pricing Arrangements before
 * production use. Rates are seeded into sda_pricing_rates table.
 */
export const SDA_BASE_RATES_2025_26: Record<string, number> = {
  // House, 2 residents
  [`${BuildingType.HOUSE_2_RESIDENTS}|${DesignCategory.IMPROVED_LIVEABILITY}`]: 26380,
  [`${BuildingType.HOUSE_2_RESIDENTS}|${DesignCategory.FULLY_ACCESSIBLE}`]: 41400,
  [`${BuildingType.HOUSE_2_RESIDENTS}|${DesignCategory.ROBUST}`]: 46170,
  [`${BuildingType.HOUSE_2_RESIDENTS}|${DesignCategory.HIGH_PHYSICAL_SUPPORT}`]: 56880,

  // House, 3 residents
  [`${BuildingType.HOUSE_3_RESIDENTS}|${DesignCategory.IMPROVED_LIVEABILITY}`]: 19650,
  [`${BuildingType.HOUSE_3_RESIDENTS}|${DesignCategory.FULLY_ACCESSIBLE}`]: 30140,
  [`${BuildingType.HOUSE_3_RESIDENTS}|${DesignCategory.ROBUST}`]: 33630,
  [`${BuildingType.HOUSE_3_RESIDENTS}|${DesignCategory.HIGH_PHYSICAL_SUPPORT}`]: 40660,

  // Villa/duplex/townhouse, 1 resident
  [`${BuildingType.VILLA_1_RESIDENT}|${DesignCategory.IMPROVED_LIVEABILITY}`]: 36950,
  [`${BuildingType.VILLA_1_RESIDENT}|${DesignCategory.FULLY_ACCESSIBLE}`]: 54530,
  [`${BuildingType.VILLA_1_RESIDENT}|${DesignCategory.ROBUST}`]: 60810,
  [`${BuildingType.VILLA_1_RESIDENT}|${DesignCategory.HIGH_PHYSICAL_SUPPORT}`]: 73460,

  // Villa/duplex/townhouse, 2 residents
  [`${BuildingType.VILLA_2_RESIDENTS}|${DesignCategory.IMPROVED_LIVEABILITY}`]: 22400,
  [`${BuildingType.VILLA_2_RESIDENTS}|${DesignCategory.FULLY_ACCESSIBLE}`]: 34670,
  [`${BuildingType.VILLA_2_RESIDENTS}|${DesignCategory.ROBUST}`]: 38680,
  [`${BuildingType.VILLA_2_RESIDENTS}|${DesignCategory.HIGH_PHYSICAL_SUPPORT}`]: 47210,
};

/**
 * Supplement amounts (annual, before location factor).
 * NOTE: Approximate — verify against published NDIS data.
 */
export const OOA_SUPPLEMENT_ANNUAL = 11600;
export const BREAKOUT_ROOM_SUPPLEMENT_ANNUAL = 3680;
export const FIRE_SPRINKLER_SUPPLEMENT_ANNUAL = 2930;

export const CURRENT_FINANCIAL_YEAR = '2025-26';
""")

    write_file("packages/shared/src/constants/mrrc-rates.ts", """/**
 * MRRC (Maximum Reasonable Rent Contribution) component rates.
 * Formula: 25% of DSP + 25% of Pension Supplement + 100% of CRA
 *
 * Rates are per FORTNIGHT.
 * Updated ~2x per year when DSS publishes new rates (March + September).
 *
 * These are the rates as of March 2025. Verify against current DSS publications.
 */
export const MRRC_RATES = {
  effectiveFrom: '2025-03-20',
  dspBasicFortnight: 1116.30,      // Max basic rate Disability Support Pension
  pensionSuppFortnight: 83.20,     // Max Pension Supplement
  craMaxFortnight: 188.20,         // Max Commonwealth Rent Assistance
};

/**
 * MRRC formula constants.
 */
export const DSP_PERCENTAGE = 0.25;
export const PENSION_SUPP_PERCENTAGE = 0.25;
export const CRA_PERCENTAGE = 1.0;

/**
 * Conversion factors.
 */
export const FORTNIGHTS_PER_YEAR = 26;
export const MONTHS_PER_YEAR = 12;
""")

    write_file("packages/shared/src/constants/location-factors.ts", """/**
 * NDIS SDA Location Factors for FY 2025-26.
 * Multiplied against the base SDA rate.
 *
 * NOTE: This is a subset for development. Full table must be loaded
 * from the NDIS published location factors sheet into the
 * location_factors Supabase table.
 */
export const LOCATION_FACTORS: Record<string, { state: string; factor: number }> = {
  'Townsville': { state: 'QLD', factor: 1.08 },
  'Brisbane': { state: 'QLD', factor: 1.04 },
  'Gold Coast': { state: 'QLD', factor: 1.03 },
  'Cairns': { state: 'QLD', factor: 1.12 },
  'Sydney': { state: 'NSW', factor: 1.14 },
  'Melbourne': { state: 'VIC', factor: 1.06 },
  'Adelaide': { state: 'SA', factor: 1.00 },
  'Perth': { state: 'WA', factor: 1.09 },
  'Darwin': { state: 'NT', factor: 1.29 },
  'Hobart': { state: 'TAS', factor: 1.02 },
};
""")

    write_file("packages/shared/src/constants/ndis-item-codes.ts", """/**
 * NDIS SDA Support Item Codes.
 * Used when submitting claims.
 */
export const SDA_ITEM_CODES = {
  SDA_DAILY_RATE: '01_012_0107_5_1',
  // Add additional codes as needed
} as const;
""")

    write_file("packages/shared/src/constants/storage-paths.ts", """/**
 * Supabase Storage bucket names and path conventions.
 */
export const STORAGE_BUCKETS = {
  RENTAL_STATEMENTS: 'rental-statements',
  RECONCILIATIONS: 'reconciliations',
  PROPERTY_DOCUMENTS: 'property-documents',
  CLAIM_EVIDENCE: 'claim-evidence',
  VOICE_SUMMARIES: 'voice-summaries',
} as const;

/**
 * Generate storage paths following PF conventions.
 */
export function statementPath(propertyId: string, year: number, month: number): string {
  return `${propertyId}/${year}/${String(month).padStart(2, '0')}/statement.pdf`;
}

export function reconPdfPath(propertyId: string, year: number, month: number): string {
  return `${propertyId}/${year}/${String(month).padStart(2, '0')}/reconciliation.pdf`;
}

export function propertyDocPath(propertyId: string, docType: string, filename: string): string {
  return `${propertyId}/docs/${docType}/${filename}`;
}

export function voiceSummaryPath(clientId: string, year: number, month: number): string {
  return `${clientId}/${year}/${String(month).padStart(2, '0')}/summary.mp3`;
}
""")

    write_file("packages/shared/src/constants/design-categories.ts", """import { DesignCategory } from '../types/pricing.types';

/**
 * Design category metadata and validation rules.
 */
export const DESIGN_CATEGORY_INFO: Record<DesignCategory, {
  label: string;
  description: string;
  breakoutRoomAllowed: boolean;
}> = {
  [DesignCategory.BASIC]: {
    label: 'Basic',
    description: 'Housing without specialist design features but with room for carer',
    breakoutRoomAllowed: false,
  },
  [DesignCategory.IMPROVED_LIVEABILITY]: {
    label: 'Improved Liveability',
    description: 'Reasonable level of physical access and enhanced provision for sensory, intellectual or cognitive impairment',
    breakoutRoomAllowed: false,
  },
  [DesignCategory.FULLY_ACCESSIBLE]: {
    label: 'Fully Accessible',
    description: 'High level of physical access features for significant physical impairment',
    breakoutRoomAllowed: false,
  },
  [DesignCategory.ROBUST]: {
    label: 'Robust',
    description: 'Resilient design with high physical access provisions using durable materials',
    breakoutRoomAllowed: true, // Only category where breakout room is allowed
  },
  [DesignCategory.HIGH_PHYSICAL_SUPPORT]: {
    label: 'High Physical Support',
    description: 'Enhanced physical access for significant physical impairment with very high support needs',
    breakoutRoomAllowed: false,
  },
};
""")

    write_file("packages/shared/src/constants/building-types.ts", """import { BuildingType } from '../types/pricing.types';

export const BUILDING_TYPE_INFO: Record<BuildingType, {
  label: string;
  maxResidents: number;
}> = {
  [BuildingType.HOUSE_2_RESIDENTS]: { label: 'House, 2 residents', maxResidents: 2 },
  [BuildingType.HOUSE_3_RESIDENTS]: { label: 'House, 3 residents', maxResidents: 3 },
  [BuildingType.VILLA_1_RESIDENT]: { label: 'Villa/Duplex/Townhouse, 1 resident', maxResidents: 1 },
  [BuildingType.VILLA_2_RESIDENTS]: { label: 'Villa/Duplex/Townhouse, 2 residents', maxResidents: 2 },
};
""")

    write_file("packages/shared/src/constants/index.ts", """export * from './fee-structure';
export * from './sda-pricing';
export * from './mrrc-rates';
export * from './location-factors';
export * from './ndis-item-codes';
export * from './storage-paths';
export * from './design-categories';
export * from './building-types';
""")

    # ─── Utils ───
    write_file("packages/shared/src/utils/money.ts", """import type { Cents } from '../types/common.types';

/**
 * All monetary arithmetic uses integer cents to avoid floating-point errors.
 * Convert to dollars only for display.
 */

/** Convert dollars to cents */
export function toCents(dollars: number): Cents {
  return Math.round(dollars * 100);
}

/** Convert cents to dollars */
export function toDollars(cents: Cents): number {
  return cents / 100;
}

/** Format cents as AUD string */
export function formatAud(cents: Cents): string {
  const dollars = toDollars(cents);
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(dollars);
}

/** Calculate percentage of an amount (in cents) */
export function percentOf(cents: Cents, rate: number): Cents {
  return Math.round(cents * rate);
}

/** Sum an array of cent values */
export function sumCents(...values: Cents[]): Cents {
  return values.reduce((acc, val) => acc + val, 0);
}

/** GST: 1/11 of a GST-inclusive amount */
export function gstFromInclusive(inclusiveCents: Cents): Cents {
  return Math.round(inclusiveCents / 11);
}

/** Add GST to a GST-exclusive amount */
export function addGst(exclusiveCents: Cents): Cents {
  return Math.round(exclusiveCents * 1.1);
}
""")

    write_file("packages/shared/src/utils/dates.ts", """import type { Period } from '../types/common.types';

/** Format date as AU standard: DD/MM/YYYY */
export function formatDateAu(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Format date as US for PRODA CSV: YYYY/MM/DD */
export function formatDatePrrodaCsv(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/** Get first day of a period */
export function periodStart(period: Period): Date {
  return new Date(period.year, period.month - 1, 1);
}

/** Get last day of a period */
export function periodEnd(period: Period): Date {
  return new Date(period.year, period.month, 0);
}

/** Get number of days in a period */
export function daysInPeriod(period: Period): number {
  return periodEnd(period).getDate();
}

/** Get current period */
export function currentPeriod(): Period {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/** Format period as display string: "February 2026" */
export function formatPeriod(period: Period): string {
  const date = new Date(period.year, period.month - 1);
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

/** Format period as file-safe string: "2026-02" */
export function periodToString(period: Period): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

/** Detect financial year from a date: e.g. "2025-26" */
export function financialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 7) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

/** Calculate pro-rata days for mid-month occupancy */
export function proRataDays(
  periodDays: number,
  moveInDate?: Date,
  moveOutDate?: Date,
  period?: Period,
): number {
  if (!period) return periodDays;
  const start = periodStart(period);
  const end = periodEnd(period);

  const effectiveStart = moveInDate && moveInDate > start ? moveInDate : start;
  const effectiveEnd = moveOutDate && moveOutDate < end ? moveOutDate : end;

  const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
}
""")

    write_file("packages/shared/src/utils/ndis-number.ts", """/**
 * Validate NDIS participant number format.
 * NDIS numbers are typically 9 digits.
 */
export function isValidNdisNumber(ndisNumber: string): boolean {
  const cleaned = ndisNumber.replace(/\\s/g, '');
  return /^\\d{9}$/.test(cleaned);
}

/** Format NDIS number with standard spacing */
export function formatNdisNumber(ndisNumber: string): string {
  const cleaned = ndisNumber.replace(/\\s/g, '');
  if (cleaned.length !== 9) return ndisNumber;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}
""")

    write_file("packages/shared/src/utils/gst.ts", """import type { Cents } from '../types/common.types';
import { GST_DIVISOR } from '../constants/fee-structure';

/** Calculate GST component from a GST-inclusive amount */
export function gstFromInclusive(inclusiveAmount: Cents): Cents {
  return Math.round(inclusiveAmount / GST_DIVISOR);
}

/** Calculate GST-exclusive amount from GST-inclusive */
export function excludeGst(inclusiveAmount: Cents): Cents {
  return inclusiveAmount - gstFromInclusive(inclusiveAmount);
}

/** Add GST to a GST-exclusive amount */
export function includeGst(exclusiveAmount: Cents): Cents {
  return Math.round(exclusiveAmount * 1.1);
}
""")

    write_file("packages/shared/src/utils/filename.ts", """import type { Period } from '../types/common.types';
import { periodToString } from './dates';

/**
 * Generate PF-standard filenames.
 * Convention from PF Training Manual: "Reconciliation Stmt # for (month)"
 */
export function reconFilename(statementNumber: number, period: Period): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[period.month - 1];
  return `Reconciliation Stmt ${statementNumber} for ${monthName} ${period.year}`;
}

/** Generate claim reference: PF-2026-02-{propertyShort}-{participantShort} */
export function claimReference(
  period: Period,
  propertyLabel: string,
  participantLastName: string,
): string {
  const periodStr = periodToString(period);
  const propShort = propertyLabel.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const partShort = participantLastName.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();
  return `PF-${periodStr}-${propShort}-${partShort}`;
}
""")

    write_file("packages/shared/src/utils/period.ts", """import type { Period } from '../types/common.types';

/** Get previous period */
export function previousPeriod(period: Period): Period {
  if (period.month === 1) {
    return { month: 12, year: period.year - 1 };
  }
  return { month: period.month - 1, year: period.year };
}

/** Get next period */
export function nextPeriod(period: Period): Period {
  if (period.month === 12) {
    return { month: 1, year: period.year + 1 };
  }
  return { month: period.month + 1, year: period.year };
}

/** Compare two periods: -1 (a before b), 0 (equal), 1 (a after b) */
export function comparePeriods(a: Period, b: Period): number {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  return 0;
}

/** Check if a period is within a financial year (July to June) */
export function isInFinancialYear(period: Period, fyStartYear: number): boolean {
  if (period.year === fyStartYear && period.month >= 7) return true;
  if (period.year === fyStartYear + 1 && period.month <= 6) return true;
  return false;
}
""")

    write_file("packages/shared/src/utils/index.ts", """export * from './money';
export * from './dates';
export * from './ndis-number';
export * from './gst';
export * from './filename';
export * from './period';
""")

    # ─── Package barrel export ───
    write_file("packages/shared/src/index.ts", """export * from './types';
export * from './enums';
export * from './constants';
export * from './utils';
""")


# ═══════════════════════════════════════════════════════════════════════
#  PACKAGES/CORE — Domain Business Logic (Phase 1: Reconciliation + Pricing)
# ═══════════════════════════════════════════════════════════════════════
def create_core_package():
    print("\n📦 packages/core...")

    write_file("packages/core/package.json", """{
  "name": "@pf/core",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@pf/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
""")

    write_file("packages/core/tsconfig.json", """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
""")

    # ─── Reconciliation Engine ───
    write_file("packages/core/src/reconciliation/reconciliation.calculator.ts", """import {
  type Cents,
  type ReconciliationLineItemInput,
  LineItemCategory,
  percentOf,
  sumCents,
  gstFromInclusive,
} from '@pf/shared';
import { PF_FEE_RATE } from '@pf/shared';

export interface FeeCalculationInput {
  totalMoneyIn: Cents;
  agencyFeeRate: number;
}

export interface FeeCalculationResult {
  agencyManagementFee: Cents;
  pfManagementFee: Cents;
  gstOnPfFee: Cents;
  totalFees: Cents;
}

/**
 * Calculate management fees from total money in.
 * Agency fee: variable rate (e.g. 4.4%) of total money in
 * PF fee: 8.8% of total money in
 * GST: applied to PF fee (1/11 of GST-inclusive PF fee)
 */
export function calculateFees(input: FeeCalculationInput): FeeCalculationResult {
  const agencyManagementFee = percentOf(input.totalMoneyIn, input.agencyFeeRate);
  const pfManagementFee = percentOf(input.totalMoneyIn, PF_FEE_RATE);
  const gstOnPfFee = gstFromInclusive(pfManagementFee);

  return {
    agencyManagementFee,
    pfManagementFee,
    gstOnPfFee,
    totalFees: sumCents(agencyManagementFee, pfManagementFee),
  };
}

/**
 * Sum line items by category.
 */
export function sumByCategory(
  lineItems: ReconciliationLineItemInput[],
  category: LineItemCategory,
): Cents {
  return lineItems
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Calculate total money in (rent + SDA subsidy).
 */
export function calculateTotalMoneyIn(
  totalRent: Cents,
  sdaSubsidy: Cents,
): Cents {
  return sumCents(totalRent, sdaSubsidy);
}

/**
 * Calculate net client payout.
 * = total money in - agency fee - PF fee - maintenance - other deductions
 *
 * Energy reimbursement and energy invoice should net to zero
 * (tenant pays back what the energy company invoiced).
 */
export function calculateNetClientPayout(
  totalMoneyIn: Cents,
  agencyFee: Cents,
  pfFee: Cents,
  maintenanceCosts: Cents,
  otherDeductions: Cents,
): Cents {
  return totalMoneyIn - agencyFee - pfFee - maintenanceCosts - otherDeductions;
}
""")

    write_file("packages/core/src/reconciliation/reconciliation.service.ts", """import {
  type ReconciliationInput,
  type ReconciliationResult,
  LineItemCategory,
  LineItemSource,
  ReconStatus,
  toCents,
} from '@pf/shared';
import {
  calculateFees,
  calculateTotalMoneyIn,
  calculateNetClientPayout,
  sumByCategory,
} from './reconciliation.calculator';

export interface ReconciliationConfig {
  agencyFeeRate: number; // From the rental agency record
}

/**
 * Reconciliation Engine.
 *
 * Takes parsed rental statement line items + SDA subsidy amount,
 * calculates all fees and deductions, and produces the complete
 * reconciliation result.
 *
 * This replaces the manual spreadsheet copy-paste process described
 * in the PF Training Manual.
 */
export function generateReconciliation(
  input: ReconciliationInput,
  config: ReconciliationConfig,
): ReconciliationResult {
  // Ensure SDA subsidy is in line items
  const lineItems = [...input.lineItems];
  const hasSdaItem = lineItems.some(
    (item) => item.category === LineItemCategory.SDA_SUBSIDY,
  );
  if (!hasSdaItem && input.sdaSubsidyAmount > 0) {
    lineItems.push({
      category: LineItemCategory.SDA_SUBSIDY,
      description: 'SDA Government Subsidy (PRODA claim)',
      amount: input.sdaSubsidyAmount,
      source: LineItemSource.PRODA_CLAIM,
    });
  }

  // Sum by category
  const totalRentReceived = sumByCategory(lineItems, LineItemCategory.RENT);
  const totalSdaSubsidy = sumByCategory(lineItems, LineItemCategory.SDA_SUBSIDY);
  const energyReimbursement = sumByCategory(lineItems, LineItemCategory.ENERGY_REIMBURSEMENT);
  const energyInvoiceAmount = Math.abs(
    sumByCategory(lineItems, LineItemCategory.ENERGY_INVOICE),
  );
  const maintenanceCosts = Math.abs(
    sumByCategory(lineItems, LineItemCategory.MAINTENANCE),
  );
  const otherDeductions = Math.abs(
    sumByCategory(lineItems, LineItemCategory.OTHER),
  );

  // Calculate totals
  const totalMoneyIn = calculateTotalMoneyIn(totalRentReceived, totalSdaSubsidy);

  // Calculate fees
  const fees = calculateFees({
    totalMoneyIn,
    agencyFeeRate: config.agencyFeeRate,
  });

  // Calculate net client payout
  const netClientPayout = calculateNetClientPayout(
    totalMoneyIn,
    fees.agencyManagementFee,
    fees.pfManagementFee,
    maintenanceCosts,
    otherDeductions,
  );

  return {
    propertyId: input.propertyId,
    period: input.period,
    status: ReconStatus.GENERATED,
    statementNumber: input.statementNumber,

    totalRentReceived,
    totalSdaSubsidy,
    totalMoneyIn,

    agencyManagementFee: fees.agencyManagementFee,
    pfManagementFee: fees.pfManagementFee,
    gstPayable: fees.gstOnPfFee,
    energyReimbursement,
    energyInvoiceAmount,
    maintenanceCosts,
    otherDeductions,

    netClientPayout,

    lineItems,
  };
}
""")

    write_file("packages/core/src/reconciliation/reconciliation.validator.ts", """import type { ReconciliationResult } from '@pf/shared';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a generated reconciliation before approval.
 * Catches common errors that would otherwise be found manually.
 */
export function validateReconciliation(
  recon: ReconciliationResult,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Total money in must be positive
  if (recon.totalMoneyIn <= 0) {
    errors.push({
      field: 'totalMoneyIn',
      message: 'Total money in must be greater than zero',
    });
  }

  // Net payout should not be negative (unusual, flag for review)
  if (recon.netClientPayout < 0) {
    errors.push({
      field: 'netClientPayout',
      message: 'Net client payout is negative — review deductions',
    });
  }

  // Energy reimbursement should roughly match energy invoice
  // (tenant pays back what energy company charged)
  if (recon.energyReimbursement > 0 && recon.energyInvoiceAmount > 0) {
    const diff = Math.abs(recon.energyReimbursement - recon.energyInvoiceAmount);
    if (diff > 100) {
      // More than $1 difference
      errors.push({
        field: 'energy',
        message: `Energy reimbursement and invoice differ by ${(diff / 100).toFixed(2)} — should net to zero`,
      });
    }
  }

  // PF fee should be approximately 8.8% of total money in
  const expectedPfFee = Math.round(recon.totalMoneyIn * 0.088);
  if (Math.abs(recon.pfManagementFee - expectedPfFee) > 10) {
    errors.push({
      field: 'pfManagementFee',
      message: 'PF management fee does not match expected 8.8% rate',
    });
  }

  return errors;
}
""")

    write_file("packages/core/src/reconciliation/reconciliation.types.ts", """// Re-export from shared for convenience
export type {
  ReconciliationInput,
  ReconciliationResult,
  ReconciliationLineItemInput,
} from '@pf/shared';
export { LineItemCategory, LineItemSource } from '@pf/shared';
""")

    write_file("packages/core/src/reconciliation/index.ts", """export { generateReconciliation } from './reconciliation.service';
export type { ReconciliationConfig } from './reconciliation.service';
export { calculateFees, sumByCategory } from './reconciliation.calculator';
export { validateReconciliation } from './reconciliation.validator';
export type { ValidationError } from './reconciliation.validator';
export * from './reconciliation.types';
""")

    # ─── Reconciliation Tests ───
    write_file("packages/core/src/reconciliation/__tests__/reconciliation.service.test.ts", """import { describe, it, expect } from 'vitest';
import { generateReconciliation } from '../reconciliation.service';
import { LineItemCategory, LineItemSource, ReconStatus, toCents } from '@pf/shared';

describe('Reconciliation Engine', () => {
  const baseInput = {
    propertyId: 'prop-001',
    period: { month: 2, year: 2026 },
    statementNumber: 13,
    sdaSubsidyAmount: toCents(3500),
    lineItems: [
      {
        category: LineItemCategory.RENT,
        description: 'Tenant rent - February 2026',
        amount: toCents(800),
        source: LineItemSource.RENTAL_STATEMENT,
        sourceReference: 'Stmt 13',
      },
      {
        category: LineItemCategory.ENERGY_REIMBURSEMENT,
        description: 'Energy reimbursement from tenant',
        amount: toCents(150),
        source: LineItemSource.RENTAL_STATEMENT,
      },
      {
        category: LineItemCategory.ENERGY_INVOICE,
        description: 'Energy company invoice',
        amount: toCents(-150),
        source: LineItemSource.ENERGY_INVOICE,
      },
      {
        category: LineItemCategory.MAINTENANCE,
        description: 'Plumbing repair',
        amount: toCents(-220),
        source: LineItemSource.RENTAL_STATEMENT,
      },
    ],
  };

  const config = { agencyFeeRate: 0.044 };

  it('should calculate total money in as rent + SDA subsidy', () => {
    const result = generateReconciliation(baseInput, config);
    expect(result.totalRentReceived).toBe(toCents(800));
    expect(result.totalSdaSubsidy).toBe(toCents(3500));
    expect(result.totalMoneyIn).toBe(toCents(4300));
  });

  it('should calculate agency fee at 4.4%', () => {
    const result = generateReconciliation(baseInput, config);
    // 4300 * 0.044 = 189.20 → 18920 cents
    expect(result.agencyManagementFee).toBe(Math.round(toCents(4300) * 0.044));
  });

  it('should calculate PF fee at 8.8%', () => {
    const result = generateReconciliation(baseInput, config);
    // 4300 * 0.088 = 378.40 → 37840 cents
    expect(result.pfManagementFee).toBe(Math.round(toCents(4300) * 0.088));
  });

  it('should produce positive net client payout', () => {
    const result = generateReconciliation(baseInput, config);
    expect(result.netClientPayout).toBeGreaterThan(0);
  });

  it('should set status to GENERATED', () => {
    const result = generateReconciliation(baseInput, config);
    expect(result.status).toBe(ReconStatus.GENERATED);
  });

  it('should capture maintenance costs', () => {
    const result = generateReconciliation(baseInput, config);
    expect(result.maintenanceCosts).toBe(toCents(220));
  });

  it('should include SDA subsidy line item even if not in input', () => {
    const result = generateReconciliation(baseInput, config);
    const sdaItems = result.lineItems.filter(
      (i) => i.category === LineItemCategory.SDA_SUBSIDY,
    );
    expect(sdaItems.length).toBe(1);
    expect(sdaItems[0].amount).toBe(toCents(3500));
  });
});
""")

    write_file("packages/core/src/reconciliation/__tests__/reconciliation.calculator.test.ts", """import { describe, it, expect } from 'vitest';
import { calculateFees, calculateNetClientPayout } from '../reconciliation.calculator';
import { toCents } from '@pf/shared';

describe('Fee Calculator', () => {
  it('should calculate fees correctly for standard case', () => {
    const result = calculateFees({
      totalMoneyIn: toCents(4300),
      agencyFeeRate: 0.044,
    });
    expect(result.agencyManagementFee).toBe(Math.round(430000 * 0.044));
    expect(result.pfManagementFee).toBe(Math.round(430000 * 0.088));
  });

  it('should calculate GST as 1/11 of PF fee', () => {
    const result = calculateFees({
      totalMoneyIn: toCents(11000),
      agencyFeeRate: 0.044,
    });
    const expectedPfFee = Math.round(1100000 * 0.088);
    const expectedGst = Math.round(expectedPfFee / 11);
    expect(result.gstOnPfFee).toBe(expectedGst);
  });
});

describe('Net Client Payout', () => {
  it('should subtract all fees and costs from total money in', () => {
    const payout = calculateNetClientPayout(
      toCents(4300), // total money in
      toCents(189),  // agency fee
      toCents(378),  // PF fee
      toCents(220),  // maintenance
      toCents(0),    // other
    );
    expect(payout).toBe(toCents(4300 - 189 - 378 - 220));
  });
});
""")

    # ─── Pricing Calculator ───
    write_file("packages/core/src/pricing/sda-calculator.ts", """import {
  type SdaPricingInput,
  type SdaPricingResult,
  DesignCategory,
} from '@pf/shared';
import {
  SDA_BASE_RATES_2025_26,
  OOA_SUPPLEMENT_ANNUAL,
  BREAKOUT_ROOM_SUPPLEMENT_ANNUAL,
  FIRE_SPRINKLER_SUPPLEMENT_ANNUAL,
} from '@pf/shared';

/**
 * Calculate the expected annual SDA income for a property.
 *
 * Formula:
 *   (base_rate + supplements) × location_factor = annual SDA amount
 *
 * Supplements:
 *   - OOA (On-site Overnight Assistance)
 *   - Breakout room (Robust category only)
 *   - Fire sprinklers
 */
export function calculateSdaPricing(input: SdaPricingInput): SdaPricingResult {
  const rateKey = `${input.buildingType}|${input.designCategory}`;
  const baseAnnualRate = SDA_BASE_RATES_2025_26[rateKey];

  if (baseAnnualRate === undefined) {
    throw new Error(
      `No SDA rate found for building type "${input.buildingType}" and design category "${input.designCategory}". ` +
      `Note: "Basic" category is not available for new builds.`,
    );
  }

  // Calculate supplements
  const ooaSupplement = input.hasOoa ? OOA_SUPPLEMENT_ANNUAL : 0;
  const breakoutSupplement =
    input.hasBreakoutRoom && input.designCategory === DesignCategory.ROBUST
      ? BREAKOUT_ROOM_SUPPLEMENT_ANNUAL
      : 0;
  const fireSprinklerSupplement = input.hasFireSprinklers
    ? FIRE_SPRINKLER_SUPPLEMENT_ANNUAL
    : 0;

  const subtotalBeforeLocation =
    baseAnnualRate + ooaSupplement + breakoutSupplement + fireSprinklerSupplement;

  const annualSdaAmount = Math.round(subtotalBeforeLocation * input.locationFactor * 100) / 100;
  const monthlySdaAmount = Math.round((annualSdaAmount / 12) * 100) / 100;
  const dailySdaAmount = Math.round((annualSdaAmount / 365) * 100) / 100;

  return {
    baseAnnualRate,
    ooaSupplement,
    breakoutSupplement,
    fireSprinklerSupplement,
    subtotalBeforeLocation,
    locationFactor: input.locationFactor,
    annualSdaAmount,
    monthlySdaAmount,
    dailySdaAmount,
  };
}
""")

    write_file("packages/core/src/pricing/mrrc-calculator.ts", """import {
  type MrrcInput,
  type MrrcResult,
} from '@pf/shared';
import {
  DSP_PERCENTAGE,
  PENSION_SUPP_PERCENTAGE,
  CRA_PERCENTAGE,
  FORTNIGHTS_PER_YEAR,
  MONTHS_PER_YEAR,
} from '@pf/shared';

/**
 * Calculate Maximum Reasonable Rent Contribution (MRRC).
 *
 * Formula (per fortnight):
 *   25% of max basic DSP
 *   + 25% of max Pension Supplement
 *   + 100% of max Commonwealth Rent Assistance
 *
 * This is the amount the tenant (participant) pays as rent.
 */
export function calculateMrrc(input: MrrcInput): MrrcResult {
  const dspComponent = Math.round(input.dspBasicFortnight * DSP_PERCENTAGE * 100) / 100;
  const pensionComponent = Math.round(input.pensionSuppFortnight * PENSION_SUPP_PERCENTAGE * 100) / 100;
  const craComponent = Math.round(input.craMaxFortnight * CRA_PERCENTAGE * 100) / 100;

  const totalFortnightly = Math.round((dspComponent + pensionComponent + craComponent) * 100) / 100;
  const totalAnnual = Math.round(totalFortnightly * FORTNIGHTS_PER_YEAR * 100) / 100;
  const totalMonthly = Math.round((totalAnnual / MONTHS_PER_YEAR) * 100) / 100;

  return {
    dspComponent,
    pensionComponent,
    craComponent,
    totalFortnightly,
    totalMonthly,
    totalAnnual,
  };
}
""")

    write_file("packages/core/src/pricing/pro-rata.ts", """import type { Period } from '@pf/shared';
import { daysInPeriod } from '@pf/shared';

/**
 * Calculate pro-rata amount for partial-month occupancy.
 * Used when a participant moves in or out mid-month.
 */
export function proRataAmount(
  monthlyAmount: number,
  occupiedDays: number,
  period: Period,
): number {
  const totalDays = daysInPeriod(period);
  if (occupiedDays >= totalDays) return monthlyAmount;
  return Math.round((monthlyAmount * occupiedDays / totalDays) * 100) / 100;
}
""")

    write_file("packages/core/src/pricing/pricing.types.ts", """export type {
  SdaPricingInput,
  SdaPricingResult,
  MrrcInput,
  MrrcResult,
} from '@pf/shared';
""")

    write_file("packages/core/src/pricing/index.ts", """export { calculateSdaPricing } from './sda-calculator';
export { calculateMrrc } from './mrrc-calculator';
export { proRataAmount } from './pro-rata';
export * from './pricing.types';
""")

    write_file("packages/core/src/pricing/__tests__/sda-calculator.test.ts", """import { describe, it, expect } from 'vitest';
import { calculateSdaPricing } from '../sda-calculator';
import { BuildingType, DesignCategory } from '@pf/shared';

describe('SDA Pricing Calculator', () => {
  it('should calculate annual SDA for a standard Townsville property', () => {
    const result = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.FULLY_ACCESSIBLE,
      locationFactor: 1.08,
      hasOoa: false,
      hasBreakoutRoom: false,
      hasFireSprinklers: false,
    });

    expect(result.baseAnnualRate).toBe(41400);
    expect(result.locationFactor).toBe(1.08);
    expect(result.annualSdaAmount).toBeCloseTo(41400 * 1.08, 0);
    expect(result.monthlySdaAmount).toBeCloseTo((41400 * 1.08) / 12, 0);
  });

  it('should add OOA supplement when enabled', () => {
    const withOoa = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.FULLY_ACCESSIBLE,
      locationFactor: 1.0,
      hasOoa: true,
      hasBreakoutRoom: false,
      hasFireSprinklers: false,
    });

    const withoutOoa = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.FULLY_ACCESSIBLE,
      locationFactor: 1.0,
      hasOoa: false,
      hasBreakoutRoom: false,
      hasFireSprinklers: false,
    });

    expect(withOoa.annualSdaAmount).toBeGreaterThan(withoutOoa.annualSdaAmount);
    expect(withOoa.ooaSupplement).toBe(11600);
  });

  it('should only allow breakout room for Robust category', () => {
    const robust = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.ROBUST,
      locationFactor: 1.0,
      hasOoa: false,
      hasBreakoutRoom: true,
      hasFireSprinklers: false,
    });

    const nonRobust = calculateSdaPricing({
      buildingType: BuildingType.HOUSE_2_RESIDENTS,
      designCategory: DesignCategory.FULLY_ACCESSIBLE,
      locationFactor: 1.0,
      hasOoa: false,
      hasBreakoutRoom: true, // Should be ignored
      hasFireSprinklers: false,
    });

    expect(robust.breakoutSupplement).toBe(3680);
    expect(nonRobust.breakoutSupplement).toBe(0);
  });

  it('should throw for invalid building type + design category combo', () => {
    expect(() =>
      calculateSdaPricing({
        buildingType: BuildingType.HOUSE_2_RESIDENTS,
        designCategory: DesignCategory.BASIC,
        locationFactor: 1.0,
        hasOoa: false,
        hasBreakoutRoom: false,
        hasFireSprinklers: false,
      }),
    ).toThrow();
  });
});
""")

    write_file("packages/core/src/pricing/__tests__/mrrc-calculator.test.ts", """import { describe, it, expect } from 'vitest';
import { calculateMrrc } from '../mrrc-calculator';
import { MRRC_RATES } from '@pf/shared';

describe('MRRC Calculator', () => {
  it('should calculate MRRC from current rates', () => {
    const result = calculateMrrc({
      dspBasicFortnight: MRRC_RATES.dspBasicFortnight,
      pensionSuppFortnight: MRRC_RATES.pensionSuppFortnight,
      craMaxFortnight: MRRC_RATES.craMaxFortnight,
    });

    // 25% of 1116.30 = 279.075 → 279.08
    expect(result.dspComponent).toBeCloseTo(279.08, 1);
    // 25% of 83.20 = 20.80
    expect(result.pensionComponent).toBeCloseTo(20.80, 1);
    // 100% of 188.20 = 188.20
    expect(result.craComponent).toBeCloseTo(188.20, 1);

    expect(result.totalFortnightly).toBeCloseTo(279.08 + 20.80 + 188.20, 0);
    expect(result.totalAnnual).toBeCloseTo(result.totalFortnightly * 26, 0);
    expect(result.totalMonthly).toBeCloseTo(result.totalAnnual / 12, 0);
  });
});
""")

    # ─── Placeholder directories for later phases ───
    for subdir in ['properties', 'participants', 'clients', 'exceptions']:
        make_dirs(f"packages/core/src/{subdir}")
        make_dirs(f"packages/core/src/{subdir}/__tests__")

    # ─── Core barrel export ───
    write_file("packages/core/src/index.ts", """export * from './reconciliation';
export * from './pricing';
""")


# ═══════════════════════════════════════════════════════════════════════
#  PLACEHOLDER PACKAGES (structure only, code in later phases)
# ═══════════════════════════════════════════════════════════════════════
def create_placeholder_packages():
    print("\n📁 Placeholder packages (structure only)...")

    # packages/db
    pkg_json_template = lambda name, deps="": f"""{{"name": "@pf/{name}", "version": "0.0.1", "private": true, "main": "./src/index.ts", "types": "./src/index.ts"}}"""

    for pkg in ['db', 'api', 'integrations', 'ingestion', 'orchestration']:
        write_file(f"packages/{pkg}/package.json", f'{{"name": "@pf/{pkg}", "version": "0.0.1", "private": true, "main": "./src/index.ts", "types": "./src/index.ts"}}')
        write_file(f"packages/{pkg}/tsconfig.json", '{"extends": "../../tsconfig.base.json", "include": ["src/**/*"]}')
        write_file(f"packages/{pkg}/src/index.ts", f"// @pf/{pkg} — coming in Phase {'2' if pkg in ['api', 'integrations'] else '1' if pkg == 'db' else '3'}\nexport {{}};\n")

    # DB migrations directory
    make_dirs("packages/db/supabase/migrations")
    write_file("packages/db/supabase/config.toml", "# Supabase local config — run `supabase init` to populate\n")

    # DB queries directory
    for q in ['properties', 'participants', 'claims', 'reconciliations', 'service-bookings', 'exceptions']:
        write_file(f"packages/db/src/queries/{q}.queries.ts", f"// {q} queries — Phase 1/2\nexport {{}};\n")

    # Integrations subdirs
    for integration in ['ndia', 'google', 'xero', 'elevenlabs', 'docusign']:
        make_dirs(f"packages/integrations/src/{integration}")
        make_dirs(f"packages/integrations/src/{integration}/__tests__")

    # Ingestion subdirs
    for sub in ['statement-parser', 'statement-parser/adapters', 'statement-parser/__tests__', 'statement-parser/__tests__/__fixtures__', 'email-watcher', 'document-classifier']:
        make_dirs(f"packages/ingestion/src/{sub}")

    # Orchestration subdirs
    for sub in ['workflows', 'exceptions/rules', 'notifications/templates', 'notifications/channels']:
        make_dirs(f"packages/orchestration/src/{sub}")


# ═══════════════════════════════════════════════════════════════════════
#  PLACEHOLDER APPS (structure only)
# ═══════════════════════════════════════════════════════════════════════
def create_placeholder_apps():
    print("\n📁 Placeholder apps (structure only)...")

    # apps/web — will be scaffolded with `npx create-next-app` or manually
    write_file("apps/web/package.json", """{
  "name": "@pf/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@pf/shared": "workspace:*",
    "@pf/core": "workspace:*",
    "@pf/api": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/ssr": "^0.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
""")

    write_file("apps/web/tsconfig.json", """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
""")

    write_file("apps/web/next.config.ts", """import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@pf/shared', '@pf/core', '@pf/api'],
};

export default nextConfig;
""")

    write_file("apps/web/vercel.json", """{
  "crons": [
    {
      "path": "/api/cron/monthly-cycle",
      "schedule": "0 2 1 * *"
    },
    {
      "path": "/api/cron/ndia-sync",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/exception-check",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/payment-followup",
      "schedule": "0 9 * * *"
    }
  ]
}
""")

    # Minimal app shell
    write_file("apps/web/app/layout.tsx", """import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PF Platform — Property Friends',
  description: 'SDA claims, reconciliation, and property management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
""")

    write_file("apps/web/app/page.tsx", """export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">PF Platform</h1>
      <p className="mt-2 text-gray-600">
        SDA claims, reconciliation, and property management dashboard.
      </p>
      <p className="mt-4 text-sm text-gray-400">
        Phase 1 — Reconciliation engine, statement parser, SDA calculator.
      </p>
    </main>
  );
}
""")

    write_file("apps/web/app/globals.css", """@tailwind base;
@tailwind components;
@tailwind utilities;
""")

    write_file("apps/web/tailwind.config.ts", """import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
""")

    # Placeholder page directories
    for page_dir in [
        'app/(auth)/login',
        'app/properties', 'app/properties/new', 'app/properties/[id]',
        'app/properties/[id]/reconciliation', 'app/properties/[id]/claims',
        'app/properties/[id]/documents', 'app/properties/[id]/occupancy',
        'app/participants', 'app/participants/new', 'app/participants/[id]',
        'app/reconciliation', 'app/reconciliation/[period]',
        'app/claims', 'app/claims/ndia', 'app/claims/agency',
        'app/clients', 'app/clients/new', 'app/clients/[id]',
        'app/calculator', 'app/exceptions',
        'app/settings', 'app/settings/team', 'app/settings/integrations',
        'app/settings/pricing', 'app/settings/agencies',
        'app/api/webhooks/xero', 'app/api/webhooks/supabase', 'app/api/webhooks/gmail',
        'app/api/cron', 'app/api/upload/statement',
        'components/ui', 'components/layout', 'components/properties',
        'components/participants', 'components/reconciliation',
        'components/claims', 'components/calculator', 'components/exceptions',
        'components/charts',
        'hooks', 'lib/supabase', 'lib/trpc',
    ]:
        make_dirs(f"apps/web/{page_dir}")

    # apps/portal — minimal placeholder
    write_file("apps/portal/package.json", """{
  "name": "@pf/portal",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.43.0"
  }
}
""")
    make_dirs("apps/portal/app")
    make_dirs("apps/portal/components")


# ═══════════════════════════════════════════════════════════════════════
#  SUPABASE EDGE FUNCTIONS, SCRIPTS, DOCS
# ═══════════════════════════════════════════════════════════════════════
def create_supporting_dirs():
    print("\n📁 Supabase functions, scripts, docs...")

    # Supabase edge functions
    for fn in ['process-statement', 'generate-voice-summary', 'ndia-webhook-handler']:
        write_file(f"supabase/functions/{fn}/index.ts", f"// Supabase Edge Function: {fn}\n// Implemented in Phase 2/3\n\nDeno.serve(async (req) => {{\n  return new Response(JSON.stringify({{ status: 'ok', function: '{fn}' }}), {{\n    headers: {{ 'Content-Type': 'application/json' }},\n  }});\n}});\n")

    write_file("supabase/config.toml", """# Supabase local development config
# Run `supabase init` then `supabase start` for local dev
[api]
port = 54321

[db]
port = 54322

[studio]
port = 54323
""")

    # Scripts
    for script in ['seed-sda-rates', 'seed-location-factors', 'seed-mrrc-rates', 'seed-test-data']:
        write_file(f"scripts/seed/{script}.ts", f"// Seed script: {script}\n// Run: tsx scripts/seed/{script}.ts\nconsole.log('TODO: Implement {script}');\n")

    for script in ['import-properties', 'import-participants', 'import-past-reconciliations', 'import-past-claims', 'bulk-parse-statements']:
        write_file(f"scripts/backfill/{script}.ts", f"// Backfill script: {script}\n// Run: tsx scripts/backfill/{script}.ts\nconsole.log('TODO: Implement {script}');\n")

    write_file("scripts/utils/generate-types.sh", """#!/bin/bash
# Generate Supabase TypeScript types
# Requires: supabase CLI + running local instance or linked project
supabase gen types typescript --local > packages/db/src/types.ts
echo "✓ Types generated at packages/db/src/types.ts"
""")

    write_file("scripts/utils/reset-local-db.sh", """#!/bin/bash
# Reset local Supabase database
supabase db reset
echo "✓ Database reset complete"
""")

    # Docs
    for doc in ['architecture', 'data-model', 'data-inputs', 'stakeholders', 'deployment', 'onboarding']:
        write_file(f"docs/{doc}.md", f"# {doc.replace('-', ' ').title()}\n\nTODO: Document {doc}.\n")

    for doc in ['monthly-claim-cycle', 'reconciliation', 'ndia-claims', 'agency-claims', 'exception-handling']:
        write_file(f"docs/workflows/{doc}.md", f"# {doc.replace('-', ' ').title()}\n\nTODO: Document workflow.\n")

    for doc in ['ndia-api', 'google-workspace', 'xero', 'elevenlabs', 'supabase']:
        write_file(f"docs/integrations/{doc}.md", f"# {doc.replace('-', ' ').title()} Integration\n\nTODO: Document integration setup.\n")


# ═══════════════════════════════════════════════════════════════════════
#  GITHUB WORKFLOWS
# ═══════════════════════════════════════════════════════════════════════
def create_github_workflows():
    print("\n📁 GitHub workflows...")

    write_file(".github/workflows/ci.yml", """name: CI
on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
""")

    write_file(".github/CODEOWNERS", """# PF Platform code owners
* @pf-team
""")

    write_file(".github/pull_request_template.md", """## What
Brief description of changes.

## Why
Why these changes are needed.

## Testing
How to test these changes.

## Checklist
- [ ] Types compile (`pnpm typecheck`)
- [ ] Tests pass (`pnpm test`)
- [ ] Lint clean (`pnpm lint`)
""")


# ═══════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════
def main():
    os.makedirs(BASE, exist_ok=True)

    create_root_configs()
    create_shared_package()
    create_core_package()
    create_placeholder_packages()
    create_placeholder_apps()
    create_supporting_dirs()
    create_github_workflows()

    print(f"\n{'='*70}")
    print(f"  ✅ Scaffolding complete!")
    print(f"  📂 {BASE}")
    print(f"{'='*70}")
    print(f"""
  Next steps:
  1. cd {PROJECT_NAME}
  2. pnpm install
  3. pnpm test              (run reconciliation + pricing tests)
  4. pnpm typecheck          (verify everything compiles)

  Then open Claude Code:
     cd {BASE}
     claude
  And ask it to:
     "Read the project structure, install dependencies, and get tests passing"
""")


if __name__ == '__main__':
    main()
