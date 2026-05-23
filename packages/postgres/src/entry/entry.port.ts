import type { Sql } from "postgres";
import type {
  Entry,
  EntryVersion,
  EntryStoragePort,
  InsertEntry,
  InsertEntryVersion,
  Result,
} from "@lithium-ai/core";
import { SystemError, ValidationError } from "@lithium-ai/core";
import { z } from "zod/v4";

const EntryRow = z
  .object({
    id: z.uuid(),
    cluster_id: z.uuid(),
    created_at: z.date(),
  })
  .transform((row) => ({
    id: row.id,
    clusterId: row.cluster_id,
    createdAt: row.created_at,
  }));

const EntryVersionRow = z
  .object({
    id: z.uuid(),
    entry_id: z.uuid(),
    version: z.number(),
    created_at: z.date(),
  })
  .transform((row) => ({
    id: row.id,
    entryId: row.entry_id,
    version: row.version,
    createdAt: row.created_at,
  }));

export class PostgresEntryAdapter implements EntryStoragePort {
  private readonly entriesTable: string;
  private readonly versionsTable: string;

  constructor(private readonly sql: Sql, schema?: string) {
    this.entriesTable = schema ? `${schema}.entries` : "entries";
    this.versionsTable = schema ? `${schema}.entry_versions` : "entry_versions";
  }

  public async insert(
    input: InsertEntry
  ): Promise<Result<Entry, ValidationError | SystemError>> {
    try {
      const result = await this.sql`
        INSERT INTO ${this.sql(this.entriesTable)} (cluster_id)
        VALUES (${input.clusterId})
        RETURNING id, cluster_id, created_at
      `;

      const parsed = z.array(EntryRow).length(1).safeParse(result);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid entry data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data[0] };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to insert entry"),
      };
    }
  }

  public async insertVersion(
    input: InsertEntryVersion
  ): Promise<Result<EntryVersion, ValidationError | SystemError>> {
    try {
      const result = await this.sql`
        INSERT INTO ${this.sql(this.versionsTable)} (entry_id, version)
        VALUES (${input.entryId}, ${input.version})
        RETURNING id, entry_id, version, created_at
      `;

      const parsed = z.array(EntryVersionRow).length(1).safeParse(result);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid entry version data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data[0] };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to insert entry version"),
      };
    }
  }

  public async getLatestVersion(
    entryId: string
  ): Promise<Result<EntryVersion | null, ValidationError | SystemError>> {
    try {
      const result = await this.sql`
        SELECT id, entry_id, version, created_at
        FROM ${this.sql(this.versionsTable)}
        WHERE entry_id = ${entryId}
        ORDER BY version DESC
        LIMIT 1
      `;

      const parsed = z.array(EntryVersionRow).safeParse(result);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid entry version data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data[0] ?? null };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to get latest entry version"),
      };
    }
  }

  public async list(
    clusterIds: string[]
  ): Promise<Result<Entry[], ValidationError | SystemError>> {
    try {
      const result = await this.sql`
        SELECT id, cluster_id, created_at
        FROM ${this.sql(this.entriesTable)}
        WHERE cluster_id = ANY(${clusterIds})
        ORDER BY created_at
      `;

      const parsed = z.array(EntryRow).safeParse(result);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid entry data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to list entries"),
      };
    }
  }

  public async getVersion(
    entryId: string,
    version: number
  ): Promise<Result<EntryVersion | null, ValidationError | SystemError>> {
    try {
      const result = await this.sql`
        SELECT id, entry_id, version, created_at
        FROM ${this.sql(this.versionsTable)}
        WHERE entry_id = ${entryId} AND version = ${version}
      `;

      if (result.length === 0) {
        return { success: true, value: null };
      }

      const parsed = EntryVersionRow.safeParse(result[0]);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid entry version data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to get entry version"),
      };
    }
  }

  public async findById(
    id: string
  ): Promise<Result<Entry | null, ValidationError | SystemError>> {
    try {
      const result = await this.sql`
        SELECT id, cluster_id, created_at
        FROM ${this.sql(this.entriesTable)}
        WHERE id = ${id}
      `;

      if (result.length === 0) {
        return { success: true, value: null };
      }

      const parsed = EntryRow.safeParse(result[0]);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid entry data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to find entry by id"),
      };
    }
  }
}
