import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Lithium } from "@lithium-ai/core";
import { z } from "zod";

export function registerCreateEntry(server: McpServer, lithium: Lithium): void {
  server.registerTool(
    "create_entry",
    {
      description:
        "Create a versioned entry in a cluster. Returns the entry and its first version.",
      inputSchema: {
        clusterId: z.string().describe("ID of the cluster to add the entry to"),
      },
    },
    async ({ clusterId }) => {
      const result = await lithium.entries.create({ clusterId });
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
