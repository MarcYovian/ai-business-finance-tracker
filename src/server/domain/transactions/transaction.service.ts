import { AuthContext } from "@/server/auth/types";
import {
  ITransactionService,
  TransactionDTO,
  ListTransactionsFilter,
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from "./transaction.types";
import { createTransactionSchema, updateTransactionSchema } from "./transaction.schema";
import {
  NotFoundError,
  InsufficientFundsError,
  DatabaseOperationError,
} from "@/server/errors/domain-error";

export class TransactionDomainService implements ITransactionService {
  constructor(private ctx: AuthContext) {}

  /**
   * Lists transactions for authenticated user via Direct Supabase SDK
   */
  async list(filter: ListTransactionsFilter = {}): Promise<TransactionDTO[]> {
    let query = this.ctx.supabase
      .from("transactions")
      .select("*")
      .eq("user_id", this.ctx.userId)
      .order("transaction_date", { ascending: false });

    if (filter.type) {
      query = query.eq("type", filter.type);
    }
    if (filter.categoryId) {
      query = query.eq("category_id", filter.categoryId);
    }
    if (filter.sourceFundId) {
      query = query.eq("source_fund_id", filter.sourceFundId);
    }
    if (filter.destinationFundId) {
      query = query.eq("destination_fund_id", filter.destinationFundId);
    }
    if (filter.startDate) {
      query = query.gte("transaction_date", filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte("transaction_date", filter.endDate);
    }

    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      throw new DatabaseOperationError("list transactions", error.message);
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

  /**
   * Retrieves single transaction by ID
   */
  async getById(id: string): Promise<TransactionDTO> {
    const { data, error } = await this.ctx.supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.ctx.userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Transaksi", id);
    }

    return {
      id: data.id,
      description: data.description,
      amount: (data.amount || 0) / 100,
      type: data.type,
      transactionDate: data.transaction_date,
      createdAt: data.created_at,
      userId: data.user_id,
      categoryId: data.category_id,
      sourceFundId: data.source_fund_id,
      destinationFundId: data.destination_fund_id,
      notes: data.notes,
      status: data.status,
      parentTransactionId: data.parent_transaction_id,
    };
  }

  /**
   * Creates a transaction atomically via PostgreSQL RPC
   */
  async create(payload: CreateTransactionDTO): Promise<TransactionDTO> {
    const validated = createTransactionSchema.parse(payload);
    const amountInCents = Math.round(validated.amount * 100);
    const feeInCents = validated.fee ? Math.round(validated.fee * 100) : 0;
    const txDate = validated.transactionDate || new Date().toISOString();

    // Balance pre-validation for expense or transfer
    if ((validated.type === "expense" || validated.type === "transfer") && validated.sourceFundId) {
      const { data: sourceFund, error: fundErr } = await this.ctx.supabase
        .from("fund_sources")
        .select("name, balance")
        .eq("id", validated.sourceFundId)
        .eq("user_id", this.ctx.userId)
        .single();

      if (fundErr || !sourceFund) {
        throw new NotFoundError("Akun sumber dana", validated.sourceFundId);
      }

      if (sourceFund.balance < amountInCents + feeInCents) {
        const availableRp = sourceFund.balance / 100;
        const requiredRp = (amountInCents + feeInCents) / 100;
        throw new InsufficientFundsError(sourceFund.name, availableRp, requiredRp);
      }
    }

    // Call atomic PostgreSQL RPC function
    const { data: newTx, error } = await this.ctx.supabase
      .rpc("create_transaction_and_update_balance", {
        p_description: validated.description,
        p_amount: amountInCents,
        p_type: validated.type,
        p_transaction_date: txDate,
        p_user_id: this.ctx.userId,
        p_category_id: validated.categoryId || null,
        p_source_fund_id: validated.sourceFundId || null,
        p_destination_fund_id: validated.destinationFundId || null,
        p_fee: feeInCents || null,
      })
      .select()
      .single();

    if (error || !newTx) {
      throw new DatabaseOperationError(
        "create_transaction_and_update_balance",
        error?.message || "Tidak ada data yang dikembalikan oleh RPC"
      );
    }

    return {
      id: newTx.id,
      description: newTx.description,
      amount: newTx.amount / 100,
      type: newTx.type,
      transactionDate: newTx.transaction_date,
      createdAt: newTx.created_at,
      userId: newTx.user_id,
      categoryId: newTx.category_id,
      sourceFundId: newTx.source_fund_id,
      destinationFundId: newTx.destination_fund_id,
      notes: newTx.notes,
      status: newTx.status,
    };
  }

  /**
   * Updates an existing transaction atomically via PostgreSQL RPC
   */
  async update(payload: UpdateTransactionDTO): Promise<TransactionDTO> {
    const validated = updateTransactionSchema.parse(payload);
    const existing = await this.getById(validated.id);

    const amountInCents =
      validated.amount !== undefined ? Math.round(validated.amount * 100) : Math.round(existing.amount * 100);
    const feeInCents =
      validated.fee !== undefined ? Math.round(validated.fee * 100) : (existing.fee ? Math.round(existing.fee * 100) : 0);

    const { error } = await this.ctx.supabase.rpc("update_transaction_and_update_balance", {
      p_id: validated.id,
      p_description: validated.description ?? existing.description,
      p_amount: amountInCents,
      p_type: validated.type ?? existing.type,
      p_transaction_date: validated.transactionDate ?? existing.transactionDate,
      p_category_id: validated.categoryId !== undefined ? validated.categoryId : (existing.categoryId || null),
      p_source_fund_id: validated.sourceFundId !== undefined ? validated.sourceFundId : (existing.sourceFundId || null),
      p_destination_fund_id: validated.destinationFundId !== undefined ? validated.destinationFundId : (existing.destinationFundId || null),
      p_fee: feeInCents || null,
    });

    if (error) {
      throw new DatabaseOperationError("update_transaction_and_update_balance", error.message);
    }

    return this.getById(validated.id);
  }

  /**
   * Deletes a transaction atomically and reverts fund balances via PostgreSQL RPC
   */
  async delete(id: string): Promise<void> {
    // Check existence first
    await this.getById(id);

    const { error } = await this.ctx.supabase.rpc("delete_transaction_and_revert_balance", {
      p_transaction_id: id,
    });

    if (error) {
      throw new DatabaseOperationError("delete_transaction_and_revert_balance", error.message);
    }
  }
}
