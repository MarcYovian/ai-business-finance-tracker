import { Category, Transaction } from '@/types/finance';

export type BudgetHistoryTimeRange = '6m' | '12m' | 'year' | 'all';

export type BudgetMonthStatus = 'on_track' | 'near_limit' | 'over_budget' | 'no_budget';

export interface BudgetHistoryMonthItem {
  monthKey: string; // e.g. "2026-10"
  year: number;
  monthIndex: number; // 0-11
  monthLabel: string; // e.g. "October 2026"
  shortMonthLabel: string; // e.g. "Oct 2026"
  budgetId?: string;
  budgetAmount: number; // in cents
  spentAmount: number; // in cents
  remainingAmount: number; // in cents (can be negative if over budget)
  usagePercentage: number; // 0 - 100+
  status: BudgetMonthStatus;
}

export interface BudgetHistorySummary {
  averageBudget: number; // in cents
  averageSpent: number; // in cents
  averageUsagePercentage: number;
  bestMonth: {
    monthLabel: string;
    usagePercentage: number;
    budgetAmount: number;
    spentAmount: number;
  } | null;
  highestSpendingMonth: {
    monthLabel: string;
    usagePercentage: number;
    budgetAmount: number;
    spentAmount: number;
  } | null;
  onTrackMonthsCount: number;
  nearLimitMonthsCount: number;
  overBudgetMonthsCount: number;
  totalMonthsEvaluated: number;
}

export interface BudgetVsSpendingDataPoint {
  monthKey: string;
  label: string; // e.g. "Nov 2025"
  budgetAmount: number; // in whole Rupiah for chart Y-axis
  spentAmount: number; // in whole Rupiah for chart Y-axis
  averageSpending: number; // in whole Rupiah for reference line
  usagePercentage: number;
  isOverBudget: boolean;
}

export interface BudgetHistoryCategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  spentAmount: number; // in cents
  percentage: number;
}

export interface BudgetHistoryInsight {
  id: string;
  type: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
}

export interface BudgetHistoryAnalytics {
  summary: BudgetHistorySummary;
  monthlyHistory: BudgetHistoryMonthItem[];
  chartData: BudgetVsSpendingDataPoint[];
  categorySpending: BudgetHistoryCategorySpending[];
  insights: BudgetHistoryInsight[];
  timeRange: BudgetHistoryTimeRange;
  timeRangeLabel: string;
  totalSpentInPeriod: number; // in cents
  totalBudgetInPeriod: number; // in cents
}
