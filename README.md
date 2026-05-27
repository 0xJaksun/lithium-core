# Lithium

Hierarchical versioned storage on PostgreSQL ltree. Scoped retrieval, built-in versioning, zero runtime deps.

```ts
const lithium = new Lithium(postgresAdapter(sql));

await lithium.clusters.create({ name: "infra" });
await lithium.clusters.create({ name: "database", parentPath: "infra" });

const context = await lithium.getContext({ path: "infra" });
```

[![core](https://img.shields.io/npm/v/@lithium-ai/core?label=core)](https://www.npmjs.com/package/@lithium-ai/core)
[![postgres](https://img.shields.io/npm/v/@lithium-ai/postgres?label=postgres)](https://www.npmjs.com/package/@lithium-ai/postgres)
[![mcp](https://img.shields.io/npm/v/@lithium-ai/mcp?label=mcp)](https://www.npmjs.com/package/@lithium-ai/mcp)
[![license](https://img.shields.io/github/license/0xJaksun/lithium-core)](./LICENSE)

---

## Why?

Memory graphs don't scale for tree-structured data. Graph traversal becomes a bottleneck. Vector search gives you "similar to X" when you need "everything under X."

PostgreSQL's `ltree` handles tree queries orders of magnitude faster. Index-backed subtree lookups, not traversal. Lithium wraps it in a clean TypeScript API with built-in versioning.

| | Lithium | Graph DB (Neo4j) | Vector DB (Pinecone) |
|---|---|---|---|
| **Structure** | Tree hierarchy | Arbitrary graph | Flat |
| **Query speed** | ltree index-backed | Graph traversal | ANN search |
| **Retrieval** | Deterministic, scoped | Pattern matching | Fuzzy, similarity |
| **Versioning** | Built-in, immutable | Manual | Overwrite |
| **Infrastructure** | Your existing Postgres | Separate service | Separate service |

---

## Packages

```
@lithium-ai/core        Zero-dep storage engine         5 KB
@lithium-ai/postgres     PostgreSQL ltree adapter         4 KB
@lithium-ai/mcp          MCP server for AI tools          3 KB
```

## Quick Start

**Prerequisites:** PostgreSQL with `ltree` extension.

```bash
npm install @lithium-ai/core @lithium-ai/postgres
```

```ts
import { Lithium } from "@lithium-ai/core";
import { postgresAdapter } from "@lithium-ai/postgres";
import postgres from "postgres";

const sql = postgres("postgres://...");
const lithium = new Lithium(postgresAdapter(sql));

// Create hierarchy
await lithium.clusters.create({ name: "infra" });
await lithium.clusters.create({ name: "database", parentPath: "infra" });

// Create versioned entries
const entry = await lithium.entries.create({ clusterId: "..." });
await lithium.entries.update({ id: entry.value.entry.id });

// Scoped retrieval: everything under "infra"
const context = await lithium.getContext({ path: "infra" });
```

## Connect to Claude

```bash
npm install @lithium-ai/mcp
```

```ts
// server.ts
import { Lithium } from "@lithium-ai/core";
import { postgresAdapter } from "@lithium-ai/postgres";
import { serveMcp } from "@lithium-ai/mcp";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

const lithium = new Lithium(postgresAdapter(sql), async (versionIds) => {
  const rows = await sql`
    SELECT entry_version_id, title, content
    FROM your_content_table
    WHERE entry_version_id = ANY(${versionIds})
  `;
  return new Map(rows.map((r) => [r.entry_version_id, r]));
});

serveMcp(lithium);
```

Add to Claude Code:

```json
{
  "mcpServers": {
    "lithium": {
      "command": "npx",
      "args": ["tsx", "server.ts"]
    }
  }
}
```

## Data Model

Entries are pure structure. Your content lives in your own tables, referenced by entry version IDs.

```
Cluster
  id, parentId, path ("infra.database"), name, description, createdAt

Entry
  id, clusterId, createdAt

EntryVersion
  id, entryId, version (auto-incremented), createdAt

Your Content Table
  entryVersionId (FK), title, content, ...whatever you want
```

## API

### Clusters

| Method | What |
|---|---|
| `create({ name, parentPath?, description? })` | Create cluster, resolve parent |
| `findByPath({ path })` | Find by dot-path |
| `list()` | All clusters ordered by path |
| `listDescendantIds({ path })` | ltree subtree query |

### Entries

| Method | What |
|---|---|
| `create({ clusterId })` | New entry + version 1 |
| `update({ id })` | Auto-increment version |
| `get({ id, version? })` | Entry + version (latest or specific) |
| `list({ clusterIds })` | Entries by cluster IDs |
| `listWithLatestVersion({ clusterIds })` | Entries + latest versions (batch) |

### Context

| Method | What |
|---|---|
| `getContext({ path })` | Scoped retrieval with optional content resolver |

## Error Handling

Every method returns `Result<T, E>`. No thrown exceptions.

```ts
const result = await lithium.clusters.create({ name: "infra" });
if (!result.success) {
  // result.error is ValidationError | NotFoundError | SystemError
  // Discriminate via error.kind or instanceof
}
```

## Migrations

Run the reference SQL migrations from `@lithium-ai/postgres`:

```bash
psql -d your_db -f node_modules/@lithium-ai/postgres/src/migrations/001_clusters.sql
psql -d your_db -f node_modules/@lithium-ai/postgres/src/migrations/002_entries.sql
```

## Roadmap

- [x] Core storage engine (`@lithium-ai/core`)
- [x] PostgreSQL ltree adapter (`@lithium-ai/postgres`)
- [x] MCP server (`@lithium-ai/mcp`)
- [x] Content resolver callback for `getContext`
- [ ] Drizzle ORM adapter
- [ ] Prisma adapter
- [ ] Transaction support
- [ ] Delete operations
- [ ] GitHub Actions CI
- [ ] Example projects

## Contributing

Issues and PRs welcome.

## License

MIT
