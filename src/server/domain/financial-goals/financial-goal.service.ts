import { AuthContext } from "@/server/auth/types";
import {
  IFinancialGoalService,
  FinancialGoalDTO,
  UpsertFinancialGoalDTO,
} from "./financial-goal.types";
import { upsertFinancialGoalSchema } from "./financial-goal.schema";
import { NotFoundError, DatabaseOperationError } from "@/server/errors/domain-error";

export class FinancialGoalDomainService implements IFinancialGoalService {
  constructor(private ctx: AuthContext) {}

  /**
   * Lists all financial goals for authenticated user
   */
  async list(): Promise<FinancialGoalDTO[]> {
    const { data, error } = await this.ctx.supabase
      .from("financial_goals")
      .select("*")
      .eq("user_id", this.ctx.userId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      throw new DatabaseOperationError("list financial goals", error.message);
    }

    return (data || []).map((g: any) => ({
      id: g.id,
      user_id: g.user_id,
      userId: g.user_id,
      name: g.name,
      description: g.description,
      target_amount: (g.target_amount || 0) / 100, // Cents to Rupiah
      targetAmount: (g.target_amount || 0) / 100,
      current_amount: (g.current_amount || 0) / 100,
      currentAmount: (g.current_amount || 0) / 100,
      category: g.category,
      target_date: g.target_date,
      targetDate: g.target_date,
      status: g.status,
      priority: g.priority ?? 0,
      created_at: g.created_at,
      createdAt: g.created_at,
      updated_at: g.updated_at,
      updatedAt: g.updated_at,
    }));
  }

  /**
   * Retrieves single financial goal by ID
   */
  async getById(id: string): Promise<FinancialGoalDTO> {
    const { data, error } = await this.ctx.supabase
      .from("financial_goals")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.ctx.userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Target finansial (Financial Goal)", id);
    }

    return {
      id: data.id,
      user_id: data.user_id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      target_amount: (data.target_amount || 0) / 100,
      targetAmount: (data.target_amount || 0) / 100,
      current_amount: (data.current_amount || 0) / 100,
      currentAmount: (data.current_amount || 0) / 100,
      category: data.category,
      target_date: data.target_date,
      targetDate: data.target_date,
      status: data.status,
      priority: data.priority ?? 0,
      created_at: data.created_at,
      createdAt: data.created_at,
      updated_at: data.updated_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Upserts a financial goal
   */
  async upsert(payload: UpsertFinancialGoalDTO): Promise<FinancialGoalDTO> {
    const validated = upsertFinancialGoalSchema.parse(payload);

    const dbPayload: any = {
      user_id: this.ctx.userId,
      name: validated.name,
      description: validated.description,
      target_amount: Math.round(validated.targetAmount * 100),
      current_amount: Math.round(validated.currentAmount * 100),
      category: validated.category,
      target_date: validated.targetDate,
      status: validated.status,
      priority: validated.priority,
      updated_at: new Date().toISOString(),
    };

    if (validated.id) {
      dbPayload.id = validated.id;
    }

    const { data, error } = await this.ctx.supabase
      .from("financial_goals")
      .upsert([dbPayload])
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseOperationError("upsert financial goal", error?.message || "Gagal menyimpan target finansial");
    }

    return {
      id: data.id,
      user_id: data.user_id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      target_amount: (data.target_amount || 0) / 100,
      targetAmount: (data.target_amount || 0) / 100,
      current_amount: (data.current_amount || 0) / 100,
      currentAmount: (data.current_amount || 0) / 100,
      category: data.category,
      target_date: data.target_date,
      targetDate: data.target_date,
      status: data.status,
      priority: data.priority ?? 0,
      created_at: data.created_at,
      createdAt: data.created_at,
      updated_at: data.updated_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Deletes a financial goal by ID
   */
  async delete(id: string): Promise<void> {
    await this.getById(id);

    const { error } = await this.ctx.supabase
      .from("financial_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", this.ctx.userId);

    if (error) {
      throw new DatabaseOperationError("delete financial goal", error.message);
    }
  }
}
