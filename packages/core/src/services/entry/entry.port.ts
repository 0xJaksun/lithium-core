import type { Entry, EntryVersion } from "./entry.types";
import type { Result } from "../../types";
import type { ValidationError, SystemError } from "../../errors";

export type InsertEntry = Omit<Entry, "id" | "createdAt">;
export type InsertEntryVersion = Omit<EntryVersion, "id" | "createdAt">;

export interface EntryStoragePort {
  insert(
    input: InsertEntry
  ): Promise<Result<Entry, ValidationError | SystemError>>;

  insertVersion(
    input: InsertEntryVersion
  ): Promise<Result<EntryVersion, ValidationError | SystemError>>;

  getLatestVersion(
    entryId: string
  ): Promise<Result<EntryVersion | null, ValidationError | SystemError>>;

  list(
    clusterIds: string[]
  ): Promise<Result<Entry[], ValidationError | SystemError>>;

  getVersion(
    entryId: string,
    version: number
  ): Promise<Result<EntryVersion | null, ValidationError | SystemError>>;

  findById(
    id: string
  ): Promise<Result<Entry | null, ValidationError | SystemError>>;

  getLatestVersions(
    entryIds: string[]
  ): Promise<Result<EntryVersion[], ValidationError | SystemError>>;
}
