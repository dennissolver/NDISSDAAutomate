-- Migration: 00010_create_rls_policies
-- Enable RLS on all tables and create role-based access policies
--
-- Role resolution helpers:
--   PF team role: looked up from users table via auth.uid()
--   Client identity: looked up from clients table via auth.uid()

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sda_pricing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrrc_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's internal role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is a client
CREATE OR REPLACE FUNCTION get_client_id()
RETURNS uuid AS $$
  SELECT id FROM clients WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT get_user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is internal team member (any role)
CREATE OR REPLACE FUNCTION is_team_member()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_active = true)
$$ LANGUAGE sql SECURITY DEFINER STABLE;

--------------------------------------------------------------------------------
-- CLIENTS
--------------------------------------------------------------------------------
-- Admin: full CRUD
CREATE POLICY clients_admin_all ON clients
  FOR ALL USING (is_admin());

-- Coordinator/Finance: read all
CREATE POLICY clients_team_select ON clients
  FOR SELECT USING (is_team_member());

-- Client: read/update own row
CREATE POLICY clients_own_select ON clients
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY clients_own_update ON clients
  FOR UPDATE USING (auth_user_id = auth.uid());

--------------------------------------------------------------------------------
-- PROPERTIES
--------------------------------------------------------------------------------
-- Admin/Coordinator: full CRUD
CREATE POLICY properties_admin_all ON properties
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

-- Finance: read all
CREATE POLICY properties_finance_select ON properties
  FOR SELECT USING (get_user_role() = 'finance');

-- Client: read own properties only
CREATE POLICY properties_client_select ON properties
  FOR SELECT USING (owner_id = get_client_id());

--------------------------------------------------------------------------------
-- PARTICIPANTS
--------------------------------------------------------------------------------
CREATE POLICY participants_admin_coord_all ON participants
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

CREATE POLICY participants_finance_select ON participants
  FOR SELECT USING (get_user_role() = 'finance');

--------------------------------------------------------------------------------
-- OCCUPANCIES
--------------------------------------------------------------------------------
CREATE POLICY occupancies_admin_coord_all ON occupancies
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

CREATE POLICY occupancies_finance_select ON occupancies
  FOR SELECT USING (get_user_role() = 'finance');

--------------------------------------------------------------------------------
-- PLAN_MANAGERS
--------------------------------------------------------------------------------
CREATE POLICY plan_managers_admin_coord_finance_all ON plan_managers
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator', 'finance'));

--------------------------------------------------------------------------------
-- RENTAL_AGENCIES
--------------------------------------------------------------------------------
CREATE POLICY rental_agencies_admin_all ON rental_agencies
  FOR ALL USING (is_admin());

CREATE POLICY rental_agencies_team_select ON rental_agencies
  FOR SELECT USING (is_team_member());

--------------------------------------------------------------------------------
-- SERVICE_BOOKINGS
--------------------------------------------------------------------------------
CREATE POLICY bookings_admin_coord_all ON service_bookings
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

CREATE POLICY bookings_finance_select ON service_bookings
  FOR SELECT USING (get_user_role() = 'finance');

--------------------------------------------------------------------------------
-- CLAIMS
--------------------------------------------------------------------------------
CREATE POLICY claims_admin_coord_all ON claims
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

CREATE POLICY claims_finance_select ON claims
  FOR SELECT USING (get_user_role() = 'finance');

--------------------------------------------------------------------------------
-- RECONCILIATIONS
--------------------------------------------------------------------------------
CREATE POLICY recon_admin_coord_all ON reconciliations
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

CREATE POLICY recon_finance_select ON reconciliations
  FOR SELECT USING (get_user_role() = 'finance');

-- Client: read own property reconciliations
CREATE POLICY recon_client_select ON reconciliations
  FOR SELECT USING (
    property_id IN (SELECT id FROM properties WHERE owner_id = get_client_id())
  );

--------------------------------------------------------------------------------
-- RECONCILIATION_LINE_ITEMS
--------------------------------------------------------------------------------
CREATE POLICY recon_items_admin_coord_all ON reconciliation_line_items
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

CREATE POLICY recon_items_finance_select ON reconciliation_line_items
  FOR SELECT USING (get_user_role() = 'finance');

-- Client: read line items for own property reconciliations
CREATE POLICY recon_items_client_select ON reconciliation_line_items
  FOR SELECT USING (
    reconciliation_id IN (
      SELECT r.id FROM reconciliations r
      JOIN properties p ON r.property_id = p.id
      WHERE p.owner_id = get_client_id()
    )
  );

--------------------------------------------------------------------------------
-- RENTAL_STATEMENTS
--------------------------------------------------------------------------------
CREATE POLICY statements_admin_coord_all ON rental_statements
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

CREATE POLICY statements_finance_select ON rental_statements
  FOR SELECT USING (get_user_role() = 'finance');

--------------------------------------------------------------------------------
-- SDA_PRICING_RATES
--------------------------------------------------------------------------------
CREATE POLICY sda_rates_admin_all ON sda_pricing_rates
  FOR ALL USING (is_admin());

CREATE POLICY sda_rates_team_select ON sda_pricing_rates
  FOR SELECT USING (is_team_member());

--------------------------------------------------------------------------------
-- LOCATION_FACTORS
--------------------------------------------------------------------------------
CREATE POLICY location_factors_admin_all ON location_factors
  FOR ALL USING (is_admin());

CREATE POLICY location_factors_team_select ON location_factors
  FOR SELECT USING (is_team_member());

--------------------------------------------------------------------------------
-- MRRC_RATES
--------------------------------------------------------------------------------
CREATE POLICY mrrc_rates_admin_all ON mrrc_rates
  FOR ALL USING (is_admin());

CREATE POLICY mrrc_rates_team_select ON mrrc_rates
  FOR SELECT USING (is_team_member());

--------------------------------------------------------------------------------
-- USERS
--------------------------------------------------------------------------------
CREATE POLICY users_admin_all ON users
  FOR ALL USING (is_admin());

-- All authenticated team members can read
CREATE POLICY users_team_select ON users
  FOR SELECT USING (is_team_member());

--------------------------------------------------------------------------------
-- EXCEPTIONS
--------------------------------------------------------------------------------
CREATE POLICY exceptions_admin_coord_all ON exceptions
  FOR ALL USING (get_user_role() IN ('admin', 'coordinator'));

CREATE POLICY exceptions_finance_select ON exceptions
  FOR SELECT USING (get_user_role() = 'finance');

--------------------------------------------------------------------------------
-- AUDIT_LOG (read-only for all team, no update/delete)
--------------------------------------------------------------------------------
-- Team members can read
CREATE POLICY audit_log_team_select ON audit_log
  FOR SELECT USING (is_team_member());

-- Only allow inserts (system/triggers insert; no direct user inserts needed via RLS)
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (is_team_member());

--------------------------------------------------------------------------------
-- NOTIFICATIONS
--------------------------------------------------------------------------------
CREATE POLICY notifications_admin_all ON notifications
  FOR ALL USING (is_admin());

CREATE POLICY notifications_team_select ON notifications
  FOR SELECT USING (is_team_member());

-- Client: read own notifications
CREATE POLICY notifications_client_select ON notifications
  FOR SELECT USING (
    recipient_type = 'client' AND recipient_id = get_client_id()
  );
