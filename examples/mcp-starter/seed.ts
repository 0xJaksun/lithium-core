import { Lithium } from "@lithium-ai/core";
import { postgresAdapter } from "@lithium-ai/postgres";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Copy .env.example to .env");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
const lithium = new Lithium(postgresAdapter(sql));

async function seed() {
  await lithium.clusters.create({ name: "engineering" });
  await lithium.clusters.create({ name: "database", parentPath: "engineering" });
  await lithium.clusters.create({ name: "auth", parentPath: "engineering" });
  await lithium.clusters.create({ name: "product" });
  await lithium.clusters.create({ name: "roadmap", parentPath: "product" });

  const dbCluster = await lithium.clusters.findByPath({ path: "engineering.database" });
  if (!dbCluster.success || !dbCluster.value) throw new Error("Cluster not found");

  const entry1 = await lithium.entries.create({ clusterId: dbCluster.value.id });
  if (!entry1.success) throw entry1.error;

  await sql`INSERT INTO content (entry_version_id, title, body) VALUES (
    ${entry1.value.version.id}, 'Use PostgreSQL', 'Chosen for ltree support and JSON handling.'
  )`;

  const authCluster = await lithium.clusters.findByPath({ path: "engineering.auth" });
  if (!authCluster.success || !authCluster.value) throw new Error("Cluster not found");

  const entry2 = await lithium.entries.create({ clusterId: authCluster.value.id });
  if (!entry2.success) throw entry2.error;

  await sql`INSERT INTO content (entry_version_id, title, body) VALUES (
    ${entry2.value.version.id}, 'JWT for API auth', 'Session tokens for web. Refresh tokens server-side.'
  )`;

  console.log("Seeded.");
  await sql.end();
}

seed();
