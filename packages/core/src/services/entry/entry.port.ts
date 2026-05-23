import type { Entry, EntryVersion } from "./entry.types";
import type { Result } from "../../types/result";
import type { ValidationError } from "../../errors/validation.error";
import type { SystemError } from "../../errors/system.error";

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
}
