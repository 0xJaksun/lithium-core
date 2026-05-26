import type { ClusterStoragePort, IClusterService } from "./services/cluster";
import type {
  EntryStoragePort,
  IEntryService,
  Entry,
  EntryVersion,
} from "./services/entry";
import type { Result } from "./types";
import { ValidationError, SystemError } from "./errors";
import { createClusterService } from "./services/cluster";
import { createEntryService } from "./services/entry";

export type ContentResolver<T> = (ids: string[]) => Promise<Map<string, T>>;

export interface LithiumAdapter {
  clusters: ClusterStoragePort;
  entries: EntryStoragePort;
}

export interface ContextResult<T> {
  clusters: string[];
  entries: { entry: Entry; version: EntryVersion; content?: T }[];
}

export class Lithium<T = unknown> {
  public readonly clusters: IClusterService;
  public readonly entries: IEntryService;
  private readonly resolve?: ContentResolver<T>;

  constructor(adapter: LithiumAdapter, resolve?: ContentResolver<T>) {
    this.clusters = createClusterService(adapter.clusters);
    this.entries = createEntryService(adapter.entries);
    this.resolve = resolve;
  }

  async getContext(params: {
    path: string;
  }): Promise<Result<ContextResult<T>, ValidationError | SystemError>> {
    const ids = await this.clusters.listDescendantIds({ path: params.path });
    if (!ids.success) return ids;

    const results = await this.entries.listWithLatestVersion({
      clusterIds: ids.value,
    });
    if (!results.success) return results;

    const content = await this.resolveContent(
      results.value.map((e) => e.version.id)
    );
    if (!content.success) return content;

    return {
      success: true,
      value: {
        clusters: ids.value,
        entries: results.value.map((e) => ({
          ...e,
          content: content.value.get(e.version.id),
        })),
      },
    };
  }

  private async resolveContent(
    versionIds: string[]
  ): Promise<Result<Map<string, T>, SystemError>> {
    if (!this.resolve) {
      return { success: true, value: new Map<string, T>() };
    }

    try {
      return { success: true, value: await this.resolve(versionIds) };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Content resolver failed"),
      };
    }
  }
}
