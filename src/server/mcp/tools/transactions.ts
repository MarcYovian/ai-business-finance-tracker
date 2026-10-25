import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "../services/transactionService.js";

export const listTransactionsSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Jumlah maksimum transaksi yang ingin ditampilkan (default: 50)."),
  type: z
    .enum(["income", "expense", "transfer"])
    .optional()
    .describe("Filter berdasarkan tipe: 'income' (pemasukan), 'expense' (pengeluaran), atau 'transfer'."),
  startDate: z
    .string()
    .optional()
    .describe("Tanggal awal dalam format ISO 8601 (contoh: '2026-01-01' atau '2026-01-01T00:00:00Z')."),
  endDate: z
    .string()
    .optional()
    .describe("Tanggal akhir dalam format ISO 8601 (contoh: '2026-01-31' atau '2026-01-31T23:59:59Z')."),
  categoryId: z
    .string()
    .uuid()
    .optional()
    .describe("ID Kategori spesifik jika ingin memfilter pengeluaran/pemasukan pada kategori tertentu."),
});

export const createTransactionSchema = z.object({
  description: z
    .string()
    .min(1)
    .describe("Deskripsi atau catatan singkat transaksi, misal: 'Beli makan siang tim' atau 'Pembayaran invoice klien'."),
  amount: z
    .number()
    .positive()
    .describe("Nominal uang dalam Rupiah (contoh: 50000 untuk Rp50.000)."),
  type: z
    .enum(["income", "expense", "transfer"])
    .describe("Tipe transaksi: 'income' (pemasukan), 'expense' (pengeluaran), 'transfer' (pindah saldo antar rekening)."),
  sourceFundId: z
    .string()
    .uuid()
    .optional()
    .describe("ID Akun/Rekening asal. Wajib diisi jika tipe adalah 'expense' atau 'transfer'."),
  destinationFundId: z
    .string()
    .uuid()
    .optional()
    .describe("ID Akun/Rekening tujuan. Wajib diisi jika tipe adalah 'income' atau 'transfer'."),
  categoryId: z
    .string()
    .uuid()
    .optional()
    .describe("ID Kategori transaksi (dapatkan dari tool list_categories)."),
  transactionDate: z
    .string()
    .optional()
    .describe("Tanggal transaksi dalam format ISO string (default: waktu sekarang)."),
  fee: z
    .number()
    .nonnegative()
    .optional()
    .describe("Biaya admin transfer dalam Rupiah (jika ada)."),
  notes: z
    .string()
    .optional()
    .describe("Catatan tambahan opsional."),
});

export const updateTransactionSchema = z.object({
  id: z
    .string()
    .uuid()
    .describe("ID Transaksi yang ingin diperbarui."),
  description: z
    .string()
    .optional()
    .describe("Deskripsi baru transaksi."),
  amount: z
    .number()
    .positive()
    .optional()
    .describe("Nominal baru dalam Rupiah."),
  type: z
    .enum(["income", "expense", "transfer"])
    .optional()
    .describe("Tipe transaksi baru."),
  sourceFundId: z
    .string()
    .uuid()
    .optional()
    .describe("ID Akun asal baru."),
  destinationFundId: z
    .string()
    .uuid()
    .optional()
    .describe("ID Akun tujuan baru."),
  categoryId: z
    .string()
    .uuid()
    .optional()
    .describe("ID Kategori baru."),
  transactionDate: z
    .string()
    .optional()
    .describe("Tanggal transaksi baru."),
  fee: z
    .number()
    .nonnegative()
    .optional()
    .describe("Biaya transfer baru dalam Rupiah."),
});

export async function handleListTransactions(
  supabase: SupabaseClient,
  userId: string,
  args: z.infer<typeof listTransactionsSchema>,
  keyHash?: string
) {
  try {
    const transactions = await listTransactions(supabase, userId, args, keyHash);

    if (transactions.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Tidak ada transaksi yang ditemukan sesuai filter yang diberikan.",
          },
        ],
      };
    }

    const summary = transactions.map((t) => {
      const formattedAmount = `Rp${t.amount.toLocaleString("id-ID")}`;
      const sign = t.type === "expense" ? "-" : t.type === "income" ? "+" : "⇄";
      return `- [${t.transactionDate.slice(0, 10)}] ${sign} ${formattedAmount} | ${t.description} (Tipe: ${t.type}, ID: \`${t.id}\`)`;
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Ditemukan ${transactions.length} transaksi:\n\n${summary.join("\n")}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Gagal mengambil daftar transaksi: ${error.message}` }],
    };
  }
}

export async function handleCreateTransaction(
  supabase: SupabaseClient,
  userId: string,
  args: z.infer<typeof createTransactionSchema>,
  keyHash?: string
) {
  try {
    if (args.type === "expense" && !args.sourceFundId) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: "Untuk transaksi pengeluaran (expense), parameter 'sourceFundId' wajib disertakan. Gunakan tool 'list_fund_sources' untuk melihat daftar akun yang tersedia.",
          },
        ],
      };
    }

    if (args.type === "income" && !args.destinationFundId) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: "Untuk transaksi pemasukan (income), parameter 'destinationFundId' wajib disertakan. Gunakan tool 'list_fund_sources' untuk melihat daftar akun tujuan.",
          },
        ],
      };
    }

    if (args.type === "transfer" && (!args.sourceFundId || !args.destinationFundId)) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: "Untuk transaksi transfer, baik 'sourceFundId' maupun 'destinationFundId' wajib disertakan.",
          },
        ],
      };
    }

    const newTx = await createTransaction(supabase, userId, args as unknown as CreateTransactionInput, keyHash);

    return {
      content: [
        {
          type: "text" as const,
          text: `✅ Transaksi berhasil dicatat!\n- ID: \`${newTx.id}\`\n- Deskripsi: ${newTx.description}\n- Nominal: Rp${newTx.amount.toLocaleString("id-ID")}\n- Tipe: ${newTx.type}\n- Tanggal: ${newTx.transactionDate}\nSaldo rekening telah diperbarui secara otomatis via RPC.`,
        },
      ],
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `❌ Gagal mencatat transaksi: ${error.message}` }],
    };
  }
}

export async function handleUpdateTransaction(
  supabase: SupabaseClient,
  userId: string,
  args: z.infer<typeof updateTransactionSchema>,
  keyHash?: string
) {
  try {
    await updateTransaction(supabase, userId, args as unknown as UpdateTransactionInput, keyHash);

    return {
      content: [
        {
          type: "text" as const,
          text: `✅ Transaksi dengan ID \`${args.id}\` berhasil diperbarui dan saldo rekening telah direkonsiliasi otomatis.`,
        },
      ],
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `❌ Gagal memperbarui transaksi: ${error.message}` }],
    };
  }
}
