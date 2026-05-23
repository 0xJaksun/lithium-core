export type { Cluster } from "./cluster.types";
export type { ClusterStoragePort, InsertCluster } from "./cluster.port";
export type { IClusterService } from "./cluster.service";

import type { ClusterStoragePort } from "./cluster.port";
import type { IClusterService } from "./cluster.service";
import { ClusterService } from "./cluster.service";

export function createClusterService(
  port: ClusterStoragePort
): IClusterService {
  return new ClusterService(port);
}
