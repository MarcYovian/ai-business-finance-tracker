import { Transaction, TransactionType } from '@/types/finance';

export type TransactionTab = 'all' | 'income' | 'expense' | 'transfer';

export type SortField = 'date' | 'description' | 'category' | 'account' | 'amount';
export type SortOrder = 'asc' | 'desc';

export interface TransactionFilterState {
  search: string;
  datePreset: string; // 'current' | 'all' | 'custom' | 'this_month' | 'last_month' | string
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  types: TransactionType[];
  accountId: string; // 'all' or fundSource id
  categoryId: string; // 'all' or category id
  minAmount: string; // raw input or number string
  maxAmount: string; // raw input or number string
  status: string; // 'all' | 'completed' | 'pending' | 'failed'
}

export interface TransactionsAnalyticsSummary {
  totalIncome: number; // in cents
  totalExpense: number; // in cents
  totalTransfer: number; // in cents
  incomeMomPercent: number;
  expenseMomPercent: number;
  transferMomPercent: number;
  incomeSparkline: number[];
  expenseSparkline: number[];
  transferSparkline: number[];
  filteredCount: number;
}

export interface EnrichedTransaction extends Transaction {
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  sourceAccountName?: string;
  sourceAccountType?: string;
  destinationAccountName?: string;
  destinationAccountType?: string;
  accountDisplay: string;
  merchantName?: string;
  subtitle: string;
}
