import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { LithiumAdapter } from "@lithium-ai/core";
import { DrizzleClusterAdapter } from "./cluster";
import { DrizzleEntryAdapter } from "./entry";

export function drizzleAdapter<
  TQueryResult extends PgQueryResultHKT,
  TSchema extends Record<string, unknown>
>(db: PgDatabase<TQueryResult, TSchema>): LithiumAdapter {
  return {
    clusters: new DrizzleClusterAdapter(db),
    entries: new DrizzleEntryAdapter(db),
  };
}

export { DrizzleClusterAdapter } from "./cluster";
export { DrizzleEntryAdapter } from "./entry";
export { clusters, entries, entryVersions } from "./schema";
