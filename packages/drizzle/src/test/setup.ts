import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(__dirname, "../../../postgres/src/migrations");

export async function setupTestDb() {
  const container = await new PostgreSqlContainer("postgres:16").start();
  const sql = postgres(container.getConnectionUri());

  const migrations = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrations) {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    await sql.unsafe(content);
  }

  const db = drizzle(sql);
  return db;
}
