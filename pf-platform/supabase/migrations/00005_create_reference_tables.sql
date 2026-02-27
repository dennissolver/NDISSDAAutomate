-- Migration: 00005_create_reference_tables
-- Create SDA pricing rates, location factors, and MRRC rates

CREATE TABLE sda_pricing_rates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_year      varchar(7) NOT NULL,
  building_type       building_type NOT NULL,
  design_category     design_category NOT NULL,
  base_annual_rate    decimal(10,2) NOT NULL,
  ooa_supplement      decimal(10,2) DEFAULT 0,
  breakout_supplement decimal(10,2) DEFAULT 0,
  fire_sprinkler_supp decimal(10,2) DEFAULT 0,
  effective_from      date NOT NULL,
  effective_to        date,
  created_at          timestamptz DEFAULT now(),

  UNIQUE (financial_year, building_type, design_category)
);

CREATE TABLE location_factors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name     text NOT NULL,
  state           varchar(3) NOT NULL,
  factor          decimal(4,2) NOT NULL,
  financial_year  varchar(7) NOT NULL,
  created_at      timestamptz DEFAULT now(),

  UNIQUE (region_name, financial_year)
);

CREATE TABLE mrrc_rates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_from          date NOT NULL,
  effective_to            date,
  dsp_basic_fortnight     decimal(8,2) NOT NULL,
  pension_supp_fortnight  decimal(8,2) NOT NULL,
  cra_max_fortnight       decimal(8,2) NOT NULL,
  calculated_mrrc         decimal(8,2),
  created_at              timestamptz DEFAULT now()
);
