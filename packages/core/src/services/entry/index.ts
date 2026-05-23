export type { Entry, EntryVersion } from "./entry.types";
export type {
  EntryStoragePort,
  InsertEntry,
  InsertEntryVersion,
} from "./entry.port";
export type { IEntryService } from "./entry.service";

import type { EntryStoragePort } from "./entry.port";
import type { IEntryService } from "./entry.service";
import { EntryService } from "./entry.service";

export function createEntryService(port: EntryStoragePort): IEntryService {
  return new EntryService(port);
}
