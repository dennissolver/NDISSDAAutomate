-- Migration: 00012_create_storage_buckets
-- Create private storage buckets and their RLS policies

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('rental-statements', 'rental-statements', false),
  ('reconciliations', 'reconciliations', false),
  ('property-documents', 'property-documents', false),
  ('claim-evidence', 'claim-evidence', false),
  ('voice-summaries', 'voice-summaries', false);

-- Storage RLS policies
-- Team members (admin/coordinator/finance) can access all buckets
CREATE POLICY storage_team_select ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('rental-statements', 'reconciliations', 'property-documents', 'claim-evidence', 'voice-summaries')
    AND EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY storage_team_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('rental-statements', 'reconciliations', 'property-documents', 'claim-evidence', 'voice-summaries')
    AND EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY storage_team_update ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('rental-statements', 'reconciliations', 'property-documents', 'claim-evidence', 'voice-summaries')
    AND EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY storage_team_delete ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('rental-statements', 'reconciliations', 'property-documents', 'claim-evidence', 'voice-summaries')
    AND EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Clients can read their own property paths in reconciliations and voice-summaries buckets
CREATE POLICY storage_client_recon_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reconciliations'
    AND EXISTS (
      SELECT 1 FROM properties p
      JOIN clients c ON p.owner_id = c.id
      WHERE c.auth_user_id = auth.uid()
        AND name LIKE p.id::text || '/%'
    )
  );

CREATE POLICY storage_client_voice_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-summaries'
    AND EXISTS (
      SELECT 1 FROM clients c
      WHERE c.auth_user_id = auth.uid()
        AND name LIKE c.id::text || '/%'
    )
  );
