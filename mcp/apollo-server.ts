#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createApolloMcpServer } from "./createServer";

async function main() {
  const server = createApolloMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("apollo-contacts MCP server failed to start:", err);
  process.exit(1);
});
