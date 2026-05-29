# Lithium MCP Starter

Give Claude structured memory in 2 minutes.

## Prerequisites

- Node.js 20+
- PostgreSQL with ltree extension
- Claude Code

## Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env` with your database connection string.

Run the schema against your database:

```bash
psql $DATABASE_URL -f schema.sql
```

Seed example data:

```bash
DATABASE_URL=your_connection_string pnpm seed
```

## Connect to Claude Code

```bash
claude mcp add lithium -e DATABASE_URL=your_connection_string -- npx tsx /path/to/server.ts
```

Or add manually to your Claude Code config:

```json
{
  "mcpServers": {
    "lithium": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/server.ts"],
      "env": {
        "DATABASE_URL": "postgres://user:pass@localhost:5432/dbname"
      }
    }
  }
}
```

## What Claude can do

**Read:**

- `list_clusters` — see the full hierarchy
- `get_context` — get all entries under a path (e.g. "engineering")

**Write:**

- `create_cluster` — create new knowledge domains
- `create_entry` — add versioned entries

## Example

Ask Claude: "What do we know about engineering?"

Claude calls `get_context` with path `engineering` and returns all entries under that scope with their content.

## Customise

Edit `seed.ts` to match your own hierarchy. The `content` table is yours. Add whatever columns you need.
