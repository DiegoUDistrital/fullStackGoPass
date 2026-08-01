CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY,
  project_id UUID NULL REFERENCES projects(id),
  task_id UUID NULL REFERENCES tasks(id),
  author_user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT comments_resource_chk CHECK (
    (project_id IS NOT NULL AND task_id IS NULL)
    OR
    (project_id IS NULL AND task_id IS NOT NULL)
  )
);
