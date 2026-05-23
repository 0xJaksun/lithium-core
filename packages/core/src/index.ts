// Types
export type { Result } from "./types";
export type {
  Cluster,
  ClusterStoragePort,
  InsertCluster,
} from "./services/cluster";
export type {
  Entry,
  EntryVersion,
  EntryStoragePort,
  InsertEntry,
  InsertEntryVersion,
} from "./services/entry";

// Errors
export { ValidationError } from "./errors";
export { NotFoundError } from "./errors";
export { SystemError } from "./errors";

// Factories
export { createClusterService } from "./services/cluster";
export type { IClusterService } from "./services/cluster";
export { createEntryService } from "./services/entry";
export type { IEntryService } from "./services/entry";

// Entry point
export { Lithium } from "./lithium";
export type { LithiumAdapter } from "./lithium";
