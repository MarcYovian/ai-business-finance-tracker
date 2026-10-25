import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { registerAllTools } from "./tools/index.js";

/**
 * Creates and configures an McpServer instance scoped to an authenticated user.
 */
export function createFinanceMcpServer(
  userId: string,
  supabase: SupabaseClient,
  keyHash?: string
) {
  const server = new McpServer({
    name: "ai-finance-tracker-mcp",
    version: "1.0.0",
  });

  registerAllTools(server, supabase, userId, keyHash);

  return server;
}
