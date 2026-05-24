# @lithium-ai/postgres

PostgreSQL adapter for [@lithium-ai/core](https://www.npmjs.com/package/@lithium-ai/core).

Uses [`postgres`](https://github.com/porsager/postgres) (porsager) for tagged template queries and [`zod`](https://zod.dev) for runtime validation of database returns.

[![npm](https://img.shields.io/npm/v/@lithium-ai/postgres)](https://www.npmjs.com/package/@lithium-ai/postgres)
[![license](https://img.shields.io/npm/l/@lithium-ai/postgres)](./LICENSE)

---

## Install

```bash
npm install @lithium-ai/core @lithium-ai/postgres postgres
```

---

## Setup

### 1. Run Migrations

This package ships reference SQL migrations. Run them against your Postgres database:

```bash
psql -d your_database -f node_modules/@lithium-ai/postgres/src/migrations/001_clusters.sql
psql -d your_database -f node_modules/@lithium-ai/postgres/src/migrations/002_entries.sql
```

These create:
- `clusters` table with `ltree` path column, gist index, unique path constraint
- `entries` table with cluster FK
- `entry_versions` table with unique (entry_id, version) constraint

Requires the `ltree` extension (installed automatically by the migration).

### 2. Connect

```ts
import { Lithium } from "@lithium-ai/core";
import { postgresAdapter } from "@lithium-ai/postgres";
import postgres from "postgres";

const sql = postgres("postgres://user:pass@localhost:5432/mydb");
const lithium = new Lithium(postgresAdapter(sql));
```

### Custom Schema

By default, tables live in the `public` schema. To use a custom schema:

```ts
const lithium = new Lithium(
  postgresAdapter(sql, { schema: "lithium" })
);
```

Make sure to create the schema and run migrations against it first:

```sql
CREATE SCHEMA lithium;
SET search_path TO lithium;
-- Then run the migration files
```

The migration SQL uses unqualified table names, so `search_path` must be set to your target schema before running them.

---

## What's Included

### Cluster Adapter

Implements `ClusterStoragePort` from core:

| Method | SQL |
|---|---|
| `insert` | `INSERT INTO clusters ... RETURNING *` |
| `findByPath` | `WHERE path = $1::ltree` |
| `list` | `SELECT * FROM clusters ORDER BY path` |
| `listDescendantIds` | `WHERE path <@ $1::ltree` (ltree descendant query) |

### Entry Adapter

Implements `EntryStoragePort` from core:

| Method | SQL |
|---|---|
| `insert` | `INSERT INTO entries ... RETURNING *` |
| `insertVersion` | `INSERT INTO entry_versions ... RETURNING *` |
| `getLatestVersion` | `ORDER BY version DESC LIMIT 1` |
| `getLatestVersions` | `DISTINCT ON (entry_id) ORDER BY version DESC` |
| `getVersion` | `WHERE entry_id = $1 AND version = $2` |
| `findById` | `WHERE id = $1` |
| `list` | `WHERE cluster_id = ANY($1)` |

### Migrations

| File | Tables |
|---|---|
| `001_clusters.sql` | `clusters` (id, parent_id, path, name, description, created_at) |
| `002_entries.sql` | `entries` (id, cluster_id, created_at), `entry_versions` (id, entry_id, version, created_at) |

---

## Validation

All database returns are validated with Zod at the adapter boundary. If the database returns unexpected data (wrong types, missing columns, stale migrations), you get a `ValidationError` instead of silently passing bad data through.

Row data is transformed from snake_case to camelCase automatically:

```
parent_id  -> parentId
created_at -> createdAt
cluster_id -> clusterId
entry_id   -> entryId
```

---

## Requirements

- PostgreSQL with `ltree` extension
- Node.js >= 20

---

## License

MIT
