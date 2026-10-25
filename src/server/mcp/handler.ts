import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateMcpRequest } from "./auth.js";
import { createFinanceMcpServer } from "./server.js";

/**
 * Universal Web Standard Request/Response handler for MCP Streamable HTTP Transport.
 * Compatible with Vite Dev Server, Vercel Serverless Functions, and Cloudflare/Node runtimes.
 */
export async function handleMcpRequest(req: Request): Promise<Response> {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-api-key, X-Api-Key, MCP-Protocol-Version, Last-Event-ID",
      },
    });
  }

  // 2. Authenticate Request (via API Key 'afi_live_...' or Supabase JWT)
  let authContext;
  try {
    const authHeader =
      req.headers.get("Authorization") ||
      req.headers.get("x-api-key") ||
      req.headers.get("X-Api-Key");
    authContext = await authenticateMcpRequest(authHeader);
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: error.message || "Unauthorized",
        },
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 3. Initialize Stateless Streamable HTTP Transport
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  // 4. Initialize User-Scoped McpServer and connect
  const server = createFinanceMcpServer(authContext.userId, authContext.supabase);
  await server.connect(transport);

  // 5. Handle Request
  const res = await transport.handleRequest(req);

  // 6. Attach CORS headers to response
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key, X-Api-Key, MCP-Protocol-Version, Last-Event-ID"
  );

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
