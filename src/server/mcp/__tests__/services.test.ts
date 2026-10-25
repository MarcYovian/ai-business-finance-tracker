import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
} from "../services/transactionService";
import { listFundSources } from "../services/fundSourceService";
import { listCategories } from "../services/categoryService";

describe("MCP Services", () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    };
  });

  describe("transactionService", () => {
    describe("listTransactions", () => {
      it("should fetch transactions and convert amounts from cents to Rupiah", async () => {
        const mockRawTransactions = [
          {
            id: "tx-1",
            description: "Penjualan Kopi",
            amount: 5000000, // 50,000 IDR in cents
            type: "income",
            transaction_date: "2026-10-25T10:00:00Z",
            created_at: "2026-10-25T10:00:00Z",
            user_id: "user-123",
            category_id: "cat-1",
            source_fund_id: null,
            destination_fund_id: "fund-1",
            notes: null,
            status: "completed",
            parent_transaction_id: null,
          },
        ];

        const queryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockRawTransactions, error: null }),
        };
        mockSupabase.from.mockReturnValue(queryBuilder);

        const result = await listTransactions(mockSupabase, "user-123", { limit: 10 });

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("tx-1");
        expect(result[0].amount).toBe(50000); // Converted from 5000000 cents
        expect(result[0].type).toBe("income");
      });

      it("should throw error when database query fails", async () => {
        const queryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
        };
        mockSupabase.from.mockReturnValue(queryBuilder);

        await expect(listTransactions(mockSupabase, "user-123")).rejects.toThrow(
          "Failed to list transactions: DB Error"
        );
      });
    });

    describe("createTransaction", () => {
      it("should reject expense when source fund balance is insufficient", async () => {
        // Mock fund sources balance check: balance = Rp20.000 (2,000,000 cents)
        const fundQueryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { name: "Kas Kecil", balance: 2000000 },
            error: null,
          }),
        };
        mockSupabase.from.mockReturnValue(fundQueryBuilder);

        // Attempting to spend Rp50.000
        await expect(
          createTransaction(mockSupabase, "user-123", {
            description: "Belanja ATK",
            amount: 50000,
            type: "expense",
            sourceFundId: "fund-kas",
          })
        ).rejects.toThrow("Saldo akun 'Kas Kecil' tidak mencukupi");
      });

      it("should convert amount to cents and invoke RPC when balance is sufficient", async () => {
        // Mock sufficient balance: balance = Rp100.000 (10,000,000 cents)
        const fundQueryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { name: "Rekening BCA", balance: 10000000 },
            error: null,
          }),
        };
        mockSupabase.from.mockReturnValue(fundQueryBuilder);

        // Mock RPC call
        const rpcChain: any = {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "new-tx-uuid",
              description: "Belanja ATK",
              amount: 5000000,
              type: "expense",
              transaction_date: "2026-10-25T11:00:00Z",
              created_at: "2026-10-25T11:00:00Z",
              user_id: "user-123",
              category_id: null,
              source_fund_id: "fund-bca",
              destination_fund_id: null,
              notes: null,
              status: "completed",
            },
            error: null,
          }),
        };
        mockSupabase.rpc.mockReturnValue(rpcChain);

        const result = await createTransaction(mockSupabase, "user-123", {
          description: "Belanja ATK",
          amount: 50000,
          type: "expense",
          sourceFundId: "fund-bca",
        });

        expect(result.id).toBe("new-tx-uuid");
        expect(result.amount).toBe(50000); // Converted back to Rupiah
        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          "create_transaction_and_update_balance",
          expect.objectContaining({
            p_description: "Belanja ATK",
            p_amount: 5000000, // in cents
            p_type: "expense",
            p_user_id: "user-123",
            p_source_fund_id: "fund-bca",
          })
        );
      });
    });

    describe("updateTransaction", () => {
      it("should verify existing transaction and call update RPC", async () => {
        // Mock get existing transaction
        const txQueryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "tx-exist",
              description: "Lama",
              amount: 2000000,
              type: "expense",
              transaction_date: "2026-10-20T00:00:00Z",
              category_id: null,
              source_fund_id: "fund-1",
              destination_fund_id: null,
              fee: 0,
            },
            error: null,
          }),
        };
        mockSupabase.from.mockReturnValue(txQueryBuilder);

        mockSupabase.rpc.mockResolvedValue({ error: null });

        await updateTransaction(mockSupabase, "user-123", {
          id: "tx-exist",
          description: "Deskripsi Baru",
          amount: 30000,
        });

        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          "update_transaction_and_update_balance",
          expect.objectContaining({
            p_id: "tx-exist",
            p_description: "Deskripsi Baru",
            p_amount: 3000000, // converted to cents
          })
        );
      });
    });
  });

  describe("fundSourceService", () => {
    it("should list fund sources and convert balance to Rupiah", async () => {
      const mockRawFunds = [
        {
          id: "fund-1",
          user_id: "user-123",
          name: "Bank Mandiri",
          type: "bank",
          balance: 150000000, // Rp1.500.000 in cents
          account_number: "123456",
          account_holder_name: "John",
          color_theme: "blue",
          is_active: true,
          created_at: "2026-10-01T00:00:00Z",
        },
      ];

      const queryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRawFunds, error: null }),
      };
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await listFundSources(mockSupabase, "user-123");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Bank Mandiri");
      expect(result[0].balance).toBe(1500000); // in Rupiah
      expect(result[0].isActive).toBe(true);
    });
  });

  describe("categoryService", () => {
    it("should list categories with optional type filter", async () => {
      const mockRawCategories = [
        {
          id: "cat-1",
          name: "Operasional",
          user_id: "user-123",
          type: "expense",
          parent_id: null,
          color: "#ff0000",
          icon: "briefcase",
          description: null,
          sort_order: 1,
          is_active: true,
          created_at: "2026-10-01T00:00:00Z",
        },
      ];

      const queryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRawCategories, error: null }),
      };
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await listCategories(mockSupabase, "user-123", "expense");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Operasional");
      expect(result[0].type).toBe("expense");
    });
  });
});
