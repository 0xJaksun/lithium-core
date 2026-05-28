# @lithium-ai/drizzle

Drizzle ORM adapter for [@lithium-ai/core](https://www.npmjs.com/package/@lithium-ai/core).

[![npm](https://img.shields.io/npm/v/@lithium-ai/drizzle)](https://www.npmjs.com/package/@lithium-ai/drizzle)
[![license](https://img.shields.io/npm/l/@lithium-ai/drizzle)](https://github.com/0xJaksun/lithium-core/blob/master/LICENSE)

---

## Install

```bash
npm install @lithium-ai/core @lithium-ai/drizzle drizzle-orm
```

---

## Schema

This package exports Drizzle table definitions. Add them to your schema:

```ts
// schema.ts
export { clusters, entries, entryVersions } from "@lithium-ai/drizzle";

// your own tables that reference entry versions
export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryVersionId: uuid("entry_version_id").references(() => entryVersions.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
});
```

Then push with `drizzle-kit`:

```bash
npx drizzle-kit push
```

Requires the `ltree` extension. Run `CREATE EXTENSION IF NOT EXISTS ltree;` before pushing.

---

## Connect

```ts
import { Lithium } from "@lithium-ai/core";
import { drizzleAdapter } from "@lithium-ai/drizzle";

const lithium = new Lithium(drizzleAdapter(db));
```

That's it. Pass your existing Drizzle `db` instance.

---

## Validation

All DB returns are validated with Zod at the boundary. If the database returns unexpected data, you get a `ValidationError`.

---

## Adapter Methods

### Clusters

| Method | Query |
|---|---|
| `insert` | `db.insert(clusters).returning()` |
| `findByPath` | `WHERE path = ltree` |
| `list` | `ORDER BY path` |
| `listDescendantIds` | `WHERE path <@ ltree` |

### Entries

| Method | Query |
|---|---|
| `insert` | `db.insert(entries).returning()` |
| `insertVersion` | `db.insert(entryVersions).returning()` |
| `getLatestVersion` | `ORDER BY version DESC LIMIT 1` |
| `getLatestVersions` | `selectDistinctOn([entryId])` |
| `getVersion` | `WHERE entryId AND version` |
| `findById` | `WHERE id` |
| `list` | `WHERE clusterId IN (...)` |

---

## Requirements

- PostgreSQL with `ltree` extension
- Drizzle ORM >= 0.30.0
- Node.js >= 20

---

## License

MIT
