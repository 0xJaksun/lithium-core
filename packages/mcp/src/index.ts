import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListClusters } from "./registers";
import type { Lithium } from "@lithium-ai/core";

export function serveMcp(lithium: Lithium): McpServer {
  const server = new McpServer({
    name: "lithium-ai/mcp",
    version: "0.0.1",
  });

  registerListClusters(server, lithium);

  return server;
}
