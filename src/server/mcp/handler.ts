import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { resolveAuthContext } from "@/server/auth/resolver";
import { createMcpServerInstance } from "@/server/mcp/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-api-key, X-Api-Key, MCP-Protocol-Version, Last-Event-ID",
};

/**
 * Universal Web Standard Request/Response handler for MCP Streamable HTTP Transport.
 */
export async function handleMcpRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const authResult = await resolveAuthContext(req);
  if (!authResult.success) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: authResult.error,
        },
      }),
      {
        status: authResult.statusCode || 401,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  }

  const authContext = authResult.context;

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  const server = createMcpServerInstance(authContext);
  await server.connect(transport);

  const response = await transport.handleRequest(req);

  const headers = new Headers(response.headers);
  for (const [key, val] of Object.entries(CORS_HEADERS)) {
    headers.set(key, val);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
