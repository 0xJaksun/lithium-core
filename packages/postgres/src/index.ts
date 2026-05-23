import type { Sql } from "postgres";
import type { LithiumAdapter } from "@lithium-ai/core";
import { PostgresClusterAdapter } from "./cluster/cluster.port";
import { PostgresEntryAdapter } from "./entry/entry.port";

export function postgresAdapter(sql: Sql): LithiumAdapter {
  return {
    clusters: new PostgresClusterAdapter(sql),
    entries: new PostgresEntryAdapter(sql),
  };
}

export { PostgresClusterAdapter } from "./cluster/cluster.port";
export { PostgresEntryAdapter } from "./entry/entry.port";
