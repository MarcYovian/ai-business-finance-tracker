export type FinancialGoalCategory = "savings" | "investment" | "debt_payoff" | "other";
export type FinancialGoalStatus = "active" | "completed" | "cancelled";

export interface FinancialGoalDTO {
  id: string;
  user_id: string;
  userId: string;
  name: string;
  description?: string | null;
  target_amount: number; // Rupiah
  targetAmount: number; // Rupiah
  current_amount: number; // Rupiah
  currentAmount: number; // Rupiah
  category: FinancialGoalCategory;
  target_date: string;
  targetDate: string;
  status: FinancialGoalStatus;
  priority: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface UpsertFinancialGoalDTO {
  id?: string;
  name: string;
  description?: string | null;
  targetAmount?: number;
  target_amount?: number;
  currentAmount?: number;
  current_amount?: number;
  category?: FinancialGoalCategory;
  targetDate?: string;
  target_date?: string;
  status?: FinancialGoalStatus;
  priority?: number;
}

export interface IFinancialGoalService {
  list(): Promise<FinancialGoalDTO[]>;
  getById(id: string): Promise<FinancialGoalDTO>;
  upsert(payload: UpsertFinancialGoalDTO): Promise<FinancialGoalDTO>;
  delete(id: string): Promise<void>;
}
