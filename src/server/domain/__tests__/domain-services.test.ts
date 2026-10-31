import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthContext } from "@/server/auth/types";
import { TransactionDomainService } from "../transactions/transaction.service";
import { FundSourceDomainService } from "../fund-sources/fund-source.service";
import { BudgetDomainService } from "../budgets/budget.service";
import { ServerFinancialQueryEngine } from "../insights/query-engine";

describe("Unified Domain Service Layer Tests", () => {
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

  describe("TransactionDomainService", () => {
    it("should list transactions via Direct Supabase SDK and convert cents to Rupiah", async () => {
      const mockRawTransactions = [
        {
          id: "tx-1",
          description: "Pembelian Inventaris",
          amount: 25000000, // 250,000 IDR in cents
          type: "expense",
          transaction_date: "2026-10-31T08:00:00Z",
          created_at: "2026-10-31T08:00:00Z",
          user_id: "user-uuid-1234",
          category_id: "cat-1",
          source_fund_id: "fund-1",
          destination_fund_id: null,
          notes: "Nota #101",
          status: "completed",
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRawTransactions, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const service = new TransactionDomainService(mockAuthContext);
      const result = await service.list({ limit: 10 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("tx-1");
      expect(result[0].amount).toBe(250000); // 25,000,000 cents / 100 = 250,000 Rupiah
      expect(result[0].type).toBe("expense");
      expect(mockSupabase.from).toHaveBeenCalledWith("transactions");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-uuid-1234");
    });

    it("should validate balance and throw InsufficientFundsError when balance is less than required", async () => {
      const fundQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: "BCA Operasional", balance: 10000000 }, // 100,000 IDR in cents
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(fundQueryBuilder);

      const service = new TransactionDomainService(mockAuthContext);

      // Attempt to spend 150,000 IDR (15,000,000 cents) when balance is only 100,000 IDR
      await expect(
        service.create({
          description: "Beli Alat Tulis",
          amount: 150000, // Rupiah
          type: "expense",
          sourceFundId: "a0000000-0000-0000-0000-000000000001",
        })
      ).rejects.toThrow(/Saldo akun 'BCA Operasional' tidak mencukupi/);
    });

    it("should convert Rupiah to Cents when creating a transaction via atomic RPC", async () => {
      const fundQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: "Kas Utama", balance: 50000000 }, // 500,000 IDR in cents
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(fundQueryBuilder);

      const rpcQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "tx-created-1",
            description: "Langganan Cloud",
            amount: 20000000, // 200,000 in cents
            type: "expense",
            transaction_date: "2026-10-31T09:00:00Z",
            created_at: "2026-10-31T09:00:00Z",
            user_id: "user-uuid-1234",
            source_fund_id: "a0000000-0000-0000-0000-000000000002",
          },
          error: null,
        }),
      };
      mockSupabase.rpc.mockReturnValue(rpcQueryBuilder);

      const service = new TransactionDomainService(mockAuthContext);
      const created = await service.create({
        description: "Langganan Cloud",
        amount: 200000, // Rupiah
        type: "expense",
        sourceFundId: "a0000000-0000-0000-0000-000000000002",
      });

      expect(created.id).toBe("tx-created-1");
      expect(created.amount).toBe(200000);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "create_transaction_and_update_balance",
        expect.objectContaining({
          p_amount: 20000000, // 200,000 IDR converted to 20,000,000 cents
          p_user_id: "user-uuid-1234",
        })
      );
    });
  });

  describe("FundSourceDomainService", () => {
    it("should convert balance from cents to Rupiah and aggregate summary", async () => {
      const mockAccounts = [
        {
          id: "fund-1",
          user_id: "user-uuid-1234",
          name: "Bank Mandiri",
          type: "bank",
          balance: 100000000, // 1,000,000 IDR in cents
          is_active: true,
          created_at: "2026-10-01T00:00:00Z",
        },
        {
          id: "fund-2",
          user_id: "user-uuid-1234",
          name: "Brankas Kas Tunai",
          type: "cash",
          balance: 50000000, // 500,000 IDR in cents
          is_active: true,
          created_at: "2026-10-01T00:00:00Z",
        },
      ];

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => Promise.resolve({ data: mockAccounts, error: null })),
      };
      mockSupabase.from.mockReturnValue(queryBuilder);

      const service = new FundSourceDomainService(mockAuthContext);
      const summary = await service.getBalanceSummary();

      expect(summary.totalBalance).toBe(1500000); // 1,000,000 + 500,000 IDR
      expect(summary.byType.bank).toBe(1000000);
      expect(summary.byType.cash).toBe(500000);
      expect(summary.accountCount).toBe(2);
    });
  });

  describe("BudgetDomainService", () => {
    it("should fetch budget details and calculate remaining amounts and utilization correctly", async () => {
      mockSupabase.rpc.mockImplementation((fnName: string) => {
        if (fnName === "get_or_create_budget_for_month") {
          return {
            single: vi.fn().mockResolvedValue({
              data: {
                id: "budget-uuid-1",
                user_id: "user-uuid-1234",
                name: "Budget for October 2026",
                start_date: "2026-10-01",
                end_date: "2026-10-31",
                created_at: "2026-10-01T00:00:00Z",
              },
              error: null,
            }),
          };
        }
        if (fnName === "get_budget_details") {
          return Promise.resolve({
            data: [
              {
                id: "item-1",
                category_id: "cat-1",
                category_name: "Pemasaran",
                amount: 100000000, // Planned 1,000,000 IDR in cents
                spent: 75000000, // Spent 750,000 IDR in cents
              },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const service = new BudgetDomainService(mockAuthContext);
      const budget = await service.getOrCreateForMonth(new Date("2026-10-01"));

      expect(budget.id).toBe("budget-uuid-1");
      expect(budget.totalPlanned).toBe(1000000);
      expect(budget.totalSpent).toBe(750000);
      expect(budget.totalRemaining).toBe(250000);
      expect(budget.items[0].utilizationPercentage).toBe(75);
    });
  });

  describe("ServerFinancialQueryEngine", () => {
    it("should compute accurate cashflow and budget alert statuses", () => {
      const now = new Date();
      const isoNow = now.toISOString();

      const transactions = [
        {
          id: "tx-1",
          description: "Pendapatan Proyek A",
          amount: 5000000,
          type: "income" as const,
          transactionDate: isoNow,
          createdAt: isoNow,
          userId: "user-1",
        },
        {
          id: "tx-2",
          description: "Gaji Freelancer",
          amount: 2000000,
          type: "expense" as const,
          transactionDate: isoNow,
          createdAt: isoNow,
          userId: "user-1",
          categoryId: "cat-ops",
        },
      ];

      const categories = [
        {
          id: "cat-ops",
          userId: "user-1",
          name: "Operasional",
          type: "expense" as const,
          isActive: true,
          createdAt: isoNow,
        },
      ];

      const fundSources = [
        {
          id: "fund-1",
          userId: "user-1",
          name: "Rekening Utama",
          type: "bank" as const,
          balance: 10000000,
          isActive: true,
          createdAt: isoNow,
        },
      ];

      const budget = {
        id: "b-1",
        userId: "user-1",
        name: "Budget Bulan Ini",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        totalPlanned: 2500000,
        totalSpent: 2000000,
        totalRemaining: 500000,
        items: [
          {
            categoryId: "cat-ops",
            categoryName: "Operasional",
            plannedAmount: 2500000,
            spentAmount: 2000000,
            remainingAmount: 500000,
            utilizationPercentage: 80,
          },
        ],
      };

      const engine = new ServerFinancialQueryEngine(transactions, categories, fundSources, budget);
      const snapshot = engine.generateHealthSnapshot();

      expect(snapshot.totalBalance).toBe(10000000);
      expect(snapshot.monthlyIncome).toBe(5000000);
      expect(snapshot.monthlyExpense).toBe(2000000);
      expect(snapshot.netCashflow).toBe(3000000);
      expect(snapshot.savingsRatePercentage).toBe(60);
      expect(snapshot.budgetAlerts[0].status).toBe("warning"); // 80% utilization
    });
  });
});
