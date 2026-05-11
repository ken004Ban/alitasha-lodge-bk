-- Run on existing Supabase/Postgres DBs that were created before branch-scoped analytics.
ALTER TABLE visitor_logs
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visitor_logs_branch_id ON visitor_logs (branch_id);
