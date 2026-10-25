import { SupabaseClient } from "@supabase/supabase-js";
import { TransactionDTO, TransactionType } from "../types.js";

export interface ListTransactionsFilter {
  limit?: number;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}

export interface CreateTransactionInput {
  description: string;
  amount: number; // in Rupiah
  type: TransactionType;
  transactionDate?: string;
  categoryId?: string | null;
  sourceFundId?: string | null;
  destinationFundId?: string | null;
  fee?: number; // in Rupiah
  notes?: string | null;
}

export interface UpdateTransactionInput {
  id: string;
  description?: string;
  amount?: number; // in Rupiah
  type?: TransactionType;
  transactionDate?: string;
  categoryId?: string | null;
  sourceFundId?: string | null;
  destinationFundId?: string | null;
  fee?: number;
  notes?: string | null;
}

export async function listTransactions(
  supabase: SupabaseClient,
  userId: string,
  filter: ListTransactionsFilter = {},
  keyHash?: string
): Promise<TransactionDTO[]> {
  const { data, error } = await supabase.rpc("mcp_list_transactions", {
    p_user_id: userId,
    p_key_hash: keyHash || null,
    p_type: filter.type || null,
    p_start_date: filter.startDate || null,
    p_end_date: filter.endDate || null,
    p_category_id: filter.categoryId || null,
    p_limit: filter.limit || 50,
  });

  if (error) {
    throw new Error(`Failed to list transactions: ${error.message}`);
  }

  return (data || []).map((t: any) => ({
    id: t.id,
    description: t.description,
    amount: (t.amount || 0) / 100, // Cents to Rupiah
    type: t.type,
    transactionDate: t.transaction_date,
    createdAt: t.created_at,
    userId: t.user_id,
    categoryId: t.category_id,
    sourceFundId: t.source_fund_id,
    destinationFundId: t.destination_fund_id,
    notes: t.notes,
    status: t.status,
    parentTransactionId: t.parent_transaction_id,
  }));
}

export async function createTransaction(
  supabase: SupabaseClient,
  userId: string,
  input: CreateTransactionInput,
  keyHash?: string
): Promise<TransactionDTO> {
  const amountInCents = Math.round(input.amount * 100);
  const feeInCents = input.fee ? Math.round(input.fee * 100) : 0;
  const transactionDate = input.transactionDate || new Date().toISOString();

  // Pre-validate balance for expense / transfer using secure RPC
  if ((input.type === "expense" || input.type === "transfer") && input.sourceFundId) {
    const { data: sourceFunds, error: fundError } = await supabase.rpc("mcp_get_fund_source", {
      p_id: input.sourceFundId,
      p_user_id: userId,
      p_key_hash: keyHash || null,
    });
    const sourceFund = sourceFunds?.[0];

    if (fundError || !sourceFund) {
      throw new Error("Akun sumber dana tidak ditemukan atau Anda tidak memiliki akses.");
    }

    if (sourceFund.balance < amountInCents + feeInCents) {
      const available = sourceFund.balance / 100;
      const required = (amountInCents + feeInCents) / 100;
      throw new Error(
        `Saldo akun '${sourceFund.name}' tidak mencukupi. Tersedia: Rp${available.toLocaleString("id-ID")}, Dibutuhkan: Rp${required.toLocaleString("id-ID")}`
      );
    }
  }

  // Call Supabase RPC for atomic balance update
  const { data: newTx, error } = await supabase
    .rpc("create_transaction_and_update_balance", {
      p_description: input.description,
      p_amount: amountInCents,
      p_type: input.type,
      p_transaction_date: transactionDate,
      p_user_id: userId,
      p_category_id: input.categoryId || null,
      p_source_fund_id: input.sourceFundId || null,
      p_destination_fund_id: input.destinationFundId || null,
      p_fee: feeInCents || null,
    })
    .select()
    .single();

  if (error || !newTx) {
    throw new Error(`Gagal mencatat transaksi via RPC: ${error?.message || "Tidak ada data yang dikembalikan"}`);
  }

  const tx = newTx as any;
  return {
    id: tx.id,
    description: tx.description,
    amount: tx.amount / 100,
    type: tx.type,
    transactionDate: tx.transaction_date,
    createdAt: tx.created_at,
    userId: tx.user_id,
    categoryId: tx.category_id,
    sourceFundId: tx.source_fund_id,
    destinationFundId: tx.destination_fund_id,
    notes: tx.notes,
    status: tx.status,
  };
}

export async function updateTransaction(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateTransactionInput,
  keyHash?: string
): Promise<void> {
  // Fetch existing transaction using secure RPC
  const { data: currentTxs, error: fetchError } = await supabase.rpc("mcp_get_transaction", {
    p_id: input.id,
    p_user_id: userId,
    p_key_hash: keyHash || null,
  });
  const currentTx = currentTxs?.[0];

  if (fetchError || !currentTx) {
    throw new Error("Transaksi tidak ditemukan atau Anda tidak memiliki akses.");
  }

  const finalAmountInCents =
    input.amount !== undefined ? Math.round(input.amount * 100) : currentTx.amount;
  const finalFeeInCents =
    input.fee !== undefined ? Math.round(input.fee * 100) : (currentTx.fee || 0);
  const finalType = input.type || currentTx.type;
  const finalDate = input.transactionDate || currentTx.transaction_date;
  const finalCategoryId =
    input.categoryId !== undefined ? input.categoryId : currentTx.category_id;
  const finalSourceFundId =
    input.sourceFundId !== undefined ? input.sourceFundId : currentTx.source_fund_id;
  const finalDestFundId =
    input.destinationFundId !== undefined ? input.destinationFundId : currentTx.destination_fund_id;

  // Call Supabase RPC for updating transaction and reconciling balances
  const { error } = await supabase.rpc("update_transaction_and_update_balance", {
    p_id: input.id,
    p_description: input.description ?? currentTx.description,
    p_amount: finalAmountInCents,
    p_type: finalType,
    p_transaction_date: finalDate,
    p_category_id: finalCategoryId || null,
    p_source_fund_id: finalSourceFundId || null,
    p_destination_fund_id: finalDestFundId || null,
    p_fee: finalFeeInCents || null,
  });

  if (error) {
    throw new Error(`Gagal memperbarui transaksi via RPC: ${error.message}`);
  }
}
