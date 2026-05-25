import type { Sql } from "postgres";
import type { LithiumAdapter } from "@lithium-ai/core";
import { PostgresClusterAdapter } from "./cluster";
import { PostgresEntryAdapter } from "./entry";

export interface PostgresAdapterOptions {
  schema?: string;
}

export function postgresAdapter(
  sql: Sql,
  options?: PostgresAdapterOptions
): LithiumAdapter {
  return {
    clusters: new PostgresClusterAdapter(sql, options?.schema),
    entries: new PostgresEntryAdapter(sql, options?.schema),
  };
}
