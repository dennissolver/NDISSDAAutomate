-- Migration: 00004_create_reconciliation_tables
-- Create reconciliations, reconciliation_line_items, rental_statements
-- Also add the deferred FK from claims → reconciliations

CREATE TABLE reconciliations (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id             uuid NOT NULL REFERENCES properties(id),
  period_month            int NOT NULL,
  period_year             int NOT NULL,
  statement_number        int,
  status                  recon_status NOT NULL DEFAULT 'pending',
  -- Money in
  total_rent_received     decimal(10,2),
  total_sda_subsidy       decimal(10,2),
  total_money_in          decimal(10,2),
  -- Deductions
  agency_management_fee   decimal(10,2),
  pf_management_fee       decimal(10,2),
  gst_payable             decimal(10,2),
  energy_reimbursement    decimal(10,2),
  energy_invoice_amount   decimal(10,2),
  maintenance_costs       decimal(10,2),
  other_deductions        decimal(10,2),
  -- Result
  net_client_payout       decimal(10,2),
  -- Workflow
  approved_by             uuid,  -- FK to users added in 00006
  approved_at             timestamptz,
  published_at            timestamptz,
  -- Storage
  statement_pdf_path      text,
  drive_file_id           text,
  notes                   text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),

  UNIQUE (property_id, period_year, period_month)
);

CREATE TABLE reconciliation_line_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid NOT NULL REFERENCES reconciliations(id) ON DELETE CASCADE,
  category          line_item_category NOT NULL,
  description       text NOT NULL,
  amount            decimal(10,2) NOT NULL,
  source            line_item_source,
  source_reference  text,
  sort_order        int DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE rental_statements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         uuid NOT NULL REFERENCES properties(id),
  rental_agency_id    uuid NOT NULL REFERENCES rental_agencies(id),
  statement_number    int,
  statement_month     int NOT NULL,
  statement_year      int NOT NULL,
  total_amount        decimal(10,2),
  raw_parsed_data     jsonb,
  source_email_id     text,
  storage_object_path text,
  parse_status        parse_status DEFAULT 'pending',
  parsed_at           timestamptz,
  created_at          timestamptz DEFAULT now(),

  UNIQUE (property_id, statement_year, statement_month)
);

-- Add deferred FK: claims.reconciliation_id → reconciliations.id
ALTER TABLE claims
  ADD CONSTRAINT fk_claims_reconciliation
  FOREIGN KEY (reconciliation_id) REFERENCES reconciliations(id);
