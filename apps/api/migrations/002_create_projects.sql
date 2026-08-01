CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  responsible_admin_id UUID NOT NULL REFERENCES users(id),
  eta TIMESTAMPTZ NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('planned', 'active', 'on_hold', 'completed', 'archived')),
  progress_calculated NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);
