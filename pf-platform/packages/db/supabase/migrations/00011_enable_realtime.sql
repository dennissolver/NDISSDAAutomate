-- Migration: 00011_enable_realtime
-- Enable Supabase Realtime on tables that need live dashboard updates

ALTER PUBLICATION supabase_realtime ADD TABLE claims;
ALTER PUBLICATION supabase_realtime ADD TABLE reconciliations;
ALTER PUBLICATION supabase_realtime ADD TABLE exceptions;
