import type { Entry, EntryVersion } from "./entry.types";
import type { Result } from "../../types";
import type { EntryStoragePort } from "./entry.port";
import type { ValidationError, SystemError } from "../../errors";
import { NotFoundError } from "../../errors";

export interface IEntryService {
  create(params: {
    clusterId: string;
  }): Promise<
    Result<
      { entry: Entry; version: EntryVersion },
      ValidationError | SystemError
    >
  >;

  update(params: {
    id: string;
  }): Promise<
    Result<EntryVersion, ValidationError | NotFoundError | SystemError>
  >;

  list(params: {
    clusterIds: string[];
  }): Promise<Result<Entry[], ValidationError | SystemError>>;

  listWithLatestVersion(params: {
    clusterIds: string[];
  }): Promise<
    Result<
      Array<{ entry: Entry; version: EntryVersion }>,
      ValidationError | SystemError
    >
  >;

  get(params: {
    id: string;
    version?: number;
  }): Promise<
    Result<
      { entry: Entry; version: EntryVersion },
      ValidationError | NotFoundError | SystemError
    >
  >;
}

export class EntryService implements IEntryService {
  constructor(private readonly port: EntryStoragePort) {}

  async create(params: {
    clusterId: string;
  }): Promise<
    Result<
      { entry: Entry; version: EntryVersion },
      ValidationError | SystemError
    >
  > {
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
  }): Promise<
    Result<EntryVersion, ValidationError | NotFoundError | SystemError>
  > {
    const latest = await this.port.getLatestVersion(params.id);
    if (!latest.success) return latest;

    if (!latest.value) {
      return {
        success: false,
        error: new NotFoundError("Entry not found"),
      };
    }

    return this.port.insertVersion({
      entryId: params.id,
      version: latest.value.version + 1,
    });
  }

  async list(params: {
    clusterIds: string[];
  }): Promise<Result<Entry[], ValidationError | SystemError>> {
    if (params.clusterIds.length === 0) {
      return { success: true, value: [] };
    }

    return this.port.list(params.clusterIds);
  }

  async listWithLatestVersion(params: {
    clusterIds: string[];
  }): Promise<
    Result<
      Array<{ entry: Entry; version: EntryVersion }>,
      ValidationError | SystemError
    >
  > {
    if (params.clusterIds.length === 0) {
      return { success: true, value: [] };
    }

    const entries = await this.port.list(params.clusterIds);
    if (!entries.success) return entries;

    if (entries.value.length === 0) {
      return { success: true, value: [] };
    }

    const versions = await this.port.getLatestVersions(
      entries.value.map((e) => e.id)
    );
    if (!versions.success) return versions;

    const versionMap = new Map(
      versions.value.map((v) => [v.entryId, v])
    );

    return {
      success: true,
      value: entries.value
        .filter((e) => versionMap.has(e.id))
        .map((e) => ({ entry: e, version: versionMap.get(e.id)! })),
    };
  }

  async get(params: {
    id: string;
    version?: number;
  }): Promise<
    Result<
      { entry: Entry; version: EntryVersion },
      ValidationError | NotFoundError | SystemError
    >
  > {
    const entry = await this.port.findById(params.id);
    if (!entry.success) return entry;

    if (!entry.value) {
      return {
        success: false,
        error: new NotFoundError("Entry not found"),
      };
    }

    const version = await this.resolveVersion(params.id, params.version);
    if (!version.success) return version;

    return {
      success: true,
      value: { entry: entry.value, version: version.value },
    };
  }

  private async resolveVersion(
    entryId: string,
    version?: number
  ): Promise<
    Result<EntryVersion, ValidationError | NotFoundError | SystemError>
  > {
    const result = version
      ? await this.port.getVersion(entryId, version)
      : await this.port.getLatestVersion(entryId);
    if (!result.success) return result;

    if (!result.value) {
      return {
        success: false,
        error: new NotFoundError("Entry version not found"),
      };
    }

    return { success: true, value: result.value };
  }
}
