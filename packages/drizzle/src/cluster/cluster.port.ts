import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  Cluster,
  ClusterStoragePort,
  InsertCluster,
  Result,
} from "@lithium-ai/core";
import { SystemError, ValidationError } from "@lithium-ai/core";
import { z } from "zod/v4";
import { clusters } from "../schema";

const ClusterRow = z.object({
  id: z.uuid(),
  parentId: z.uuid().nullable(),
  path: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
});

export class DrizzleClusterAdapter<
  TQueryResult extends PgQueryResultHKT,
  TSchema extends Record<string, unknown>
> implements ClusterStoragePort
{
  constructor(private readonly db: PgDatabase<TQueryResult, TSchema>) {}

  public async insert(
    input: InsertCluster
  ): Promise<Result<Cluster, ValidationError | SystemError>> {
    try {
      const result = await this.db
        .insert(clusters)
        .values({
          parentId: input.parentId,
          path: input.path,
          name: input.name,
          description: input.description,
        })
        .returning();

      const parsed = z.array(ClusterRow).length(1).safeParse(result);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid cluster data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data[0] };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to insert cluster"),
      };
    }
  }

  public async findByPath(
    path: string
  ): Promise<Result<Cluster | null, ValidationError | SystemError>> {
    try {
      const result = await this.db
        .select()
        .from(clusters)
        .where(sql`${clusters.path} = ${path}::ltree`);

      if (result.length === 0) {
        return { success: true, value: null };
      }

      const parsed = ClusterRow.safeParse(result[0]);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid cluster data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to find cluster by path"),
      };
    }
  }

  public async list(): Promise<
    Result<Cluster[], ValidationError | SystemError>
  > {
    try {
      const result = await this.db
        .select()
        .from(clusters)
        .orderBy(clusters.path);

      const parsed = z.array(ClusterRow).safeParse(result);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid cluster data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to list clusters"),
      };
    }
  }

  public async listDescendantIds(
    path: string
  ): Promise<Result<string[], ValidationError | SystemError>> {
    try {
      const result = await this.db
        .select({ id: clusters.id })
        .from(clusters)
        .where(sql`${clusters.path} <@ ${path}::ltree`)
        .orderBy(clusters.path);

      const parsed = z.array(z.object({ id: z.uuid() })).safeParse(result);
      if (!parsed.success) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid cluster data returned from database"
          ),
        };
      }

      return { success: true, value: parsed.data.map((r) => r.id) };
    } catch (error) {
      return {
        success: false,
        error: new SystemError("Failed to list descendant cluster ids"),
      };
    }
  }
}
