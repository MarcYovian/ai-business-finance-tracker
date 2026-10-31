export interface BudgetItemDTO {
  id?: string;
  categoryId: string;
  categoryName?: string;
  plannedAmount: number; // Rupiah murni
  spentAmount: number; // Rupiah murni
  remainingAmount: number; // Rupiah murni
  utilizationPercentage: number; // 0 - 100+
}

export interface BudgetDTO {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  totalPlanned: number; // Rupiah murni
  totalSpent: number; // Rupiah murni
  totalRemaining: number; // Rupiah murni
  items: BudgetItemDTO[];
  createdAt?: string;
}

export interface UpsertBudgetDTO {
  startDate: string; // ISO date 'YYYY-MM-DD'
  endDate: string; // ISO date 'YYYY-MM-DD'
  name: string;
  items: {
    categoryId: string;
    amount: number; // Rupiah murni
  }[];
}

export interface IBudgetService {
  getOrCreateForMonth(date?: Date | string): Promise<BudgetDTO>;
  getDetails(budgetId: string): Promise<BudgetItemDTO[]>;
  upsert(payload: UpsertBudgetDTO): Promise<BudgetDTO>;
  getHistory(limit?: number): Promise<BudgetDTO[]>;
}
