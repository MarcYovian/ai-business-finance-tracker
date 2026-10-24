export type TransactionType = "income" | "expense" | "transfer";
export type FundType = "bank" | "cash" | "credit_card" | "wallet" | "other";

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  defaultCurrency: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  dateFormat: string;
  timeZone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  id: string;
  userId: string;
  theme: AppTheme;
  defaultLandingPage: string;
  itemsPerPage: number;
  showAccountBalance: boolean;
  showCategoryIcons: boolean;
  compactMode: boolean;
  emailNotifications: boolean;
  budgetAlerts: boolean;
  recurringReminders: boolean;
  lowBalanceAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  type: "income" | "expense";
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
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

export type TransactionStatus = 'completed' | 'pending' | 'failed';

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
  notes?: string | null;
  status?: TransactionStatus;
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
