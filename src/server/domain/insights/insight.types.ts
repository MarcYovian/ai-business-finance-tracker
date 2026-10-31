export interface CategorySpendingSummary {
  categoryId: string;
  categoryName: string;
  totalSpent: number; // Rupiah
  transactionCount: number;
  percentageOfExpense: number;
}

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  plannedAmount: number;
  spentAmount: number;
  utilizationPercentage: number;
  status: "safe" | "warning" | "danger" | "over";
}

export interface FinancialHealthSnapshot {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  savingsRatePercentage: number;
  topExpenseCategories: CategorySpendingSummary[];
  budgetAlerts: BudgetAlert[];
  recommendations: string[];
}

export interface FinancialAnalysisResponse {
  snapshot: FinancialHealthSnapshot;
  aiInsightsText?: string;
}
