import type { Entry, EntryVersion } from "./entry.types";
import type { Result } from "../../types/result";
import type { EntryStoragePort } from "./entry.port";
import type { ValidationError } from "../../errors/validation.error";
import type { NotFoundError } from "../../errors/not-found.error";
import type { SystemError } from "../../errors/system.error";
import { NotFoundError as NotFound } from "../../errors/not-found.error";

export interface IEntryService {
  create(params: {
    clusterId: string;
  }): Promise<Result<{ entry: Entry; version: EntryVersion }, ValidationError | SystemError>>;

  update(params: {
    id: string;
  }): Promise<Result<EntryVersion, ValidationError | NotFoundError | SystemError>>;
}

export class EntryService implements IEntryService {
  constructor(private readonly port: EntryStoragePort) {}

  async create(params: {
    clusterId: string;
  }): Promise<Result<{ entry: Entry; version: EntryVersion }, ValidationError | SystemError>> {
    const entry = await this.port.insert({
      clusterId: params.clusterId,
    });
    if (!entry.success) return entry;

    const version = await this.port.insertVersion({
      entryId: entry.value.id,
      version: 1,
    });
    if (!version.success) return version;

    return {
      success: true,
      value: { entry: entry.value, version: version.value },
    };
  }

  async update(params: {
    id: string;
  }): Promise<Result<EntryVersion, ValidationError | NotFoundError | SystemError>> {
    const latest = await this.port.getLatestVersion(params.id);
    if (!latest.success) return latest;

    if (!latest.value) {
      return {
        success: false,
        error: new NotFound("Entry not found"),
      };
    }

    return this.port.insertVersion({
      entryId: params.id,
      version: latest.value.version + 1,
    });
  }
}
