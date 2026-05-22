import type { Sql } from "postgres";
import type { LithiumAdapter } from "@lithium-ai/core";
import { PostgresClusterAdapter } from "./cluster/cluster.port";

export function postgresAdapter(sql: Sql): LithiumAdapter {
  return {
    clusters: new PostgresClusterAdapter(sql),
  };
}

export { PostgresClusterAdapter } from "./cluster/cluster.port";
