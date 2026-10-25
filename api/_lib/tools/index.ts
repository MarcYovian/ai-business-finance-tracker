import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  listTransactionsSchema,
  createTransactionSchema,
  updateTransactionSchema,
  handleListTransactions,
  handleCreateTransaction,
  handleUpdateTransaction,
} from "./transactions.js";
import {
  listFundSourcesSchema,
  handleListFundSources,
} from "./fundSources.js";
import {
  listCategoriesSchema,
  handleListCategories,
} from "./categories.js";

/**
 * Registers all financial management tools to an McpServer instance.
 * Binds the authenticated user ID and Supabase client context.
 */
export function registerAllTools(
  server: McpServer,
  supabase: SupabaseClient,
  userId: string
) {
  // 1. Transactions: List
  server.registerTool(
    "list_transactions",
    {
      description:
        "Melihat riwayat transaksi keuangan bisnis pengguna. Mendukung filter rentang tanggal, tipe (income, expense, transfer), dan kategori.",
      inputSchema: listTransactionsSchema,
    },
    async (args) => handleListTransactions(supabase, userId, args)
  );

  // 2. Transactions: Create
  server.registerTool(
    "create_transaction",
    {
      description:
        "Mencatat transaksi baru (pengeluaran, pemasukan, atau transfer). Otomatis memperbarui saldo akun kas/bank melalui PostgreSQL RPC function yang aman.",
      inputSchema: createTransactionSchema,
    },
    async (args) => handleCreateTransaction(supabase, userId, args)
  );

  // 3. Transactions: Update
  server.registerTool(
    "update_transaction",
    {
      description:
        "Memperbarui detail transaksi yang sudah ada (nominal, deskripsi, tanggal, atau kategori) dan merekonsiliasi saldo rekening.",
      inputSchema: updateTransactionSchema,
    },
    async (args) => handleUpdateTransaction(supabase, userId, args)
  );

  // 4. Fund Sources / Accounts: List
  server.registerTool(
    "list_fund_sources",
    {
      description:
        "Mendapatkan daftar seluruh akun sumber dana (rekening bank, kas tunai, dompet digital, kartu kredit) beserta saldo saat ini.",
      inputSchema: listFundSourcesSchema,
    },
    async () => handleListFundSources(supabase, userId)
  );

  // 5. Categories: List
  server.registerTool(
    "list_categories",
    {
      description:
        "Mendapatkan daftar kategori pemasukan dan pengeluaran beserta subkategorinya untuk membantu pengkategorian transaksi yang tepat.",
      inputSchema: listCategoriesSchema,
    },
    async (args) => handleListCategories(supabase, userId, args)
  );
}
