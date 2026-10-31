import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthContext } from "@/server/auth/types";
import { TransactionDomainService } from "../transactions/transaction.service";
import { FundSourceDomainService } from "../fund-sources/fund-source.service";
import { CategoryDomainService } from "../categories/category.service";
import { BudgetDomainService } from "../budgets/budget.service";
import { BeneficiaryDomainService } from "../beneficiaries/beneficiary.service";
import { FinancialGoalDomainService } from "../financial-goals/financial-goal.service";
import { AIChatDomainService } from "../ai/ai-chat.service";

describe("API v1 Domain Services & Route Handlers Verification", () => {
  let mockSupabase: any;
  let mockAuthContext: AuthContext;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: { getUser: vi.fn() },
    };

    mockAuthContext = {
      userId: "user-uuid-1234",
      authMethod: "api_key",
      scopes: ["*"],
      supabase: mockSupabase,
    };
  });

  describe("Transaction Dynamic & Transfer Operations", () => {
    it("should get transaction by id and convert cents to Rupiah", async () => {
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "tx-abc",
            user_id: "user-uuid-1234",
            amount: 5000000, // 50,000 IDR
            description: "Makan Siang",
            type: "expense",
            transaction_date: "2026-10-31T12:00:00Z",
            created_at: "2026-10-31T12:00:00Z",
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(qb);

      const service = new TransactionDomainService(mockAuthContext);
      const res = await service.getById("tx-abc");

      expect(res.id).toBe("tx-abc");
      expect(res.amount).toBe(50000);
      expect(res.description).toBe("Makan Siang");
    });

    it("should update a transaction via RPC", async () => {
      // Mock getById
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "tx-abc",
            user_id: "user-uuid-1234",
            amount: 5000000,
            description: "Makan Siang",
            type: "expense",
            transaction_date: "2026-10-31T12:00:00Z",
            created_at: "2026-10-31T12:00:00Z",
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(qb);
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const service = new TransactionDomainService(mockAuthContext);
      const res = await service.update({
        id: "a0000000-0000-0000-0000-000000000001",
        description: "Makan Malam",
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith("update_transaction_and_update_balance", expect.any(Object));
      expect(res).toBeDefined();
    });

    it("should delete a transaction via RPC", async () => {
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "tx-abc", user_id: "user-uuid-1234" },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(qb);
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const service = new TransactionDomainService(mockAuthContext);
      await expect(service.delete("tx-abc")).resolves.not.toThrow();
      expect(mockSupabase.rpc).toHaveBeenCalledWith("delete_transaction_and_revert_balance", {
        p_transaction_id: "tx-abc",
      });
    });

    it("should create atomic transfer transaction with source and destination funds", async () => {
      const fundQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: "BCA", balance: 100000000 }, // 1,000,000 IDR
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(fundQb);

      const rpcTx = {
        id: "tx-transfer-1",
        user_id: "user-uuid-1234",
        amount: 25000000,
        type: "transfer",
        transaction_date: "2026-10-31T12:00:00Z",
        source_fund_id: "a0000000-0000-0000-0000-000000000001",
        destination_fund_id: "b0000000-0000-0000-0000-000000000002",
        description: "Transfer Kas",
      };

      mockSupabase.rpc.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: rpcTx, error: null }),
        }),
      });

      const service = new TransactionDomainService(mockAuthContext);
      const res = await service.create({
        type: "transfer",
        amount: 250000,
        sourceFundId: "a0000000-0000-0000-0000-000000000001",
        destinationFundId: "b0000000-0000-0000-0000-000000000002",
        description: "Transfer Kas",
      });

      expect(res.id).toBe("tx-transfer-1");
      expect(res.amount).toBe(250000);
      expect(res.type).toBe("transfer");
    });
  });

  describe("FundSource Dynamic Route Handlers", () => {
    it("should get fund source by id", async () => {
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "fund-1",
            user_id: "user-uuid-1234",
            name: "Bank Mandiri",
            type: "bank",
            balance: 50000000,
            is_active: true,
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(qb);

      const service = new FundSourceDomainService(mockAuthContext);
      const res = await service.getById("fund-1");

      expect(res.id).toBe("fund-1");
      expect(res.balance).toBe(500000);
    });

    it("should update fund source details", async () => {
      const getQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "fund-1", user_id: "user-uuid-1234", name: "Bank Mandiri", balance: 50000000 },
          error: null,
        }),
      };
      const updateQb = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "fund-1", user_id: "user-uuid-1234", name: "Bank Mandiri Bisnis", balance: 50000000 },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(getQb).mockReturnValueOnce(updateQb);

      const service = new FundSourceDomainService(mockAuthContext);
      const res = await service.update("fund-1", { name: "Bank Mandiri Bisnis" });

      expect(res.name).toBe("Bank Mandiri Bisnis");
    });

    it("should delete fund source when no transactions exist", async () => {
      const getQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "fund-1", user_id: "user-uuid-1234" },
          error: null,
        }),
      };
      const checkTxQb = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };
      const deleteQb: any = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      deleteQb.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from
        .mockReturnValueOnce(getQb)
        .mockReturnValueOnce(checkTxQb)
        .mockReturnValueOnce(deleteQb);

      const service = new FundSourceDomainService(mockAuthContext);
      await expect(service.delete("fund-1")).resolves.not.toThrow();
    });
  });

  describe("Category Dynamic Route Handlers", () => {
    it("should get category by id", async () => {
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "cat-1",
            user_id: "user-uuid-1234",
            name: "Operasional",
            type: "expense",
            is_active: true,
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(qb);

      const service = new CategoryDomainService(mockAuthContext);
      const res = await service.getById("cat-1");

      expect(res.name).toBe("Operasional");
    });

    it("should update category details", async () => {
      const getQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "cat-1", user_id: "user-uuid-1234", name: "Operasional", type: "expense" },
          error: null,
        }),
      };
      const updateQb = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "cat-1", user_id: "user-uuid-1234", name: "Operasional Kantor", type: "expense" },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(getQb).mockReturnValueOnce(updateQb);

      const service = new CategoryDomainService(mockAuthContext);
      const res = await service.update("cat-1", { name: "Operasional Kantor" });

      expect(res.name).toBe("Operasional Kantor");
    });

    it("should delete category when no transactions exist", async () => {
      const getQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "cat-1", user_id: "user-uuid-1234" },
          error: null,
        }),
      };
      const checkTxQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };
      const deleteQb: any = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      deleteQb.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from
        .mockReturnValueOnce(getQb)
        .mockReturnValueOnce(checkTxQb)
        .mockReturnValueOnce(deleteQb);

      const service = new CategoryDomainService(mockAuthContext);
      await expect(service.delete("cat-1")).resolves.not.toThrow();
    });
  });

  describe("BeneficiaryDomainService", () => {
    it("should list beneficiaries", async () => {
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "b-1",
              user_id: "user-uuid-1234",
              name: "PT Mitra Mandiri",
              bank_name: "BCA",
              account_number: "1234567890",
              account_type: "bank",
              created_at: "2026-10-31T00:00:00Z",
            },
          ],
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(qb);

      const service = new BeneficiaryDomainService(mockAuthContext);
      const res = await service.list();

      expect(res).toHaveLength(1);
      expect(res[0].name).toBe("PT Mitra Mandiri");
      expect(res[0].bankName).toBe("BCA");
      expect(res[0].accountNumber).toBe("1234567890");
    });

    it("should create beneficiary", async () => {
      const qb = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "b-new",
            user_id: "user-uuid-1234",
            name: "John Doe",
            bank_name: "GoPay",
            account_number: "08123456789",
            account_type: "ewallet",
            created_at: "2026-10-31T00:00:00Z",
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(qb);

      const service = new BeneficiaryDomainService(mockAuthContext);
      const res = await service.create({
        name: "John Doe",
        bankName: "GoPay",
        accountNumber: "08123456789",
        accountType: "ewallet",
      });

      expect(res.id).toBe("b-new");
      expect(res.name).toBe("John Doe");
    });

    it("should delete beneficiary", async () => {
      const getQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "b-1", user_id: "user-uuid-1234" },
          error: null,
        }),
      };
      const deleteQb = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      deleteQb.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockReturnValueOnce(getQb).mockReturnValueOnce(deleteQb);

      const service = new BeneficiaryDomainService(mockAuthContext);
      await expect(service.delete("b-1")).resolves.not.toThrow();
    });
  });

  describe("FinancialGoalDomainService", () => {
    it("should list and convert financial goals from cents to Rupiah", async () => {
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      qb.order.mockReturnValueOnce(qb).mockReturnValueOnce({
        data: [
          {
            id: "goal-1",
            user_id: "user-uuid-1234",
            name: "Dana Darurat",
            target_amount: 5000000000, // 50,000,000 IDR
            current_amount: 1500000000, // 15,000,000 IDR
            category: "savings",
            target_date: "2026-12-31",
            status: "active",
            priority: 1,
          },
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValue(qb);

      const service = new FinancialGoalDomainService(mockAuthContext);
      const res = await service.list();

      expect(res).toHaveLength(1);
      expect(res[0].targetAmount).toBe(50000000);
      expect(res[0].currentAmount).toBe(15000000);
    });

    it("should upsert financial goal converting Rupiah to cents", async () => {
      const qb = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "goal-1",
            user_id: "user-uuid-1234",
            name: "Dana Ekspansi",
            target_amount: 10000000000, // 100,000,000 IDR
            current_amount: 0,
            category: "investment",
            target_date: "2027-01-01",
            status: "active",
            priority: 2,
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(qb);

      const service = new FinancialGoalDomainService(mockAuthContext);
      const res = await service.upsert({
        name: "Dana Ekspansi",
        targetAmount: 100000000,
        category: "investment",
        targetDate: "2027-01-01",
      });

      expect(res.id).toBe("goal-1");
      expect(res.targetAmount).toBe(100000000);
    });
  });

  describe("AIChatDomainService", () => {
    it("should process chat and return structured financial response", async () => {
      // Mock sub-service calls
      const listTxQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const listFundQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: "f-1", user_id: "user-uuid-1234", name: "BCA", balance: 50000000 }],
          error: null,
        }),
      };
      const listCatQb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      listCatQb.order.mockReturnValueOnce(listCatQb).mockReturnValueOnce({
        data: [{ id: "c-1", user_id: "user-uuid-1234", name: "Operasional" }],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce(listTxQb)
        .mockReturnValueOnce(listFundQb)
        .mockReturnValueOnce(listCatQb);

      mockSupabase.rpc
        .mockReturnValueOnce({
          single: vi.fn().mockResolvedValue({
            data: { id: "b-1", user_id: "user-uuid-1234", start_date: "2026-10-01", end_date: "2026-10-31" },
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          data: [{ id: "bi-1", category_id: "c-1", amount: 100000000, spent: 50000000 }],
          error: null,
        });

      const service = new AIChatDomainService(mockAuthContext);
      const res = await service.processChat({
        message: "Berapa total saldo saya saat ini?",
      });

      expect(res.intent).toBe("query_data");
      expect(res.reply).toContain("saldo");
      expect(res.suggestedPrompts).toBeDefined();
    });
  });
});
