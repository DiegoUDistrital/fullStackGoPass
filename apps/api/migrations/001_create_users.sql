CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  access_identifier VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  professional_profile TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
  state VARCHAR(20) NOT NULL CHECK (state IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);
