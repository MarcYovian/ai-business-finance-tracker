import { Category, Transaction } from '@/types/finance';

export type CategoryTypeFilter = 'all' | 'income' | 'expense';

export interface CategoryWithAnalytics extends Category {
  transactionCount: number;
  totalAmount: number; // in cents
  subcategories: CategoryWithAnalytics[];
}

export interface CategoryMonthlySpending {
  monthKey: string; // e.g. "2026-06"
  label: string; // e.g. "Jun"
  amount: number; // in cents
  transactionCount: number;
}

export interface CategoriesSummary {
  totalCategories: number;
  totalParents: number;
  totalSubcategories: number;
  incomeCategories: number;
  incomeParents: number;
  incomeSubcategories: number;
  expenseCategories: number;
  expenseParents: number;
  expenseSubcategories: number;
  unusedCategoriesCount: number;
  unusedCategoryIds: string[];
}

export interface SubcategoryMonthlyTrendItem {
  monthKey: string; // e.g. "2026-06"
  label: string; // e.g. "Jun"
  monthName: string; // e.g. "Juni 2026"
  total: number; // in cents
  totalCount: number;
  [key: string]: string | number;
}

export interface SelectedCategoryAnalytics {
  category: CategoryWithAnalytics | null;
  subcategories: CategoryWithAnalytics[];
  totalSpentThisMonth: number; // in cents
  spentLastMonth: number; // in cents
  percentageChange: number;
  transactionsThisMonthCount: number;
  totalTransactionsCount: number;
  monthlyTrend: CategoryMonthlySpending[];
  subcategoriesMonthlyTrend: SubcategoryMonthlyTrendItem[];
  recentTransactions: Transaction[];
}
