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

CREATE TABLE entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id  UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_entries_cluster_id ON entries (cluster_id);

CREATE TABLE entry_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_entry_versions_entry_version UNIQUE (entry_id, version)
);

CREATE INDEX idx_entry_versions_entry_id ON entry_versions (entry_id);

CREATE TABLE content (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_version_id  UUID NOT NULL REFERENCES entry_versions(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_entry_version_id ON content (entry_version_id);
