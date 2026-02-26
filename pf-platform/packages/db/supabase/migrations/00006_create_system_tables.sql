-- Migration: 00006_create_system_tables
-- Create users, exceptions, audit_log, notifications
-- Also add deferred FK: reconciliations.approved_by → users.id

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  email         text NOT NULL UNIQUE,
  full_name     text NOT NULL,
  role          user_role NOT NULL,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Add deferred FK: reconciliations.approved_by → users.id
ALTER TABLE reconciliations
  ADD CONSTRAINT fk_reconciliations_approved_by
  FOREIGN KEY (approved_by) REFERENCES users(id);

CREATE TABLE exceptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              exception_type NOT NULL,
  severity          exception_severity NOT NULL,
  title             text NOT NULL,
  description       text,
  property_id       uuid REFERENCES properties(id),
  participant_id    uuid REFERENCES participants(id),
  claim_id          uuid REFERENCES claims(id),
  reconciliation_id uuid REFERENCES reconciliations(id),
  status            exception_status NOT NULL DEFAULT 'open',
  assigned_to       uuid REFERENCES users(id),
  resolved_by       uuid REFERENCES users(id),
  resolved_at       timestamptz,
  resolution_notes  text,
  metadata          jsonb,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id),
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     uuid NOT NULL,
  changes       jsonb,
  ip_address    inet,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type        text NOT NULL,
  recipient_id          uuid NOT NULL,
  channel               text NOT NULL,
  template              text NOT NULL,
  subject               text,
  body                  text,
  voice_audio_url       text,
  related_entity_type   text,
  related_entity_id     uuid,
  sent_at               timestamptz,
  failed_at             timestamptz,
  error_message         text,
  created_at            timestamptz DEFAULT now()
);
