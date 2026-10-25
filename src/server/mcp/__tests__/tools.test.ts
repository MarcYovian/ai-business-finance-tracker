import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleListTransactions,
  handleCreateTransaction,
  handleUpdateTransaction,
} from "../tools/transactions";
import { handleListFundSources } from "../tools/fundSources";
import { handleListCategories } from "../tools/categories";

// Mock the underlying services
vi.mock("../services/transactionService", () => ({
  listTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));

vi.mock("../services/fundSourceService", () => ({
  listFundSources: vi.fn(),
}));

vi.mock("../services/categoryService", () => ({
  listCategories: vi.fn(),
}));

import {
  listTransactions,
  createTransaction,
  updateTransaction,
} from "../services/transactionService";
import { listFundSources } from "../services/fundSourceService";
import { listCategories } from "../services/categoryService";

describe("MCP Tools Handlers", () => {
  const mockSupabase = {} as any;
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Transactions Tools", () => {
    describe("handleListTransactions", () => {
      it("should return friendly message when no transactions found", async () => {
        (listTransactions as any).mockResolvedValue([]);

        const result = await handleListTransactions(mockSupabase, mockUserId, {});

        expect(result.content[0].text).toContain("Tidak ada transaksi yang ditemukan");
      });

      it("should format transactions list nicely for AI", async () => {
        (listTransactions as any).mockResolvedValue([
          {
            id: "tx-1",
            description: "Gaji Karyawan",
            amount: 5000000,
            type: "expense",
            transactionDate: "2026-10-25T10:00:00Z",
          },
          {
            id: "tx-2",
            description: "Invoice Proyek",
            amount: 15000000,
            type: "income",
            transactionDate: "2026-10-25T11:00:00Z",
          },
        ]);

        const result = await handleListTransactions(mockSupabase, mockUserId, {});

        expect(result.content[0].text).toContain("Ditemukan 2 transaksi");
        expect(result.content[0].text).toContain("- Rp5.000.000 | Gaji Karyawan");
        expect(result.content[0].text).toContain("+ Rp15.000.000 | Invoice Proyek");
      });

      it("should return isError if service throws", async () => {
        (listTransactions as any).mockRejectedValue(new Error("Database connection failed"));

        const result = await handleListTransactions(mockSupabase, mockUserId, {});

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Gagal mengambil daftar transaksi");
      });
    });

    describe("handleCreateTransaction", () => {
      it("should reject expense without sourceFundId", async () => {
        const result = await handleCreateTransaction(mockSupabase, mockUserId, {
          description: "Makan Siang",
          amount: 50000,
          type: "expense",
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("parameter 'sourceFundId' wajib disertakan");
      });

      it("should reject income without destinationFundId", async () => {
        const result = await handleCreateTransaction(mockSupabase, mockUserId, {
          description: "Pendapatan Usaha",
          amount: 500000,
          type: "income",
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("parameter 'destinationFundId' wajib disertakan");
      });

      it("should reject transfer without source and destination fund ids", async () => {
        const result = await handleCreateTransaction(mockSupabase, mockUserId, {
          description: "Transfer Kas",
          amount: 200000,
          type: "transfer",
          sourceFundId: "fund-1",
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("baik 'sourceFundId' maupun 'destinationFundId' wajib disertakan");
      });

      it("should return confirmation on successful creation", async () => {
        (createTransaction as any).mockResolvedValue({
          id: "created-tx-123",
          description: "Beli Perlengkapan",
          amount: 150000,
          type: "expense",
          transactionDate: "2026-10-25T12:00:00Z",
        });

        const result = await handleCreateTransaction(mockSupabase, mockUserId, {
          description: "Beli Perlengkapan",
          amount: 150000,
          type: "expense",
          sourceFundId: "fund-bca",
        });

        expect(result.content[0].text).toContain("Transaksi berhasil dicatat!");
        expect(result.content[0].text).toContain("created-tx-123");
        expect(result.content[0].text).toContain("Rp150.000");
      });
    });

    describe("handleUpdateTransaction", () => {
      it("should return success message on update", async () => {
        (updateTransaction as any).mockResolvedValue(undefined);

        const result = await handleUpdateTransaction(mockSupabase, mockUserId, {
          id: "tx-to-update",
          description: "Deskripsi Baru",
        });

        expect(result.content[0].text).toContain("Transaksi dengan ID `tx-to-update` berhasil diperbarui");
      });
    });
  });

  describe("Fund Sources Tools", () => {
    describe("handleListFundSources", () => {
      it("should calculate total balance and format fund accounts", async () => {
        (listFundSources as any).mockResolvedValue([
          {
            id: "fund-1",
            name: "Kas Toko",
            type: "cash",
            balance: 500000,
            isActive: true,
          },
          {
            id: "fund-2",
            name: "BCA Giro",
            type: "bank",
            balance: 20000000,
            isActive: true,
          },
        ]);

        const result = await handleListFundSources(mockSupabase, mockUserId);

        expect(result.content[0].text).toContain("Total Saldo: Rp20.500.000");
        expect(result.content[0].text).toContain("**Kas Toko** (cash): Rp500.000");
        expect(result.content[0].text).toContain("**BCA Giro** (bank): Rp20.000.000");
      });
    });
  });

  describe("Categories Tools", () => {
    describe("handleListCategories", () => {
      it("should format parent and nested subcategories hierarchy", async () => {
        (listCategories as any).mockResolvedValue([
          {
            id: "parent-1",
            name: "Operasional Kantor",
            type: "expense",
            parentId: null,
          },
          {
            id: "child-1",
            name: "Listrik & Internet",
            type: "expense",
            parentId: "parent-1",
          },
        ]);

        const result = await handleListCategories(mockSupabase, mockUserId, {});

        expect(result.content[0].text).toContain("- **Operasional Kantor** [EXPENSE]");
        expect(result.content[0].text).toContain("└─ Listrik & Internet");
      });
    });
  });
});
