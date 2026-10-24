import { Budget, BudgetDetail, Category, Transaction } from '@/types/finance';

export interface MonthlyBudgetSummary {
  totalBudget: number; // in cents
  totalSpent: number; // in cents
  remaining: number; // in cents
  spentPercentage: number;
  remainingPercentage: number;
  dailyAverageSpent: number; // in cents
  dailyTarget: number; // in cents
  daysInMonth: number;
  elapsedDays: number;
}

export interface DailySpendingTrendPoint {
  day: number;
  date: string;
  label: string; // e.g. "1 Nov", "5 Nov"
  spent: number; // in whole rupiah for chart display (daily)
  dailyBudgetPlan: number; // in whole rupiah (daily budget limit, e.g. 333.333)
  budgetPlan: number; // in whole rupiah for chart display (cumulative linear pacing)
  cumulativeSpent: number; // in whole rupiah
}

export interface BudgetCategoryRow {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  parentId?: string | null;
  budgetAmount: number; // in cents
  spent: number; // in cents
  remaining: number; // in cents
  progress: number; // percentage (0-100+)
  status: 'normal' | 'warning' | 'danger';
  children?: BudgetCategoryRow[];
  hasChildren?: boolean;
  assignedToChildren?: number; // in cents
  unallocatedBudget?: number; // in cents
}

export interface CategoryDistributionItem {
  name: string;
  categoryId: string;
  amount: number; // in cents
  percentage: number;
  color: string;
}

export interface TopSpendingCategoryItem {
  rank: number;
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  spent: number; // in cents
  percentageOfMax: number;
}

export interface BudgetRecentTransactionItem {
  id: string;
  description: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  date: string;
  formattedDate: string;
  amount: number; // in cents
}

export interface MonthlyBudgetAnalytics {
  summary: MonthlyBudgetSummary;
  trend: DailySpendingTrendPoint[];
  categories: BudgetCategoryRow[];
  distribution: CategoryDistributionItem[];
  topSpending: TopSpendingCategoryItem[];
  recentTransactions: BudgetRecentTransactionItem[];
  hasBudget: boolean;
}
