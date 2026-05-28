# Lithium

Hierarchical versioned storage on PostgreSQL ltree. Scoped retrieval, built-in versioning, zero runtime deps.

```ts
const lithium = new Lithium(drizzleAdapter(db));

await lithium.clusters.create({ name: "infra" });
await lithium.clusters.create({ name: "database", parentPath: "infra" });

const context = await lithium.getContext({ path: "infra" });
```

[![core](https://img.shields.io/npm/v/@lithium-ai/core?label=core)](https://www.npmjs.com/package/@lithium-ai/core)
[![postgres](https://img.shields.io/npm/v/@lithium-ai/postgres?label=postgres)](https://www.npmjs.com/package/@lithium-ai/postgres)
[![drizzle](https://img.shields.io/npm/v/@lithium-ai/drizzle?label=drizzle)](https://www.npmjs.com/package/@lithium-ai/drizzle)
[![mcp](https://img.shields.io/npm/v/@lithium-ai/mcp?label=mcp)](https://www.npmjs.com/package/@lithium-ai/mcp)
[![license](https://img.shields.io/github/license/0xJaksun/lithium-core)](./LICENSE)

---

## Why?

Memory graphs don't scale for tree-structured data. Graph traversal becomes a bottleneck. Vector search gives you "similar to X" when you need "everything under X."

PostgreSQL's `ltree` handles tree queries significantly faster. Index-backed subtree lookups, not traversal. Lithium wraps it in a clean TypeScript API with built-in versioning.

|                    | Lithium                | Graph DBs        | Vector DBs        |
| ------------------ | ---------------------- | ---------------- | ----------------- |
| **Structure**      | Tree hierarchy         | Arbitrary graph  | Flat              |
| **Query speed**    | ltree index-backed     | Graph traversal  | ANN search        |
| **Retrieval**      | Deterministic, scoped  | Pattern matching | Fuzzy, similarity |
| **Versioning**     | Built-in, immutable    | Manual           | Overwrite         |
| **Infrastructure** | Your existing Postgres | Separate service | Separate service  |

---

## Packages

| Package | What | Size |
|---|---|---|
| `@lithium-ai/core` | Zero-dep storage engine | [![](https://img.shields.io/bundlephobia/minzip/@lithium-ai/core)](https://bundlephobia.com/package/@lithium-ai/core) |
| `@lithium-ai/postgres` | PostgreSQL ltree adapter | [![](https://img.shields.io/bundlephobia/minzip/@lithium-ai/postgres)](https://bundlephobia.com/package/@lithium-ai/postgres) |
| `@lithium-ai/drizzle` | Drizzle ORM adapter | [![](https://img.shields.io/bundlephobia/minzip/@lithium-ai/drizzle)](https://bundlephobia.com/package/@lithium-ai/drizzle) |
| `@lithium-ai/mcp` | MCP server for AI tools | [![](https://img.shields.io/bundlephobia/minzip/@lithium-ai/mcp)](https://bundlephobia.com/package/@lithium-ai/mcp) |

## Quick Start

**Prerequisites:** PostgreSQL with `ltree` extension.

**With Drizzle:**

```bash
npm install @lithium-ai/core @lithium-ai/drizzle drizzle-orm
```

```ts
import { Lithium } from "@lithium-ai/core";
import { drizzleAdapter } from "@lithium-ai/drizzle";

const lithium = new Lithium(drizzleAdapter(db));
```

**With raw postgres:**

```bash
npm install @lithium-ai/core @lithium-ai/postgres postgres
```

```ts
import { Lithium } from "@lithium-ai/core";
import { postgresAdapter } from "@lithium-ai/postgres";
import postgres from "postgres";

const sql = postgres("postgres://...");
const lithium = new Lithium(postgresAdapter(sql));
```

**Then:**

```ts
// Create hierarchy
const infra = await lithium.clusters.create({ name: "infra" });
await lithium.clusters.create({ name: "database", parentPath: "infra" });

// Create versioned entries
const entry = await lithium.entries.create({ clusterId: infra.value.id });
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

| Method                                        | What                           |
| --------------------------------------------- | ------------------------------ |
| `create({ name, parentPath?, description? })` | Create cluster, resolve parent |
| `findByPath({ path })`                        | Find by dot-path               |
| `list()`                                      | All clusters ordered by path   |
| `listDescendantIds({ path })`                 | ltree subtree query            |

### Entries

| Method                                  | What                                 |
| --------------------------------------- | ------------------------------------ |
| `create({ clusterId })`                 | New entry + version 1                |
| `update({ id })`                        | Auto-increment version               |
| `get({ id, version? })`                 | Entry + version (latest or specific) |
| `list({ clusterIds })`                  | Entries by cluster IDs               |
| `listWithLatestVersion({ clusterIds })` | Entries + latest versions (batch)    |

### Context

| Method                 | What                                            |
| ---------------------- | ----------------------------------------------- |
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

**Drizzle users:** Import the schemas and use `drizzle-kit push`:

```ts
export { clusters, entries, entryVersions } from "@lithium-ai/drizzle";
```

```bash
npx drizzle-kit push
```

**Raw SQL:** Run the reference migrations from `@lithium-ai/postgres`:

```bash
psql -d your_db -f node_modules/@lithium-ai/postgres/src/migrations/001_clusters.sql
psql -d your_db -f node_modules/@lithium-ai/postgres/src/migrations/002_entries.sql
```

Requires `CREATE EXTENSION IF NOT EXISTS ltree;` before running.

## Roadmap

- [x] Core storage engine (`@lithium-ai/core`)
- [x] PostgreSQL ltree adapter (`@lithium-ai/postgres`)
- [x] MCP server (`@lithium-ai/mcp`)
- [x] Content resolver callback for `getContext`
- [x] Drizzle ORM adapter (`@lithium-ai/drizzle`)
- [x] GitHub Actions CI
- [x] Integration tests (testcontainers)
- [ ] Prisma adapter
- [ ] Transaction support
- [ ] Example projects

## Use Cases

- AI agent memory (structured retrieval, scoped context)
- Decision tracking across teams
- Config versioning
- Documentation hierarchies

Read more: [Memory Graphs Don't Scale](https://dev.to/0xjaksun/memory-graphs-dont-scale-4p0i)

## Contributing

Issues and PRs welcome.

## License

MIT
