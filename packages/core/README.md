# @lithium-ai/core

Hierarchical versioned content store for structured context.

Zero runtime dependencies. TypeScript-first. Hex architecture.

[![npm](https://img.shields.io/npm/v/@lithium-ai/core)](https://www.npmjs.com/package/@lithium-ai/core)
[![license](https://img.shields.io/npm/l/@lithium-ai/core)](./LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@lithium-ai/core)](https://bundlephobia.com/package/@lithium-ai/core)

---

## Why?

Memory graphs and knowledge graphs don't scale for tree-structured data. They're built for arbitrary relationships, not hierarchies. When you need retrievable, scoped memory at scale, graph traversal becomes a bottleneck.

PostgreSQL's `ltree` extension handles tree queries orders of magnitude faster. Subtree lookups are index-backed, not traversal-based. And it runs on the database you already have.

Lithium Core wraps `ltree` in a clean TypeScript API with built-in versioning. Hierarchical storage, deterministic scoped queries, and immutable version history. No new infrastructure, no graph database, no vector search.

## What is this?

A storage engine for hierarchical, versioned content. Think of it as a tree of clusters where each cluster contains versioned entries. Your application's data references these entries. Lithium manages the tree structure and version history.

### Core Concepts

- **Clusters**: Nodes in a dot-separated tree hierarchy (e.g. `infra`, `infra.database`, `infra.database.postgres`). Powered by PostgreSQL `ltree` for fast hierarchical queries.
- **Entries**: Versioned records attached to clusters. Pure structure. Your content tables reference entry version IDs.
- **Entry Versions**: Immutable snapshots. Every update creates a new version. History is preserved.
- **Ports**: Storage interfaces that adapters implement. Core defines the contract, adapters handle the database.

### How it compares

| | Lithium | Graph DB (Neo4j) | Vector DB (Pinecone) |
|---|---|---|---|
| **Structure** | Tree hierarchy | Arbitrary graph | Flat |
| **Query speed** | `ltree` index, O(1) subtree | Graph traversal | ANN search |
| **Retrieval** | Deterministic, scoped | Pattern matching | Fuzzy, similarity |
| **Versioning** | Built-in, immutable | Manual | Overwrite |
| **Infrastructure** | Your existing Postgres | Separate service | Separate service |
| **Dependencies** | Zero (core) | Driver + service | SDK + service |

---

## Install

```bash
npm install @lithium-ai/core
# or
pnpm add @lithium-ai/core
```

You'll also need a database adapter:

```bash
npm install @lithium-ai/postgres
```

---

## Quick Start

```ts
import { Lithium } from "@lithium-ai/core";
import { postgresAdapter } from "@lithium-ai/postgres";
import postgres from "postgres";

const sql = postgres("postgres://...");
const lithium = new Lithium(postgresAdapter(sql));
```

### Create Clusters

```ts
// Root cluster
const infra = await lithium.clusters.create({ name: "infra" });
if (!infra.success) throw infra.error;

// Child cluster, parent resolved automatically
const db = await lithium.clusters.create({
  name: "database",
  parentPath: "infra",
});

// With description
await lithium.clusters.create({
  name: "auth",
  description: "Authentication and authorization",
});
```

### Query Clusters

```ts
// Find by path
const cluster = await lithium.clusters.findByPath({ path: "infra.database" });

// List all clusters
const all = await lithium.clusters.list();

// Get all descendant IDs (ltree-powered)
const ids = await lithium.clusters.listDescendantIds({ path: "infra" });
```

### Create Entries

Entries are pure structure. Your content lives in your own tables, referenced by entry version IDs.

```ts
// Create entry + version 1
const entry = await lithium.entries.create({
  clusterId: db.value.id,
});

// Your app stores content separately:
// INSERT INTO decisions (entry_version_id, title, content)
// VALUES (entry.value.version.id, 'Use PostgreSQL', '...')
```

### Update Entries (Auto-Versioning)

```ts
// Creates version 2 automatically
const v2 = await lithium.entries.update({ id: entry.value.entry.id });

// Your app stores new content against the new version ID
```

### Get Entries

```ts
// Get entry + latest version
const latest = await lithium.entries.get({ id: "entry-id" });

// Get entry + specific version
const v1 = await lithium.entries.get({ id: "entry-id", version: 1 });
```

### List Entries

```ts
// Get entries for specific clusters
const entries = await lithium.entries.list({
  clusterIds: ["cluster-id-1", "cluster-id-2"],
});

// Get entries with latest versions (batch, no N+1)
const withVersions = await lithium.entries.listWithLatestVersion({
  clusterIds: ids.value,
});
```

### The Full Flow: Scoped Context Retrieval

```ts
// "Give me everything under infra"
const descendantIds = await lithium.clusters.listDescendantIds({ path: "infra" });
if (!descendantIds.success) throw descendantIds.error;

const entriesWithVersions = await lithium.entries.listWithLatestVersion({
  clusterIds: descendantIds.value,
});
if (!entriesWithVersions.success) throw entriesWithVersions.error;

// Now join with your content table using the version IDs
const versionIds = entriesWithVersions.value.map((e) => e.version.id);
// SELECT * FROM decisions WHERE entry_version_id = ANY($1)
```

---

## Error Handling

Every method returns `Result<T, E>`. No thrown exceptions.

```ts
type Result<T, E extends Error> =
  | { success: true; value: T }
  | { success: false; error: E };
```

Three error classes with a `kind` discriminant:

```ts
import { ValidationError, NotFoundError, SystemError } from "@lithium-ai/core";

const result = await lithium.clusters.create({ name: "infra", parentPath: "nope" });

if (!result.success) {
  switch (result.error.kind) {
    case "NotFoundError":
      // Parent path doesn't exist
      break;
    case "ValidationError":
      // Invalid data
      break;
    case "SystemError":
      // Database/infrastructure failure
      break;
  }
}
```

Error types are explicit on every method. No default union. TypeScript tells you exactly which errors each method can return.

---

## Architecture

Lithium Core uses hex architecture. Services contain domain logic, ports define storage contracts, adapters implement them.

```
Lithium (entry point)
  -> ClusterService (domain logic)
       -> ClusterStoragePort (interface)
            -> PostgresClusterAdapter (implementation)
  -> EntryService (domain logic)
       -> EntryStoragePort (interface)
            -> PostgresEntryAdapter (implementation)
```

### Building Custom Adapters

Implement `ClusterStoragePort` and `EntryStoragePort` for your database:

```ts
import type { ClusterStoragePort, EntryStoragePort, LithiumAdapter } from "@lithium-ai/core";

const myAdapter: LithiumAdapter = {
  clusters: myClusterPort,
  entries: myEntryPort,
};

const lithium = new Lithium(myAdapter);
```

See `@lithium-ai/postgres` for a reference implementation.

---

## Types

### Cluster

```ts
interface Cluster {
  id: string;
  parentId: string | null;
  path: string;          // dot-separated: "infra.database.postgres"
  name: string;
  description: string | null;
  createdAt: Date;
}
```

### Entry

```ts
interface Entry {
  id: string;
  clusterId: string;
  createdAt: Date;
}
```

### EntryVersion

```ts
interface EntryVersion {
  id: string;
  entryId: string;
  version: number;
  createdAt: Date;
}
```

---

## API Reference

### `lithium.clusters`

| Method | Params | Returns | Errors |
|---|---|---|---|
| `create` | `{ name, parentPath?, description? }` | `Cluster` | `ValidationError \| NotFoundError \| SystemError` |
| `findByPath` | `{ path }` | `Cluster \| null` | `ValidationError \| SystemError` |
| `list` | — | `Cluster[]` | `ValidationError \| SystemError` |
| `listDescendantIds` | `{ path }` | `string[]` | `ValidationError \| SystemError` |

### `lithium.entries`

| Method | Params | Returns | Errors |
|---|---|---|---|
| `create` | `{ clusterId }` | `{ entry, version }` | `ValidationError \| SystemError` |
| `update` | `{ id }` | `EntryVersion` | `ValidationError \| NotFoundError \| SystemError` |
| `get` | `{ id, version? }` | `{ entry, version }` | `ValidationError \| NotFoundError \| SystemError` |
| `list` | `{ clusterIds }` | `Entry[]` | `ValidationError \| SystemError` |
| `listWithLatestVersion` | `{ clusterIds }` | `{ entry, version }[]` | `ValidationError \| SystemError` |

All methods return `Promise<Result<T, E>>`.

---

## Adapters

| Package | Database | Status |
|---|---|---|
| [`@lithium-ai/postgres`](https://www.npmjs.com/package/@lithium-ai/postgres) | PostgreSQL (ltree) | Available |
| `@lithium-ai/drizzle` | Drizzle ORM | Planned |
| `@lithium-ai/prisma` | Prisma | Planned |

---

## License

MIT
