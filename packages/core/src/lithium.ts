import type { ClusterStoragePort } from "./services/cluster/cluster.port";
import type { EntryStoragePort } from "./services/entry/entry.port";
import { ClusterService } from "./services/cluster/cluster.service";
import { EntryService } from "./services/entry/entry.service";

export interface LithiumAdapter {
  clusters: ClusterStoragePort;
  entries: EntryStoragePort;
}

export class Lithium {
  public readonly clusters: ClusterService;
  public readonly entries: EntryService;

  constructor(adapter: LithiumAdapter) {
    this.clusters = new ClusterService(adapter.clusters);
    this.entries = new EntryService(adapter.entries);
  }
}
