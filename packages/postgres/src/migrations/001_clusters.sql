CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE clusters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES clusters(id) ON DELETE CASCADE,
  path        ltree NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_clusters_path UNIQUE (path)
);

CREATE INDEX idx_clusters_path_gist ON clusters USING gist (path);
CREATE INDEX idx_clusters_parent_id ON clusters (parent_id);
