#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ApolloConfigError, ApolloUserError, searchContacts } from "../lib/apollo";

const server = new McpServer({
  name: "apollo-contacts",
  version: "0.1.0",
});

server.registerTool(
  "find_investment_contacts",
  {
    title: "Find investment decision-makers at a firm",
    description:
      "Given a company name (asset manager, hedge fund, PE firm, family office, etc.), " +
      "resolves the company in Apollo.io and returns up to 20 investment decision-makers " +
      "(portfolio managers, CIOs, allocators, and related titles) with title, LinkedIn " +
      "profile, and email where available. Phone numbers are never included.",
    inputSchema: {
      companyName: z.string().describe("The company/firm name to search for, e.g. \"BlackRock\""),
    },
  },
  async ({ companyName }) => {
    try {
      const result = await searchContacts(companyName);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      if (err instanceof ApolloUserError || err instanceof ApolloConfigError) {
        return {
          content: [{ type: "text", text: err.message }],
          isError: true,
        };
      }
      throw err;
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("apollo-contacts MCP server failed to start:", err);
  process.exit(1);
});
