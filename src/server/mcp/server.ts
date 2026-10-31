import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AuthContext } from "@/server/auth/types";
import { registerTransactionTools } from "./tools/transaction-tools";
import { registerFundSourceTools } from "./tools/fund-source-tools";
import { registerCategoryTools } from "./tools/category-tools";
import { registerBudgetTools } from "./tools/budget-tools";
import { registerInsightTools } from "./tools/insight-tools";

/**
 * Creates and configures an McpServer instance bound to the caller's AuthContext
 */
export function createMcpServerInstance(ctx: AuthContext): McpServer {
  const server = new McpServer({
    name: "ai-finance-tracker-mcp",
    version: "2.0.0",
  });

  registerTransactionTools(server, ctx);
  registerFundSourceTools(server, ctx);
  registerCategoryTools(server, ctx);
  registerBudgetTools(server, ctx);
  registerInsightTools(server, ctx);

  return server;
}

/**
 * Backwards compatibility factory for legacy callers and tests
 */
export function createFinanceMcpServer(
  userId: string,
  supabase: any,
  keyHash?: string
): McpServer {
  const ctx: AuthContext = {
    userId,
    authMethod: keyHash ? "api_key" : "jwt_bearer",
    keyHash,
    scopes: ["*"],
    supabase,
  };
  return createMcpServerInstance(ctx);
}

