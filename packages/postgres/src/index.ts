import type { Sql } from "postgres";
import type { LithiumAdapter } from "@lithium-ai/core";
import { PostgresClusterAdapter } from "./cluster/cluster.port";
import { PostgresEntryAdapter } from "./entry/entry.port";

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

export { PostgresClusterAdapter } from "./cluster/cluster.port";
export { PostgresEntryAdapter } from "./entry/entry.port";
