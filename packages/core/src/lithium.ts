import type { ClusterStoragePort, IClusterService } from "./services/cluster";
import type { EntryStoragePort, IEntryService } from "./services/entry";
import { createClusterService } from "./services/cluster";
import { createEntryService } from "./services/entry";

export interface LithiumAdapter {
  clusters: ClusterStoragePort;
  entries: EntryStoragePort;
}

export class Lithium {
  public readonly clusters: IClusterService;
  public readonly entries: IEntryService;

  constructor(adapter: LithiumAdapter) {
    this.clusters = createClusterService(adapter.clusters);
    this.entries = createEntryService(adapter.entries);
  }
}
