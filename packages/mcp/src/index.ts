import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerListClusters, registerGetContext } from "./registers";
import type { Lithium } from "@lithium-ai/core";

export function createMcpServer(lithium: Lithium): McpServer {
  const server = new McpServer({
    name: "lithium",
    version: "0.0.1",
  });

  registerListClusters(server, lithium);
  registerGetContext(server, lithium);

  return server;
}

export async function serveMcp(lithium: Lithium): Promise<void> {
  const server = createMcpServer(lithium);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
