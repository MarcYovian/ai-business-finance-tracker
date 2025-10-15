export type TransactionType = "income" | "expense" | "transfer";
export type FundType = "bank" | "cash" | "other";

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
  amount: number; // stored in cents
  type: TransactionType;
  transactionDate: string;
  createdAt: string;
  userId: string;
  categoryId?: string;
  sourceFundId?: string;
  destinationFundId?: string;
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
