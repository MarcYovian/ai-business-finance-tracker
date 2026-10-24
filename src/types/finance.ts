export type TransactionType = "income" | "expense" | "transfer";
export type FundType = "bank" | "cash" | "credit_card" | "wallet" | "other";

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  type: "income" | "expense";
  parentId?: string | null;
}

export interface FundSource {
  id: string;
  user_id: string;
  name: string;
  type: FundType;
  balance: number;
  created_at: string;
  account_number?: string | null;
  account_holder_name?: string | null;
  card_expiry?: string | null;
  color_theme?: string | null;
  is_active?: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  amount: number; // in cents
  created_at: string;
}

export interface BudgetDetail {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  amount: number; // in cents
  spent: number; // in cents
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  createdAt: string;
  userId: string;
  categoryId?: string;
  sourceFundId?: string;
  destinationFundId?: string;
  fee?: number;
  parentTransactionId?: string;
}

export interface Beneficiary {
  id: string;
  user_id: string;
  name: string;
  bank_name: string;
  account_number: string;
  account_type: 'bank' | 'ewallet';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type FinancialGoalCategory = 'savings' | 'investment' | 'debt_payoff' | 'other';
export type FinancialGoalStatus = 'active' | 'completed' | 'cancelled';

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  target_amount: number; // in whole Rupiah
  current_amount: number; // in whole Rupiah
  category: FinancialGoalCategory;
  target_date: string;
  status: FinancialGoalStatus;
  priority?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AIResponse {
  clarification_needed?: string;
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: string;
  category?: string;
  fundSource?: string;
  sourceFund?: string;
  destinationFund?: string;
}
