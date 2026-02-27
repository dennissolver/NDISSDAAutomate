-- Migration: 00009_create_triggers
-- Create PL/pgSQL functions and trigger bindings

-- 1. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Auto-calculate total_money_in on reconciliations
CREATE OR REPLACE FUNCTION calc_total_money_in()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_money_in := COALESCE(NEW.total_rent_received, 0)
                      + COALESCE(NEW.total_sda_subsidy, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Auto-calculate remaining_amount on service_bookings
CREATE OR REPLACE FUNCTION calc_booking_remaining()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_amount := NEW.allocated_amount - COALESCE(NEW.claimed_ytd, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Auto-calculate MRRC
CREATE OR REPLACE FUNCTION calc_mrrc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.calculated_mrrc := (NEW.dsp_basic_fortnight * 0.25)
                       + (NEW.pension_supp_fortnight * 0.25)
                       + (NEW.cra_max_fortnight * 1.0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all mutable tables
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_occupancies_updated_at
  BEFORE UPDATE ON occupancies
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_plan_managers_updated_at
  BEFORE UPDATE ON plan_managers
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_service_bookings_updated_at
  BEFORE UPDATE ON service_bookings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_reconciliations_updated_at
  BEFORE UPDATE ON reconciliations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_exceptions_updated_at
  BEFORE UPDATE ON exceptions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Apply calc_total_money_in trigger to reconciliations
CREATE TRIGGER trg_recon_calc_money_in
  BEFORE INSERT OR UPDATE ON reconciliations
  FOR EACH ROW EXECUTE FUNCTION calc_total_money_in();

-- Apply calc_booking_remaining trigger to service_bookings
CREATE TRIGGER trg_bookings_calc_remaining
  BEFORE INSERT OR UPDATE ON service_bookings
  FOR EACH ROW EXECUTE FUNCTION calc_booking_remaining();

-- Apply calc_mrrc trigger to mrrc_rates
CREATE TRIGGER trg_mrrc_calc
  BEFORE INSERT OR UPDATE ON mrrc_rates
  FOR EACH ROW EXECUTE FUNCTION calc_mrrc();
