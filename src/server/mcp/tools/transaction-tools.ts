import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AuthContext } from "@/server/auth/types";
import { TransactionDomainService } from "@/server/domain/transactions/transaction.service";

export function registerTransactionTools(server: McpServer, ctx: AuthContext) {
  const service = new TransactionDomainService(ctx);

  // 1. Tool: list_transactions
  server.registerTool(
    "list_transactions",
    {
      description:
        "Melihat riwayat transaksi keuangan bisnis pengguna. Mendukung filter rentang tanggal, tipe (income, expense, transfer), dan kategori.",
      inputSchema: z.object({
        limit: z.number().min(1).max(200).optional().default(50).describe("Maksimum jumlah transaksi."),
        type: z.enum(["income", "expense", "transfer"]).optional().describe("Filter tipe transaksi."),
        startDate: z.string().optional().describe("Tanggal awal format ISO (contoh: 2026-01-01)."),
        endDate: z.string().optional().describe("Tanggal akhir format ISO (contoh: 2026-01-31)."),
        categoryId: z.string().uuid().optional().describe("ID kategori transaksi."),
      }),
    },
    async (args) => {
      try {
        const transactions = await service.list(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(transactions, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error list_transactions: ${err.message}` }],
        };
      }
    }
  );

  // 2. Tool: create_transaction
  server.registerTool(
    "create_transaction",
    {
      description:
        "Mencatat transaksi baru (pengeluaran, pemasukan, atau transfer). Otomatis memperbarui saldo akun kas/bank melalui PostgreSQL RPC function yang aman.",
      inputSchema: z.object({
        description: z.string().min(1).describe("Deskripsi atau catatan singkat transaksi."),
        amount: z.number().positive().describe("Nominal uang dalam Rupiah (contoh: 50000)."),
        type: z.enum(["income", "expense", "transfer"]).describe("Tipe transaksi."),
        sourceFundId: z.string().uuid().optional().describe("ID Akun asal (wajib jika expense atau transfer)."),
        destinationFundId: z.string().uuid().optional().describe("ID Akun tujuan (wajib jika income atau transfer)."),
        categoryId: z.string().uuid().optional().describe("ID Kategori transaksi."),
        transactionDate: z.string().optional().describe("Tanggal transaksi format ISO."),
        fee: z.number().nonnegative().optional().describe("Biaya admin transfer dalam Rupiah."),
        notes: z.string().optional().describe("Catatan tambahan opsional."),
      }),
    },
    async (args) => {
      try {
        const result = await service.create(args as any);
        return {
          content: [
            {
              type: "text",
              text: `Berhasil mencatat transaksi: ${result.description} sebesar Rp${result.amount.toLocaleString("id-ID")}. ID: ${result.id}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error create_transaction: ${err.message}` }],
        };
      }
    }
  );

  // 3. Tool: update_transaction
  server.registerTool(
    "update_transaction",
    {
      description:
        "Memperbarui detail transaksi yang sudah ada dan merekonsiliasi saldo rekening.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID Transaksi yang ingin diperbarui."),
        description: z.string().optional().describe("Deskripsi baru."),
        amount: z.number().positive().optional().describe("Nominal baru dalam Rupiah."),
        type: z.enum(["income", "expense", "transfer"]).optional().describe("Tipe transaksi baru."),
        sourceFundId: z.string().uuid().optional().describe("ID Akun asal baru."),
        destinationFundId: z.string().uuid().optional().describe("ID Akun tujuan baru."),
        categoryId: z.string().uuid().optional().describe("ID Kategori baru."),
        transactionDate: z.string().optional().describe("Tanggal baru format ISO."),
        fee: z.number().nonnegative().optional().describe("Biaya admin transfer baru."),
        notes: z.string().optional().describe("Catatan baru."),
      }),
    },
    async (args) => {
      try {
        const result = await service.update(args as any);
        return {
          content: [
            {
              type: "text",
              text: `Berhasil memperbarui transaksi '${result.id}'. Saldo akun terkait telah disesuaikan.`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error update_transaction: ${err.message}` }],
        };
      }
    }
  );

  // 4. Tool: delete_transaction
  server.registerTool(
    "delete_transaction",
    {
      description:
        "Menghapus transaksi yang sudah ada dan mengembalikan saldo rekening ke kondisi semula.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID Transaksi yang ingin dihapus."),
      }),
    },
    async (args) => {
      try {
        await service.delete(args.id);
        return {
          content: [
            {
              type: "text",
              text: `Transaksi '${args.id}' berhasil dihapus dan saldo akun telah dikembalikan.`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error delete_transaction: ${err.message}` }],
        };
      }
    }
  );
}
