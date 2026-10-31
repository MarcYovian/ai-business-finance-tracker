import { TransactionDTO } from "../transactions/transaction.types";
import { FundSourceDTO } from "../fund-sources/fund-source.types";
import { CategoryDTO } from "../categories/category.types";
import { BudgetDTO } from "../budgets/budget.types";
import {
  CategorySpendingSummary,
  BudgetAlert,
  FinancialHealthSnapshot,
} from "./insight.types";

export class ServerFinancialQueryEngine {
  constructor(
    private transactions: TransactionDTO[],
    private categories: CategoryDTO[],
    private fundSources: FundSourceDTO[],
    private budget?: BudgetDTO | null
  ) {}

  generateHealthSnapshot(): FinancialHealthSnapshot {
    // 1. Total Balance across all active accounts
    const totalBalance = this.fundSources
      .filter((f) => f.isActive)
      .reduce((sum, f) => sum + f.balance, 0);

    // 2. Filter transactions for the current/selected month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlyTransactions = this.transactions.filter((t) => {
      const d = new Date(t.transactionDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashflow = monthlyIncome - monthlyExpense;
    const savingsRatePercentage =
      monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;

    // 3. Category Spending Breakdown
    const categoryMap = new Map<string, string>();
    this.categories.forEach((c) => categoryMap.set(c.id, c.name));

    const spendingByCategory: Record<string, { total: number; count: number }> = {};
    monthlyTransactions
      .filter((t) => t.type === "expense" && t.categoryId)
      .forEach((t) => {
        const catId = t.categoryId!;
        if (!spendingByCategory[catId]) {
          spendingByCategory[catId] = { total: 0, count: 0 };
        }
        spendingByCategory[catId].total += t.amount;
        spendingByCategory[catId].count += 1;
      });

    const topExpenseCategories: CategorySpendingSummary[] = Object.entries(spendingByCategory)
      .map(([catId, data]) => ({
        categoryId: catId,
        categoryName: categoryMap.get(catId) || "Lain-lain",
        totalSpent: data.total,
        transactionCount: data.count,
        percentageOfExpense:
          monthlyExpense > 0 ? Math.round((data.total / monthlyExpense) * 100) : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // 4. Budget Alerts
    const budgetAlerts: BudgetAlert[] = [];
    if (this.budget?.items) {
      this.budget.items.forEach((item) => {
        const planned = item.plannedAmount;
        const spent = item.spentAmount;
        const util = item.utilizationPercentage;

        let status: BudgetAlert["status"] = "safe";
        if (util >= 100) status = "over";
        else if (util >= 85) status = "danger";
        else if (util >= 70) status = "warning";

        budgetAlerts.push({
          categoryId: item.categoryId,
          categoryName: item.categoryName || categoryMap.get(item.categoryId) || "Kategori",
          plannedAmount: planned,
          spentAmount: spent,
          utilizationPercentage: util,
          status,
        });
      });
    }

    // 5. Rule-Based Recommendations
    const recommendations: string[] = [];

    if (netCashflow < 0) {
      recommendations.push(
        `Arus kas bulanan defisit sebesar Rp${Math.abs(netCashflow).toLocaleString("id-ID")}. Kurangi pengeluaran non-primer.`
      );
    } else {
      recommendations.push(
        `Arus kas bulanan positif sebesar Rp${netCashflow.toLocaleString("id-ID")}. Pertahankan rasio tabungan ${savingsRatePercentage}%.`
      );
    }

    const overBudgets = budgetAlerts.filter((a) => a.status === "over");
    if (overBudgets.length > 0) {
      recommendations.push(
        `Ada ${overBudgets.length} kategori yang melebihi batas anggaran (${overBudgets.map((o) => o.categoryName).join(", ")}).`
      );
    }

    if (topExpenseCategories.length > 0) {
      const top = topExpenseCategories[0];
      recommendations.push(
        `Pengeluaran terbesar bulan ini berada pada kategori '${top.categoryName}' (${top.percentageOfExpense}% dari total pengeluaran).`
      );
    }

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netCashflow,
      savingsRatePercentage,
      topExpenseCategories,
      budgetAlerts,
      recommendations,
    };
  }
}
