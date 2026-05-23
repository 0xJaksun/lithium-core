import type { Cluster } from "./cluster.types";
import type { Result } from "../../types/result";
import type { ClusterStoragePort } from "./cluster.port";
import { NotFoundError, SystemError, ValidationError } from "../../errors";

export interface IClusterService {
  create(params: {
    name: string;
    parentPath?: string;
    description?: string;
  }): Promise<Result<Cluster, ValidationError | NotFoundError | SystemError>>;

  findByPath(params: {
    path: string;
  }): Promise<Result<Cluster | null, ValidationError | SystemError>>;
}

export class ClusterService implements IClusterService {
  constructor(private readonly port: ClusterStoragePort) {}

  async create(params: {
    name: string;
    parentPath?: string;
    description?: string;
  }): Promise<Result<Cluster, ValidationError | NotFoundError | SystemError>> {
    if (!params.parentPath) {
      return this.port.insert({
        parentId: null,
        path: params.name,
        name: params.name,
        description: params.description ?? null,
      });
    }

    const parent = await this.port.findByPath(params.parentPath);
    if (!parent.success) return parent;

    if (!parent.value) {
      return {
        success: false,
        error: new NotFoundError("Parent path not found"),
      };
    }

    return this.port.insert({
      parentId: parent.value.id,
      path: `${params.parentPath}.${params.name}`,
      name: params.name,
      description: params.description ?? null,
    });
  }

  async findByPath(params: {
    path: string;
  }): Promise<Result<Cluster | null, ValidationError | SystemError>> {
    return this.port.findByPath(params.path);
  }
}
