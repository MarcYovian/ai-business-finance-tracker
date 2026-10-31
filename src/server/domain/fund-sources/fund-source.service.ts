import { AuthContext } from "@/server/auth/types";
import {
  IFundSourceService,
  FundSourceDTO,
  CreateFundSourceDTO,
  UpdateFundSourceDTO,
  BalanceSummaryDTO,
  FundSourceType,
} from "./fund-source.types";
import { createFundSourceSchema, updateFundSourceSchema } from "./fund-source.schema";
import { NotFoundError, DatabaseOperationError, DomainError } from "@/server/errors/domain-error";

export class FundSourceDomainService implements IFundSourceService {
  constructor(private ctx: AuthContext) {}

  /**
   * Lists all fund sources for authenticated user via Direct Supabase SDK
   */
  async list(activeOnly = false): Promise<FundSourceDTO[]> {
    let query = this.ctx.supabase
      .from("fund_sources")
      .select("*")
      .eq("user_id", this.ctx.userId);

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    query = query.order("created_at", { ascending: true });

    const { data, error } = await query;
    if (error) {
      throw new DatabaseOperationError("list fund sources", error.message);
    }

    return (data || []).map((f: any) => ({
      id: f.id,
      userId: f.user_id,
      name: f.name,
      type: f.type,
      balance: (f.balance || 0) / 100, // Cents to Rupiah
      accountNumber: f.account_number,
      accountHolderName: f.account_holder_name,
      cardExpiry: f.card_expiry,
      colorTheme: f.color_theme,
      isActive: f.is_active ?? true,
      createdAt: f.created_at,
    }));
  }

  /**
   * Retrieves single fund source by ID
   */
  async getById(id: string): Promise<FundSourceDTO> {
    const { data, error } = await this.ctx.supabase
      .from("fund_sources")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.ctx.userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Akun sumber dana", id);
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      balance: (data.balance || 0) / 100,
      accountNumber: data.account_number,
      accountHolderName: data.account_holder_name,
      cardExpiry: data.card_expiry,
      colorTheme: data.color_theme,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    };
  }

  /**
   * Creates a new fund source with initial balance converted to cents
   */
  async create(payload: CreateFundSourceDTO): Promise<FundSourceDTO> {
    const validated = createFundSourceSchema.parse(payload);
    const balanceInCents = Math.round(validated.balance * 100);

    const { data, error } = await this.ctx.supabase
      .from("fund_sources")
      .insert([
        {
          user_id: this.ctx.userId,
          name: validated.name,
          type: validated.type,
          balance: balanceInCents,
          account_number: validated.accountNumber || null,
          account_holder_name: validated.accountHolderName || null,
          card_expiry: validated.cardExpiry || null,
          color_theme: validated.colorTheme || "lime",
          is_active: validated.isActive ?? true,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseOperationError("create fund source", error?.message || "Gagal membuat akun");
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      balance: data.balance / 100,
      accountNumber: data.account_number,
      accountHolderName: data.account_holder_name,
      cardExpiry: data.card_expiry,
      colorTheme: data.color_theme,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    };
  }

  /**
   * Updates fund source metadata
   */
  async update(id: string, payload: UpdateFundSourceDTO): Promise<FundSourceDTO> {
    const validated = updateFundSourceSchema.parse(payload);
    await this.getById(id);

    const updates: Record<string, any> = {};
    if (validated.name !== undefined) updates.name = validated.name;
    if (validated.type !== undefined) updates.type = validated.type;
    if (validated.accountNumber !== undefined) updates.account_number = validated.accountNumber;
    if (validated.accountHolderName !== undefined) updates.account_holder_name = validated.accountHolderName;
    if (validated.cardExpiry !== undefined) updates.card_expiry = validated.cardExpiry;
    if (validated.colorTheme !== undefined) updates.color_theme = validated.colorTheme;
    if (validated.isActive !== undefined) updates.is_active = validated.isActive;

    const { data, error } = await this.ctx.supabase
      .from("fund_sources")
      .update(updates)
      .eq("id", id)
      .eq("user_id", this.ctx.userId)
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseOperationError("update fund source", error?.message || "Gagal memperbarui akun");
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      balance: data.balance / 100,
      accountNumber: data.account_number,
      accountHolderName: data.account_holder_name,
      cardExpiry: data.card_expiry,
      colorTheme: data.color_theme,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    };
  }

  /**
   * Deletes a fund source (ensuring no existing transactions reference it)
   */
  async delete(id: string): Promise<void> {
    await this.getById(id);

    // Integrity check: prevent deletion if transactions exist
    const { count, error: countErr } = await this.ctx.supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .or(`source_fund_id.eq.${id},destination_fund_id.eq.${id}`);

    if (countErr) {
      throw new DatabaseOperationError("check fund source references", countErr.message);
    }

    if (count && count > 0) {
      throw new DomainError(
        `Akun tidak dapat dihapus karena masih terhubung dengan ${count} riwayat transaksi. Nonaktifkan akun sebagai alternatif.`,
        400,
        "ACCOUNT_HAS_TRANSACTIONS"
      );
    }

    const { error } = await this.ctx.supabase
      .from("fund_sources")
      .delete()
      .eq("id", id)
      .eq("user_id", this.ctx.userId);

    if (error) {
      throw new DatabaseOperationError("delete fund source", error.message);
    }
  }

  /**
   * Aggregates total balance and categorization summary across all accounts
   */
  async getBalanceSummary(): Promise<BalanceSummaryDTO> {
    const accounts = await this.list(true);

    const byType: Record<FundSourceType, number> = {
      bank: 0,
      cash: 0,
      "e-wallet": 0,
      credit_card: 0,
    };

    let totalBalance = 0;
    for (const acc of accounts) {
      totalBalance += acc.balance;
      if (byType[acc.type] !== undefined) {
        byType[acc.type] += acc.balance;
      }
    }

    return {
      totalBalance,
      accountCount: accounts.length,
      byType,
      accounts,
    };
  }
}
