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
  constructor(private readonly sql: Sql) {}

  public async insert(
    input: InsertEntry
  ): Promise<Result<Entry, ValidationError | SystemError>> {
    try {
      const result = await this.sql`
        INSERT INTO entries (cluster_id)
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
        INSERT INTO entry_versions (entry_id, version)
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
}
