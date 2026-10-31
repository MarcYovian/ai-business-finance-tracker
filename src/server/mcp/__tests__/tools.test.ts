import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMcpServerInstance } from "../server";
import { AuthContext } from "@/server/auth/types";

describe("MCP Tools Registration and Dispatch", () => {
  let mockSupabase: any;
  let mockAuthContext: AuthContext;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: { getUser: vi.fn() },
    };

    mockAuthContext = {
      userId: "user-test-uuid",
      authMethod: "api_key",
      scopes: ["*"],
      supabase: mockSupabase,
    };
  });

  it("should register all required MCP financial tools", () => {
    const server = createMcpServerInstance(mockAuthContext);
    const tools = (server as any)._registeredTools;

    expect(tools).toBeDefined();
    const registeredToolNames = Object.keys(tools);

    // Core transaction tools
    expect(registeredToolNames).toContain("list_transactions");
    expect(registeredToolNames).toContain("create_transaction");
    expect(registeredToolNames).toContain("update_transaction");
    expect(registeredToolNames).toContain("delete_transaction");

    // Fund source & balance tools
    expect(registeredToolNames).toContain("list_fund_sources");
    expect(registeredToolNames).toContain("get_balance");

    // Category tools
    expect(registeredToolNames).toContain("list_categories");
    expect(registeredToolNames).toContain("create_category");

    // Budget tools
    expect(registeredToolNames).toContain("get_budget");
    expect(registeredToolNames).toContain("upsert_budget");

    // AI Insight tool
    expect(registeredToolNames).toContain("query_financial_insights");
  });

  it("should execute list_transactions tool and return formatted JSON string", async () => {
    const server = createMcpServerInstance(mockAuthContext);
    const listTransactionsTool = (server as any)._registeredTools["list_transactions"];

    const mockTransactions = [
      {
        id: "tx-mcp-1",
        description: "Langganan SaaS",
        amount: 15000000, // 150,000 IDR in cents
        type: "expense",
        transaction_date: "2026-10-31T10:00:00Z",
        created_at: "2026-10-31T10:00:00Z",
        user_id: "user-test-uuid",
      },
    ];

    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
    };

    mockSupabase.from.mockReturnValue(queryBuilder);

    const result = await listTransactionsTool.handler({ limit: 10 });

    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].amount).toBe(150000); // Converted from cents to Rupiah
  });

  it("should execute get_balance tool and return human-readable summary text", async () => {
    const server = createMcpServerInstance(mockAuthContext);
    const getBalanceTool = (server as any)._registeredTools["get_balance"];

    const mockFunds = [
      {
        id: "f-1",
        user_id: "user-test-uuid",
        name: "Bank BCA",
        type: "bank",
        balance: 500000000, // 5,000,000 IDR
        is_active: true,
        created_at: "2026-10-01T00:00:00Z",
      },
      {
        id: "f-2",
        user_id: "user-test-uuid",
        name: "Dompet GoPay",
        type: "e-wallet",
        balance: 25000000, // 250,000 IDR
        is_active: true,
        created_at: "2026-10-01T00:00:00Z",
      },
    ];

    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => Promise.resolve({ data: mockFunds, error: null })),
    };

    mockSupabase.from.mockReturnValue(queryBuilder);

    const result = await getBalanceTool.handler({});

    expect(result.content[0].text).toContain("Total Saldo Kas Bisnis: Rp5.250.000");
    expect(result.content[0].text).toContain("Bank: Rp5.000.000");
    expect(result.content[0].text).toContain("Dompet Digital: Rp250.000");
  });
});
