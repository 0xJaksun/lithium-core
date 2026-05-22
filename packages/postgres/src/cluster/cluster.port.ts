import type { Sql } from "postgres";
import type {
  Cluster,
  ClusterStoragePort,
  InsertCluster,
  Result,
} from "@lithium-ai/core";
import { SystemError } from "@lithium-ai/core";
import { z } from "zod/v4";

const ClusterRow = z
  .object({
    id: z.uuid(),
    parent_id: z.uuid().nullable(),
    path: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    created_at: z.date(),
  })
  .transform((row) => ({
    id: row.id,
    parentId: row.parent_id,
    path: row.path,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  }));

export class PostgresClusterAdapter implements ClusterStoragePort {
  constructor(private readonly sql: Sql) {}

  public async insert(input: InsertCluster): Promise<Result<Cluster>> {
    try {
      const result = await this.sql`
        INSERT INTO clusters (parent_id, path, name, description)
        VALUES (${input.parentId}, ${input.path}::ltree, ${input.name}, ${input.description})
        RETURNING
          id,
          parent_id,
          path,
          name,
          description,
          created_at
      `;

      const parsed = z.array(ClusterRow).length(1).safeParse(result);
      if (!parsed.success) {
        return {
          success: false,
          error: new SystemError("Invalid cluster data returned from database"),
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
}
