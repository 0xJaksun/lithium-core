import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const clusters = pgTable(
  "clusters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id").references((): any => clusters.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_clusters_path").on(table.path),
    index("idx_clusters_parent_id").on(table.parentId),
  ]
);
