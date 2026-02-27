-- Migration: 00008_create_indexes
-- Create all indexes across all tables

-- properties
CREATE INDEX idx_properties_owner ON properties (owner_id);
CREATE INDEX idx_properties_agency ON properties (rental_agency_id);
CREATE INDEX idx_properties_enrolment ON properties (sda_enrolment_status);

-- participants
CREATE INDEX idx_participants_ndis ON participants (ndis_number);
CREATE INDEX idx_participants_plan_status ON participants (plan_status);
CREATE INDEX idx_participants_plan_end ON participants (plan_end_date);

-- occupancies
CREATE INDEX idx_occupancies_property ON occupancies (property_id);
CREATE INDEX idx_occupancies_participant ON occupancies (participant_id);
CREATE INDEX idx_occupancies_active ON occupancies (property_id) WHERE end_date IS NULL;

-- service_bookings
CREATE INDEX idx_bookings_participant ON service_bookings (participant_id);
CREATE INDEX idx_bookings_property ON service_bookings (property_id);
CREATE INDEX idx_bookings_active ON service_bookings (status) WHERE status = 'active';

-- claims
CREATE INDEX idx_claims_property ON claims (property_id);
CREATE INDEX idx_claims_participant ON claims (participant_id);
CREATE INDEX idx_claims_status ON claims (status);
CREATE INDEX idx_claims_period ON claims (period_start, period_end);
CREATE INDEX idx_claims_recon ON claims (reconciliation_id);

-- reconciliations
CREATE INDEX idx_recon_property ON reconciliations (property_id);
CREATE INDEX idx_recon_period ON reconciliations (period_year, period_month);

-- reconciliation_line_items
CREATE INDEX idx_recon_items_recon ON reconciliation_line_items (reconciliation_id);

-- rental_statements
CREATE INDEX idx_statements_property ON rental_statements (property_id);
CREATE INDEX idx_statements_period ON rental_statements (statement_year, statement_month);

-- exceptions
CREATE INDEX idx_exceptions_status ON exceptions (status) WHERE status = 'open';
CREATE INDEX idx_exceptions_type ON exceptions (type);
CREATE INDEX idx_exceptions_assigned ON exceptions (assigned_to);

-- audit_log
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log (user_id);
CREATE INDEX idx_audit_created ON audit_log (created_at);

-- notifications
CREATE INDEX idx_notif_recipient ON notifications (recipient_type, recipient_id);
