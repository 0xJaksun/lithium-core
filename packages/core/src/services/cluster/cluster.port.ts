import type { Cluster } from "./cluster.types";
import type { Result } from "../../types/result";
import { SystemError, ValidationError } from "../../errors";

export type InsertCluster = Omit<Cluster, "id" | "createdAt">;

export interface ClusterStoragePort {
  insert(
    input: InsertCluster
  ): Promise<Result<Cluster, ValidationError | SystemError>>;

  findByPath(
    path: string
  ): Promise<Result<Cluster | null, ValidationError | SystemError>>;

  list(): Promise<Result<Cluster[], ValidationError | SystemError>>;

  listDescendantIds(
    path: string
  ): Promise<Result<string[], ValidationError | SystemError>>;
}
