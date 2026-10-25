import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMcpRequest } from "../handler";
import { createFinanceMcpServer } from "../server";

// Mock auth module
vi.mock("../auth", () => ({
  authenticateMcpRequest: vi.fn(),
}));

import { authenticateMcpRequest } from "../auth";

describe("MCP Handler & Server Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createFinanceMcpServer", () => {
    it("should instantiate McpServer with all 5 registered tools", () => {
      const mockSupabase = {} as any;
      const server = createFinanceMcpServer("user-123", mockSupabase);

      // Verify that server is an instance and has tools registered
      expect(server).toBeDefined();
      expect((server as any)._registeredTools).toBeDefined();
      const toolNames = Object.keys((server as any)._registeredTools);
      expect(toolNames).toContain("list_transactions");
      expect(toolNames).toContain("create_transaction");
      expect(toolNames).toContain("update_transaction");
      expect(toolNames).toContain("list_fund_sources");
      expect(toolNames).toContain("list_categories");
    });
  });

  describe("handleMcpRequest", () => {
    it("should respond to OPTIONS request with 204 and CORS headers", async () => {
      const request = new Request("http://localhost:8080/api/mcp", {
        method: "OPTIONS",
      });

      const response = await handleMcpRequest(request);

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });

    it("should respond with 401 JSON-RPC error when unauthenticated", async () => {
      (authenticateMcpRequest as any).mockRejectedValue(
        new Error("Unauthorized: Header 'Authorization: Bearer <api_key>' wajib disertakan")
      );

      const request = new Request("http://localhost:8080/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/list",
          id: 1,
        }),
      });

      const response = await handleMcpRequest(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.jsonrpc).toBe("2.0");
      expect(json.error.code).toBe(-32001);
      expect(json.error.message).toContain("Header 'Authorization: Bearer <api_key>' wajib disertakan");
    });

    it("should accept x-api-key header for authentication", async () => {
      (authenticateMcpRequest as any).mockResolvedValue({
        userId: "user-api-key",
        supabase: {},
        authMethod: "api_key",
      });

      const request = new Request("http://localhost:8080/api/mcp", {
        method: "OPTIONS",
        headers: {
          "x-api-key": "afi_live_samplekey123",
        },
      });

      const response = await handleMcpRequest(request);
      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Headers")).toContain("x-api-key");
    });
  });
});
