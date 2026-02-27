-- Migration: 00001_create_enums
-- Create all custom Postgres enum types

CREATE TYPE building_type AS ENUM (
  'house_2_residents',
  'house_3_residents',
  'villa_1_resident',
  'villa_2_residents'
);

CREATE TYPE design_category AS ENUM (
  'basic',
  'improved_liveability',
  'fully_accessible',
  'robust',
  'high_physical_support'
);

CREATE TYPE sda_enrolment_status AS ENUM (
  'pending',
  'enrolled',
  'cancelled'
);

CREATE TYPE plan_management_type AS ENUM (
  'ndia_managed',
  'plan_managed',
  'self_managed'
);

CREATE TYPE plan_status AS ENUM (
  'active',
  'expiring',
  'expired'
);

CREATE TYPE claim_pathway AS ENUM (
  'ndia_managed',
  'agency_managed'
);

CREATE TYPE claim_status AS ENUM (
  'draft',
  'validated',
  'submitted',
  'approved',
  'rejected',
  'paid'
);

CREATE TYPE recon_status AS ENUM (
  'pending',
  'generated',
  'reviewed',
  'approved',
  'published'
);

CREATE TYPE parse_status AS ENUM (
  'pending',
  'parsed',
  'failed',
  'manual_review'
);

CREATE TYPE statement_format AS ENUM (
  'century21',
  'aaron_moon',
  'generic'
);

CREATE TYPE line_item_category AS ENUM (
  'rent',
  'sda_subsidy',
  'energy_reimbursement',
  'energy_invoice',
  'maintenance',
  'management_fee',
  'other'
);

CREATE TYPE line_item_source AS ENUM (
  'rental_statement',
  'proda_claim',
  'energy_invoice',
  'manual'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'coordinator',
  'finance'
);

CREATE TYPE client_entity_type AS ENUM (
  'individual',
  'company',
  'trust'
);

CREATE TYPE exception_type AS ENUM (
  'claim_rejection',
  'plan_expiry',
  'insufficient_funds',
  'missing_statement',
  'payment_overdue',
  'booking_expiry',
  'pace_transition'
);

CREATE TYPE exception_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

CREATE TYPE exception_status AS ENUM (
  'open',
  'acknowledged',
  'resolved',
  'dismissed'
);

CREATE TYPE booking_status AS ENUM (
  'active',
  'expired',
  'cancelled'
);

CREATE TYPE my_provider_status AS ENUM (
  'nominated',
  'not_nominated'
);
