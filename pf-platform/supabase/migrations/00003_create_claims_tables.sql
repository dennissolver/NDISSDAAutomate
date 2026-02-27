-- Migration: 00003_create_claims_tables
-- Create service_bookings and claims tables

CREATE TABLE service_bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id    uuid NOT NULL REFERENCES participants(id),
  property_id       uuid NOT NULL REFERENCES properties(id),
  ndia_booking_id   text UNIQUE,
  ndis_item_number  varchar(20) NOT NULL,
  start_date        date NOT NULL,
  end_date          date NOT NULL,
  allocated_amount  decimal(10,2) NOT NULL,
  claimed_ytd       decimal(10,2) DEFAULT 0,
  remaining_amount  decimal(10,2),
  status            booking_status NOT NULL,
  last_synced_at    timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE claims (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_reference     text UNIQUE,
  property_id         uuid NOT NULL REFERENCES properties(id),
  participant_id      uuid NOT NULL REFERENCES participants(id),
  service_booking_id  uuid REFERENCES service_bookings(id),
  reconciliation_id   uuid,  -- FK added after reconciliations table exists
  claim_pathway       claim_pathway NOT NULL,
  period_start        date NOT NULL,
  period_end          date NOT NULL,
  sda_amount          decimal(10,2) NOT NULL,
  mrrc_amount         decimal(10,2),
  total_amount        decimal(10,2) NOT NULL,
  ndis_item_number    varchar(20) NOT NULL,
  status              claim_status NOT NULL DEFAULT 'draft',
  ndia_request_id     text,
  ndia_response       jsonb,
  xero_invoice_id     text,
  rejection_reason    text,
  submitted_at        timestamptz,
  approved_at         timestamptz,
  paid_at             timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  UNIQUE (property_id, participant_id, period_start)
);
