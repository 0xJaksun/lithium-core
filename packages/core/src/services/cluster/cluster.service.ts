import type { Cluster } from "./cluster.types";
import type { Result } from "../../types/result";
import type { ClusterStoragePort } from "./cluster.port";

export interface IClusterService {
  create(params: {
    name: string;
    parentId?: string;
    description?: string;
  }): Promise<Result<Cluster>>;
}

export class ClusterService implements IClusterService {
  constructor(private readonly port: ClusterStoragePort) {}

  async create(params: {
    name: string;
    parentId?: string;
    description?: string;
  }): Promise<Result<Cluster>> {
    return this.port.insert({
      parentId: params.parentId ?? null,
      path: params.name,
      name: params.name,
      description: params.description ?? null,
    });
  }
}
