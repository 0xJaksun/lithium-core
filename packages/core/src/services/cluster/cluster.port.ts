import type { Cluster } from "./cluster.types";
import type { Result } from "../../types/result";

export type InsertCluster = Omit<Cluster, "id" | "createdAt">;

export interface ClusterStoragePort {
  insert(input: InsertCluster): Promise<Result<Cluster>>;
}
