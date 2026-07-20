import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createApolloMcpServer } from "../../../mcp/createServer";

const jsonRpcError = (status: number, message: string) =>
  new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }),
    { status, headers: { "Content-Type": "application/json" } }
  );

function isAuthorized(req: Request): boolean {
  const token = process.env.MCP_ACCESS_TOKEN;
  // Fail closed: an unconfigured token means nobody gets in, not everybody.
  if (!token) return false;
  return req.headers.get("authorization") === `Bearer ${token}`;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return jsonRpcError(401, "Unauthorized");
  }

  const server = createApolloMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(req);
  } catch (err) {
    console.error("apollo MCP request failed:", err);
    return jsonRpcError(500, "Internal server error");
  }
}

export async function GET() {
  return jsonRpcError(405, "Method not allowed.");
}

export async function DELETE() {
  return jsonRpcError(405, "Method not allowed.");
}
