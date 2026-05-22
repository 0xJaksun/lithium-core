import type { ClusterStoragePort } from "./services/cluster/cluster.port";
import { ClusterService } from "./services/cluster/cluster.service";

export interface LithiumAdapter {
  clusters: ClusterStoragePort;
}

export class Lithium {
  public readonly clusters: ClusterService;

  constructor(adapter: LithiumAdapter) {
    this.clusters = new ClusterService(adapter.clusters);
  }
}
