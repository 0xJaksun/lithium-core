# @lithium-ai/mcp

MCP server for [@lithium-ai/core](https://www.npmjs.com/package/@lithium-ai/core). Connect structured hierarchical memory to Claude and other MCP-compatible AI tools.

[![npm](https://img.shields.io/npm/v/@lithium-ai/mcp)](https://www.npmjs.com/package/@lithium-ai/mcp)
[![license](https://img.shields.io/npm/l/@lithium-ai/mcp)](./LICENSE)

---

## Install

```bash
npm install @lithium-ai/core @lithium-ai/postgres @lithium-ai/mcp
```

---

## Quick Start

Create a server file:

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

Add to your Claude Code config:

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

---

## Tools

### `list_clusters`

Lists all clusters in the hierarchy. No parameters.

Returns cluster paths, names, descriptions, and IDs as JSON.

### `get_context`

Get all entries and content under a cluster path. Resolves the full subtree via ltree.

| Parameter | Type     | Description                                         |
| --------- | -------- | --------------------------------------------------- |
| `path`    | `string` | Dot-separated cluster path, e.g. `"infra.database"` |

Returns descendant cluster IDs, entries with latest versions, and resolved content as JSON.

---

## API

### `serveMcp(lithium)`

Starts an MCP server with stdio transport. Registers all tools and connects.

```ts
import { serveMcp } from "@lithium-ai/mcp";
await serveMcp(lithium);
```

### `createMcpServer(lithium)`

Creates and returns the MCP server without connecting. Use this if you need a custom transport.

```ts
import { createMcpServer } from "@lithium-ai/mcp";
const server = createMcpServer(lithium);
// Connect your own transport
```

---

## Content Resolver

The content resolver is optional and configured on the `Lithium` class, not the MCP package. Without it, `get_context` returns entries and versions without content.

```ts
// Without resolver
const lithium = new Lithium(postgresAdapter(sql));
// get_context returns { clusters, entries: [{ entry, version }] }

// With resolver
const lithium = new Lithium(postgresAdapter(sql), async (versionIds) => {
  // Return a Map<versionId, yourContent>
  return new Map(...);
});
// get_context returns { clusters, entries: [{ entry, version, content }] }
```

---

## Requirements

- Node.js >= 20
- PostgreSQL with ltree extension
- MCP-compatible client (Claude Code, etc.)

---

## License

MIT
