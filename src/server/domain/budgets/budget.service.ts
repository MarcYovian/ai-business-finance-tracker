import { AuthContext } from "@/server/auth/types";
import {
  IBudgetService,
  BudgetDTO,
  BudgetItemDTO,
  UpsertBudgetDTO,
  PreviousBudgetDTO,
} from "./budget.types";
import { upsertBudgetSchema } from "./budget.schema";
import { DatabaseOperationError } from "@/server/errors/domain-error";

export class BudgetDomainService implements IBudgetService {
  constructor(private ctx: AuthContext) {}

  /**
   * Retrieves or initializes monthly budget and aggregates item details via PostgreSQL RPCs
   */
  async getOrCreateForMonth(dateInput?: Date | string): Promise<BudgetDTO> {
    const d = dateInput instanceof Date ? dateInput : (dateInput ? new Date(dateInput) : new Date());
    const startDateStr = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1))
      .toISOString()
      .split("T")[0];

    // 1. Call RPC get_or_create_budget_for_month
    const { data: budgetDataRaw, error: bErr } = await this.ctx.supabase
      .rpc("get_or_create_budget_for_month", {
        p_user_id: this.ctx.userId,
        p_month_date: startDateStr,
      })
      .single();

    if (bErr || !budgetDataRaw) {
      throw new DatabaseOperationError("get_or_create_budget_for_month", bErr?.message || "Gagal membuat budget");
    }

    const budgetData = budgetDataRaw as any;

    // 2. Fetch items with category spending breakdown
    const items = await this.getDetails(budgetData.id);

    const totalPlanned = items.reduce((sum, item) => sum + item.plannedAmount, 0);
    const totalSpent = items.reduce((sum, item) => sum + item.spentAmount, 0);
    const totalRemaining = totalPlanned - totalSpent;

    return {
      id: budgetData.id,
      userId: budgetData.user_id,
      name: budgetData.name,
      startDate: budgetData.start_date,
      endDate: budgetData.end_date,
      totalPlanned,
      totalSpent,
      totalRemaining,
      items,
      createdAt: budgetData.created_at,
    };
  }

  /**
   * Retrieves raw budget details from RPC get_budget_details
   */
  async getRawBudgetDetails(budgetId: string): Promise<any[]> {
    if (!budgetId) return [];
    const { data, error } = await this.ctx.supabase.rpc("get_budget_details", {
      p_budget_id: budgetId,
    });

    if (error) {
      throw new DatabaseOperationError("get_budget_details", error.message);
    }

    return data || [];
  }

  /**
   * Retrieves budget details breakdown via PostgreSQL RPC get_budget_details and formats to DTO
   */
  async getDetails(budgetId: string): Promise<BudgetItemDTO[]> {
    const data = await this.getRawBudgetDetails(budgetId);

    return (data || []).map((row: any) => {
      const plannedAmount = (row.amount || 0) / 100; // Cents to Rupiah
      const spentAmount = (row.spent || 0) / 100; // Cents to Rupiah
      const remainingAmount = plannedAmount - spentAmount;
      const utilizationPercentage = plannedAmount > 0
        ? Math.round((spentAmount / plannedAmount) * 100)
        : 0;

      return {
        id: row.id,
        categoryId: row.category_id,
        categoryName: row.category_name,
        plannedAmount,
        spentAmount,
        remainingAmount,
        utilizationPercentage,
      };
    });
  }

  /**
   * Atomically upserts budget header and item breakdown via PostgreSQL RPC upsert_budget_with_items
   */
  async upsert(payload: UpsertBudgetDTO): Promise<BudgetDTO> {
    const validated = upsertBudgetSchema.parse(payload);

    // Convert items amounts from Rupiah to Cents
    const itemsInCents = validated.items.map((item) => ({
      category_id: item.categoryId,
      amount: Math.round(item.amount * 100),
    }));

    const { error } = await this.ctx.supabase.rpc("upsert_budget_with_items", {
      p_user_id: this.ctx.userId,
      p_start_date: validated.startDate,
      p_end_date: validated.endDate,
      p_name: validated.name,
      p_items: itemsInCents,
    });

    if (error) {
      throw new DatabaseOperationError("upsert_budget_with_items", error.message);
    }

    return this.getOrCreateForMonth(validated.startDate);
  }

  /**
   * Fetches historical budgets for user
   */
  async getHistory(limit = 12): Promise<BudgetDTO[]> {
    const { data: budgets, error } = await this.ctx.supabase
      .from("budgets")
      .select("*")
      .eq("user_id", this.ctx.userId)
      .order("start_date", { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseOperationError("list budget history", error.message);
    }

    const results: BudgetDTO[] = [];
    for (const b of budgets || []) {
      const items = await this.getDetails(b.id);
      const totalPlanned = items.reduce((sum, item) => sum + item.plannedAmount, 0);
      const totalSpent = items.reduce((sum, item) => sum + item.spentAmount, 0);

      results.push({
        id: b.id,
        userId: b.user_id,
        name: b.name,
        startDate: b.start_date,
        endDate: b.end_date,
        totalPlanned,
        totalSpent,
        totalRemaining: totalPlanned - totalSpent,
        items,
        createdAt: b.created_at,
      });
    }

    return results;
  }

  /**
   * Retrieves all budgets with their joined budget items
   */
  async getBudgetsWithItems(): Promise<any[]> {
    try {
      const { data, error } = await this.ctx.supabase
        .from("budgets")
        .select(`
          id,
          user_id,
          name,
          start_date,
          end_date,
          total_limit,
          is_active,
          created_at,
          budget_items (
            id,
            planned_amount
          )
        `)
        .eq("user_id", this.ctx.userId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      const { data, error } = await this.ctx.supabase
        .from("budgets")
        .select("id, user_id, name, start_date, end_date, total_limit, is_active, created_at")
        .eq("user_id", this.ctx.userId)
        .order("start_date", { ascending: false });
      if (error) throw new DatabaseOperationError("list budgets with items", error.message);
      return (data || []).map((b: any) => ({ ...b, budget_items: [] }));
    }
  }

  /**
   * Retrieves previous budget with items for copying over to current month
   */
  async getPreviousBudgetWithItems(monthInput?: string | Date): Promise<PreviousBudgetDTO | null> {
    const currentMonth = monthInput instanceof Date ? monthInput : (monthInput ? new Date(monthInput) : new Date());
    const currentStart = new Date(
      Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    )
      .toISOString()
      .split("T")[0];

    const { data: pastBudgets, error: bErr } = await this.ctx.supabase
      .from("budgets")
      .select("id, name, start_date")
      .eq("user_id", this.ctx.userId)
      .lt("start_date", currentStart)
      .order("start_date", { ascending: false })
      .limit(10);

    if (bErr || !pastBudgets || pastBudgets.length === 0) return null;

    const budgetIds = pastBudgets.map((b: any) => b.id);
    const { data: allItems, error: iErr } = await this.ctx.supabase
      .from("budget_items")
      .select("budget_id, category_id, planned_amount")
      .in("budget_id", budgetIds)
      .gt("planned_amount", 0);

    if (iErr || !allItems || allItems.length === 0) return null;

    for (const b of pastBudgets) {
      const itemsForBudget = allItems.filter((i: any) => i.budget_id === b.id);
      if (itemsForBudget.length > 0) {
        const d = new Date(b.start_date);
        const monthLabel = !isNaN(d.getTime())
          ? d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : b.name;

        return {
          budgetId: b.id,
          name: b.name,
          startDate: b.start_date,
          monthLabel,
          items: itemsForBudget.map((i: any) => ({
            category_id: i.category_id,
            amount: Math.round(i.planned_amount / 100),
          })),
        };
      }
    }

    return null;
  }
}
