import { eq, inArray, desc, and } from "drizzle-orm";
import type {
  PgDatabase,
  PgQueryResultHKT,
  PgTransaction,
} from "drizzle-orm/pg-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type {
  Entry,
  EntryStoragePort,
  EntryVersion,
  InsertEntry,
  InsertEntryVersion,
  Result,
} from "@lithium-ai/core";
import { SystemError, ValidationError } from "@lithium-ai/core";
import { z } from "zod/v4";
import { entries, entryVersions } from "../schema";

const EntryRow = z.object({
  id: z.uuid(),
  clusterId: z.uuid(),
  createdAt: z.date(),
});

const EntryVersionRow = z.object({
  id: z.uuid(),
  entryId: z.uuid(),
  version: z.number(),
  createdAt: z.date(),
});

export class DrizzleEntryAdapter<
  TQueryResult extends PgQueryResultHKT,
  TSchema extends Record<string, unknown>
> implements EntryStoragePort
{
  constructor(private readonly db: PgDatabase<TQueryResult, TSchema>) {}

  public async createEntry(
    input: InsertEntry
  ): Promise<
    Result<
      { entry: Entry; version: EntryVersion },
      ValidationError | SystemError
    >
  > {
    return this.txResult(async (tx) => {
      const entryResult = await tx
        .insert(entries)
        .values({ clusterId: input.clusterId })
        .returning();
      const entryParsed = z.array(EntryRow).length(1).safeParse(entryResult);
      if (!entryParsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid entry data returned from database"
          ),
        };
      }

      const versionResult = await tx
        .insert(entryVersions)
        .values({ entryId: entryParsed.data[0].id, version: 1 })
        .returning();
      const versionParsed = z
        .array(EntryVersionRow)
        .length(1)
        .safeParse(versionResult);
      if (!versionParsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid entry version data returned from database"
          ),
        };
      }

      return {
        success: true,
        value: { entry: entryParsed.data[0], version: versionParsed.data[0] },
      };
    });
  }

  public async insertVersion(
    input: InsertEntryVersion
  ): Promise<Result<EntryVersion, ValidationError | SystemError>> {
    try {
      const result = await this.db
        .insert(entryVersions)
        .values({ entryId: input.entryId, version: input.version })
        .returning();

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
      const result = await this.db
        .select()
        .from(entryVersions)
        .where(eq(entryVersions.entryId, entryId))
        .orderBy(desc(entryVersions.version))
        .limit(1);

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
        error: new SystemError("Failed to get latest entry version"),
      };
    }
  }

  public async getLatestVersions(
    entryIds: string[]
  ): Promise<Result<EntryVersion[], ValidationError | SystemError>> {
    try {
      const result = await this.db
        .selectDistinctOn([entryVersions.entryId])
        .from(entryVersions)
        .where(inArray(entryVersions.entryId, entryIds))
        .orderBy(entryVersions.entryId, desc(entryVersions.version));

      const parsed = z.array(EntryVersionRow).safeParse(result);
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
        error: new SystemError("Failed to get latest versions"),
      };
    }
  }

  public async getVersion(
    entryId: string,
    version: number
  ): Promise<Result<EntryVersion | null, ValidationError | SystemError>> {
    try {
      const result = await this.db
        .select()
        .from(entryVersions)
        .where(
          and(
            eq(entryVersions.entryId, entryId),
            eq(entryVersions.version, version)
          )
        );

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
      const result = await this.db
        .select()
        .from(entries)
        .where(eq(entries.id, id));

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

  public async list(
    clusterIds: string[]
  ): Promise<Result<Entry[], ValidationError | SystemError>> {
    try {
      const result = await this.db
        .select()
        .from(entries)
        .where(inArray(entries.clusterId, clusterIds))
        .orderBy(entries.createdAt);

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

  private async txResult<T>(
    fn: (
      tx: PgTransaction<
        TQueryResult,
        TSchema,
        ExtractTablesWithRelations<TSchema>
      >
    ) => Promise<Result<T, ValidationError | SystemError>>
  ): Promise<Result<T, ValidationError | SystemError>> {
    let captured: ValidationError | SystemError | null = null;

    try {
      const value = await this.db.transaction(async (tx) => {
        const result = await fn(tx);
        if (!result.success) {
          captured = result.error;
          throw result.error;
        }
        return result.value;
      });
      return { success: true, value };
    } catch {
      return {
        success: false,
        error: captured ?? new SystemError("Transaction failed"),
      };
    }
  }
}
