import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Lithium } from "@lithium-ai/core";

export function registerListClusters(
  server: McpServer,
  lithium: Lithium
): void {
  server.registerTool(
    "list_clusters",
    {
      description:
        "Lists knowledge domains (clusters). Returns cluster paths that group related knowledge.",
    },
    async () => {
      const result = await lithium.clusters.list();
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
