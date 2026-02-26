-- Migration: 00007_seed_rental_agencies
-- Seed known rental agencies with their fee rates and statement format identifiers

INSERT INTO rental_agencies (name, fee_rate, statement_format, sender_email_pattern)
VALUES
  ('Century 21', 0.0440, 'century21', '*@century21.com.au'),
  ('Aaron Moon Realty', 0.0440, 'aaron_moon', '*@aaronmoon.com.au');
