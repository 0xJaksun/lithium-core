import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Lithium } from "@lithium-ai/core";
import { z } from "zod";

export function registerGetContext(
  server: McpServer,
  lithium: Lithium
): void {
  server.registerTool(
    "get_context",
    {
      description:
        "Get all entries and content under a cluster path. Resolves the full subtree via ltree.",
      inputSchema: {
        path: z.string().describe("Dot-separated cluster path, e.g. 'infra.database'"),
      },
    },
    async ({ path }) => {
      const result = await lithium.getContext({ path });
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
