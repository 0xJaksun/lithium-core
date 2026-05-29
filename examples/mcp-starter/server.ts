import { Lithium } from "@lithium-ai/core";
import { postgresAdapter } from "@lithium-ai/postgres";
import { serveMcp } from "@lithium-ai/mcp";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Copy .env.example to .env");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

const lithium = new Lithium(postgresAdapter(sql), async (versionIds) => {
  const rows = await sql`
    SELECT entry_version_id, title, body
    FROM content
    WHERE entry_version_id = ANY(${versionIds})
  `;
  return new Map(rows.map((r) => [r.entry_version_id, r]));
});

serveMcp(lithium);
