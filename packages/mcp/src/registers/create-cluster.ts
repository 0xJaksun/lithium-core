import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Lithium } from "@lithium-ai/core";
import { z } from "zod";

export function registerCreateCluster(
  server: McpServer,
  lithium: Lithium
): void {
  server.registerTool(
    "create_cluster",
    {
      description:
        "Create a knowledge domain (cluster). Optionally nest under a parent path.",
      inputSchema: {
        name: z.string().describe("Name of the cluster"),
        parentPath: z
          .string()
          .optional()
          .describe("Dot-separated parent path, e.g. 'infra.database'"),
        description: z
          .string()
          .optional()
          .describe("Description of the cluster"),
      },
    },
    async ({ name, parentPath, description }) => {
      const result = await lithium.clusters.create({
        name,
        parentPath,
        description,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: result.success
              ? JSON.stringify(result.value, null, 2)
              : result.error.message,
          },
        ],
      };
    }
  );
}
