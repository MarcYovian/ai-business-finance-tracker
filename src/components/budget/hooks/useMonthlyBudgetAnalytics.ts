import { useMemo } from 'react';
import { Budget, BudgetDetail, Category, Transaction } from '@/types/finance';
import {
  MonthlyBudgetAnalytics,
  MonthlyBudgetSummary,
  DailySpendingTrendPoint,
  BudgetCategoryRow,
  CategoryDistributionItem,
  TopSpendingCategoryItem,
  BudgetRecentTransactionItem,
} from '../types';
import { BUDGET_PALETTE } from '../constants';

interface UseMonthlyBudgetAnalyticsParams {
  currentMonth: Date;
  currentBudget: Budget | null | undefined;
  budgetDetails: BudgetDetail[];
  transactions: Transaction[];
  categories: Category[];
}

export const useMonthlyBudgetAnalytics = ({
  currentMonth,
  currentBudget,
  budgetDetails = [],
  transactions = [],
  categories = [],
}: UseMonthlyBudgetAnalyticsParams): MonthlyBudgetAnalytics => {
  return useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-11
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map categories for quick lookup
    const categoryMap = new Map<string, Category>();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, cat);
    });

    // Map budget items from DB
    const budgetMap = new Map<string, BudgetDetail>();
    budgetDetails.forEach((b) => {
      budgetMap.set(b.category_id, b);
    });

    // 1. Filter expense transactions for this specific month
    const monthExpenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const tDate = new Date(t.transactionDate);
      if (isNaN(tDate.getTime())) return false;
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    // Calculate total spent from actual transactions (in cents)
    const totalSpentFromTx = monthExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Group actual spending by direct category ID
    const directSpendingMap = new Map<string, number>();
    monthExpenses.forEach((t) => {
      if (!t.categoryId) return;
      const current = directSpendingMap.get(t.categoryId) || 0;
      directSpendingMap.set(t.categoryId, current + (t.amount || 0));
    });

    // 2. Build Category Hierarchy (Parent & Child Rows)
    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const parentCategories = expenseCategories.filter((c) => !c.parentId);

    const categoryRows: BudgetCategoryRow[] = [];

    parentCategories.forEach((parent, index) => {
      // Find subcategories belonging to this parent
      const childCategories = expenseCategories.filter((c) => c.parentId === parent.id);

      // Build child rows
      const childRows: BudgetCategoryRow[] = childCategories.map((child, cIdx) => {
        const childBudgetDetail = budgetMap.get(child.id);
        const childPlanned = childBudgetDetail?.amount || 0;
        const childSpent = directSpendingMap.get(child.id) || 0;
        const childRemaining = childPlanned - childSpent;
        const childProgress = childPlanned > 0
          ? Math.round((childSpent / childPlanned) * 100)
          : childSpent > 0 ? 100 : 0;
        const childStatus = childProgress > 95 ? 'danger' : childProgress > 80 ? 'warning' : 'normal';

        return {
          id: childBudgetDetail?.id || `child-${child.id}`,
          categoryId: child.id,
          categoryName: child.name,
          categoryIcon: child.icon || parent.icon || 'tag',
          categoryColor: child.color || parent.color || BUDGET_PALETTE[index % BUDGET_PALETTE.length],
          parentId: parent.id,
          budgetAmount: childPlanned,
          spent: childSpent,
          remaining: childRemaining,
          progress: childProgress,
          status: childStatus,
        };
      });

      // Direct spending & budget on parent
      const parentBudgetDetail = budgetMap.get(parent.id);
      const parentDirectPlanned = parentBudgetDetail?.amount || 0;
      const childrenPlannedSum = childRows.reduce((sum, c) => sum + c.budgetAmount, 0);

      // Effective parent budget: allows budgeting on parent, child, or both!
      const effectiveParentBudget = Math.max(parentDirectPlanned, childrenPlannedSum);

      const parentDirectSpent = directSpendingMap.get(parent.id) || 0;
      const childrenSpentSum = childRows.reduce((sum, c) => sum + c.spent, 0);
      const totalParentSpent = parentDirectSpent + childrenSpentSum;

      const parentRemaining = effectiveParentBudget - totalParentSpent;
      const parentProgress = effectiveParentBudget > 0
        ? Math.round((totalParentSpent / effectiveParentBudget) * 100)
        : totalParentSpent > 0 ? 100 : 0;
      const parentStatus = parentProgress > 95 ? 'danger' : parentProgress > 80 ? 'warning' : 'normal';

      categoryRows.push({
        id: parentBudgetDetail?.id || `parent-${parent.id}`,
        categoryId: parent.id,
        categoryName: parent.name,
        categoryIcon: parent.icon || 'tag',
        categoryColor: parent.color || BUDGET_PALETTE[index % BUDGET_PALETTE.length],
        parentId: null,
        budgetAmount: effectiveParentBudget,
        spent: totalParentSpent,
        remaining: parentRemaining,
        progress: parentProgress,
        status: parentStatus,
        children: childRows,
        hasChildren: childRows.length > 0,
        assignedToChildren: childrenPlannedSum,
        unallocatedBudget: Math.max(0, effectiveParentBudget - childrenPlannedSum),
      });
    });

    // 3. Totals
    // Sum of parent budgets guarantees NO double counting of parent + children!
    const totalBudget = categoryRows.reduce((sum, row) => sum + row.budgetAmount, 0);
    const totalSpent = totalSpentFromTx > 0 ? totalSpentFromTx : categoryRows.reduce((sum, row) => sum + row.spent, 0);
    const remaining = totalBudget - totalSpent;
    const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const remainingPercentage = totalBudget > 0 ? Math.max(0, 100 - spentPercentage) : 0;

    // Daily Average & Daily Target (in cents)
    const dailyAverageSpent = Math.round(totalSpent / daysInMonth);
    const dailyTarget = totalBudget > 0 ? Math.round(totalBudget / daysInMonth) : 0;

    const summary: MonthlyBudgetSummary = {
      totalBudget,
      totalSpent,
      remaining,
      spentPercentage,
      remainingPercentage,
      dailyAverageSpent,
      dailyTarget,
      daysInMonth,
      elapsedDays: daysInMonth,
    };

    // 4. Daily Spending Trend (Widget 5: Spending vs Budget)
    const dailySpendingMap = new Map<number, number>();
    monthExpenses.forEach((t) => {
      const tDate = new Date(t.transactionDate);
      const day = tDate.getDate();
      dailySpendingMap.set(day, (dailySpendingMap.get(day) || 0) + (t.amount || 0));
    });

    const monthShortName = currentMonth.toLocaleString('en-US', { month: 'short' });
    const trend: DailySpendingTrendPoint[] = [];
    let runningCumulative = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const daySpentCents = dailySpendingMap.get(day) || 0;
      const daySpentRupiah = Math.round(daySpentCents / 100);
      runningCumulative += daySpentRupiah;

      // Daily average target (flat limit line per day, e.g. 333.333)
      const dailyBudgetPlanRupiah = totalBudget > 0
        ? Math.round(totalBudget / 100 / daysInMonth)
        : 0;

      // Linear budget plan target curve pacing up to total budget
      const budgetPlanRupiah = totalBudget > 0
        ? Math.round((totalBudget / 100 / daysInMonth) * day)
        : 0;

      trend.push({
        day,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        label: `${day} ${monthShortName}`,
        spent: daySpentRupiah,
        dailyBudgetPlan: dailyBudgetPlanRupiah,
        budgetPlan: budgetPlanRupiah,
        cumulativeSpent: runningCumulative,
      });
    }

    // 5. Budget Distribution (Widget 7: Donut Chart)
    const distribution: CategoryDistributionItem[] = [];
    const totalSpentForDistribution = totalSpent > 0 ? totalSpent : 1;

    // Sort categoryRows (parents) by spent descending
    const sortedBySpent = [...categoryRows]
      .filter((r) => r.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    sortedBySpent.forEach((row, idx) => {
      const percentage = Math.round((row.spent / totalSpentForDistribution) * 100);
      distribution.push({
        name: row.categoryName,
        categoryId: row.categoryId,
        amount: row.spent,
        percentage,
        color: row.categoryColor || BUDGET_PALETTE[idx % BUDGET_PALETTE.length],
      });
    });

    // 6. Top Spending Categories (Widget 8: Top 5 Ranked)
    const topSpending: TopSpendingCategoryItem[] = [];
    const maxCategorySpent = sortedBySpent.length > 0 ? sortedBySpent[0].spent : 1;

    sortedBySpent.slice(0, 5).forEach((row, idx) => {
      topSpending.push({
        rank: idx + 1,
        categoryId: row.categoryId,
        name: row.categoryName,
        icon: row.categoryIcon,
        color: row.categoryColor,
        spent: row.spent,
        percentageOfMax: Math.round((row.spent / maxCategorySpent) * 100),
      });
    });

    // 7. Recent Transactions (Widget 9: 5 Latest)
    const sortedRecentTx = [...monthExpenses].sort((a, b) => {
      return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
    });

    const recentTransactions: BudgetRecentTransactionItem[] = sortedRecentTx.slice(0, 5).map((t) => {
      const cat = t.categoryId ? categoryMap.get(t.categoryId) : undefined;
      const tDate = new Date(t.transactionDate);
      const formattedDate = tDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      return {
        id: t.id,
        description: t.description || 'Expense',
        categoryName: cat?.name || 'Other',
        categoryIcon: cat?.icon || 'tag',
        categoryColor: cat?.color || '#94A3B8',
        date: t.transactionDate,
        formattedDate,
        amount: t.amount,
      };
    });

    return {
      summary,
      trend,
      categories: categoryRows,
      distribution,
      topSpending,
      recentTransactions,
      hasBudget: totalBudget > 0,
    };
  }, [currentMonth, currentBudget, budgetDetails, transactions, categories]);
};
