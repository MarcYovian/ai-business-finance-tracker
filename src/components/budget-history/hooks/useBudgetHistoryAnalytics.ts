import { useMemo } from 'react';
import { Category, Transaction } from '@/types/finance';
import {
  BudgetHistoryAnalytics,
  BudgetHistoryCategorySpending,
  BudgetHistoryInsight,
  BudgetHistoryMonthItem,
  BudgetHistorySummary,
  BudgetHistoryTimeRange,
  BudgetVsSpendingDataPoint,
} from '../types';
import { BUDGET_PALETTE, TIME_RANGE_OPTIONS } from '../constants';

interface UseBudgetHistoryAnalyticsProps {
  budgets: any[];
  transactions: Transaction[];
  categories: Category[];
  timeRange?: BudgetHistoryTimeRange;
  referenceMonth?: Date; // Anchor month for "Last 12 months", etc.
}

export const useBudgetHistoryAnalytics = ({
  budgets = [],
  transactions = [],
  categories = [],
  timeRange = '12m',
  referenceMonth,
}: UseBudgetHistoryAnalyticsProps): BudgetHistoryAnalytics => {
  return useMemo(() => {
    // 1. Determine anchor date (defaults to current active month or referenceMonth)
    // If no referenceMonth provided, pick the latest budget date or current date
    const anchor = referenceMonth ? new Date(referenceMonth) : new Date();
    const anchorYear = anchor.getFullYear();
    const anchorMonth = anchor.getMonth(); // 0 - 11

    // Map categories for quick lookup
    const categoryMap = new Map<string, Category>();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, cat);
    });

    // 2. Generate target month windows based on timeRange
    // Each month window is { year, monthIndex, monthKey }
    const monthWindows: { year: number; monthIndex: number; monthKey: string }[] = [];

    let monthsCount = 12;
    if (timeRange === '6m') monthsCount = 6;
    else if (timeRange === '12m') monthsCount = 12;
    else if (timeRange === 'year') monthsCount = anchorMonth + 1; // From Jan of current anchor year up to current month

    if (timeRange === 'all') {
      // Find earliest date among budgets and transactions
      let earliestDate = new Date(anchorYear - 1, anchorMonth, 1);
      budgets.forEach((b) => {
        if (b.start_date) {
          const d = new Date(b.start_date);
          if (!isNaN(d.getTime()) && d < earliestDate) earliestDate = d;
        }
      });
      transactions.forEach((t) => {
        if (t.transactionDate) {
          const d = new Date(t.transactionDate);
          if (!isNaN(d.getTime()) && d < earliestDate) earliestDate = d;
        }
      });

      const totalMonthsDiff =
        (anchorYear - earliestDate.getFullYear()) * 12 +
        (anchorMonth - earliestDate.getMonth()) +
        1;
      const count = Math.min(Math.max(totalMonthsDiff, 1), 36); // max 3 years

      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(anchorYear, anchorMonth - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        monthWindows.push({ year: y, monthIndex: m, monthKey: key });
      }
    } else {
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(anchorYear, anchorMonth - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        monthWindows.push({ year: y, monthIndex: m, monthKey: key });
      }
    }

    // 3. Map budget records by monthKey ("YYYY-MM")
    const budgetsByMonth = new Map<string, any[]>();
    budgets.forEach((b) => {
      if (b.start_date) {
        const key = b.start_date.substring(0, 7);
        const list = budgetsByMonth.get(key) || [];
        list.push(b);
        budgetsByMonth.set(key, list);
      }
    });

    // 4. Map expense transactions by monthKey
    const expensesByMonth = new Map<string, Transaction[]>();
    const allPeriodExpenses: Transaction[] = [];

    // Valid month keys set for fast filtering
    const validMonthKeys = new Set(monthWindows.map((w) => w.monthKey));

    transactions.forEach((t) => {
      if (t.type !== 'expense' || !t.transactionDate) return;
      const d = new Date(t.transactionDate);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (validMonthKeys.has(key)) {
        allPeriodExpenses.push(t);
        const list = expensesByMonth.get(key) || [];
        list.push(t);
        expensesByMonth.set(key, list);
      }
    });

    // 5. Evaluate each month item (Chronological)
    const monthlyHistoryChronological: BudgetHistoryMonthItem[] = [];

    monthWindows.forEach(({ year, monthIndex, monthKey }) => {
      const monthBudgets = budgetsByMonth.get(monthKey) || [];
      const monthExpenses = expensesByMonth.get(monthKey) || [];

      // Calculate planned budget limit (in cents) across all budget records for this month
      let budgetAmountCents = 0;
      let primaryBudgetId: string | undefined = undefined;

      monthBudgets.forEach((b) => {
        if (!primaryBudgetId && b.id) primaryBudgetId = b.id;

        let bLimit = 0;
        if (
          b.budget_items &&
          Array.isArray(b.budget_items) &&
          b.budget_items.length > 0
        ) {
          bLimit = b.budget_items.reduce(
            (sum: number, item: any) => sum + (item.planned_amount || 0),
            0
          );
        }
        if (bLimit === 0 && b.total_limit && b.total_limit > 0) {
          bLimit = b.total_limit;
        }
        budgetAmountCents += bLimit;
      });

      // Calculate actual spent (in cents)
      const spentAmountCents = monthExpenses.reduce(
        (sum, t) => sum + (t.amount || 0),
        0
      );

      const remainingAmountCents = budgetAmountCents - spentAmountCents;

      let usagePercentage = 0;
      let status: BudgetMonthStatus = 'no_budget';

      if (budgetAmountCents > 0) {
        usagePercentage = Math.round((spentAmountCents / budgetAmountCents) * 100);
        if (usagePercentage > 100) {
          status = 'over_budget';
        } else if (usagePercentage >= 80) {
          status = 'near_limit';
        } else {
          status = 'on_track';
        }
      } else if (spentAmountCents > 0) {
        usagePercentage = 100;
        status = 'over_budget';
      } else {
        usagePercentage = 0;
        status = 'no_budget';
      }

      const tempDate = new Date(year, monthIndex, 1);
      const monthLabel = tempDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      const shortMonthLabel = tempDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      monthlyHistoryChronological.push({
        monthKey,
        year,
        monthIndex,
        monthLabel,
        shortMonthLabel,
        budgetId: primaryBudgetId,
        budgetAmount: budgetAmountCents,
        spentAmount: spentAmountCents,
        remainingAmount: remainingAmountCents,
        usagePercentage,
        status,
      });
    });

    // 6. Calculate Totals & Summary Metrics
    const totalMonthsEvaluated = monthlyHistoryChronological.length;

    const monthsWithBudget = monthlyHistoryChronological.filter(
      (m) => m.budgetAmount > 0
    );
    const monthsWithSpending = monthlyHistoryChronological.filter(
      (m) => m.spentAmount > 0
    );

    const totalBudgetInPeriod = monthlyHistoryChronological.reduce(
      (sum, m) => sum + m.budgetAmount,
      0
    );
    const totalSpentInPeriod = monthlyHistoryChronological.reduce(
      (sum, m) => sum + m.spentAmount,
      0
    );

    // Average budget across months that actually have an active budget
    const averageBudget =
      monthsWithBudget.length > 0
        ? Math.round(totalBudgetInPeriod / monthsWithBudget.length)
        : 0;

    // Average spent across months with spending
    const averageSpent =
      monthsWithSpending.length > 0
        ? Math.round(totalSpentInPeriod / monthsWithSpending.length)
        : 0;

    // Total Budget Usage (%): total spent in budgeted months divided by total budget in budgeted months
    const totalSpentInBudgetedMonths = monthsWithBudget.reduce(
      (sum, m) => sum + m.spentAmount,
      0
    );

    const averageUsagePercentage =
      totalBudgetInPeriod > 0
        ? Math.round((totalSpentInBudgetedMonths / totalBudgetInPeriod) * 100)
        : 0;

    // Best Month: lowest usage percentage with positive budget and spending
    const budgetedAndSpentMonths = monthsWithBudget.filter((m) => m.spentAmount > 0);
    let bestMonthItem: BudgetHistoryMonthItem | null = null;
    if (budgetedAndSpentMonths.length > 0) {
      bestMonthItem = [...budgetedAndSpentMonths].sort(
        (a, b) => a.usagePercentage - b.usagePercentage
      )[0];
    } else if (monthsWithBudget.length > 0) {
      bestMonthItem = [...monthsWithBudget].sort(
        (a, b) => a.usagePercentage - b.usagePercentage
      )[0];
    } else if (monthsWithSpending.length > 0) {
      bestMonthItem = [...monthsWithSpending].sort(
        (a, b) => a.spentAmount - b.spentAmount
      )[0];
    }

    // Highest Spending Month: highest spent amount
    let highestSpendingItem: BudgetHistoryMonthItem | null = null;
    if (monthsWithSpending.length > 0) {
      highestSpendingItem = [...monthsWithSpending].sort(
        (a, b) => b.spentAmount - a.spentAmount
      )[0];
    }

    let onTrackMonthsCount = 0;
    let nearLimitMonthsCount = 0;
    let overBudgetMonthsCount = 0;

    monthlyHistoryChronological.forEach((m) => {
      if (m.status === 'on_track') onTrackMonthsCount++;
      else if (m.status === 'near_limit') nearLimitMonthsCount++;
      else if (m.status === 'over_budget') overBudgetMonthsCount++;
    });

    const summary: BudgetHistorySummary = {
      averageBudget,
      averageSpent,
      averageUsagePercentage,
      bestMonth: bestMonthItem
        ? {
            monthLabel: bestMonthItem.monthLabel,
            usagePercentage: bestMonthItem.usagePercentage,
            budgetAmount: bestMonthItem.budgetAmount,
            spentAmount: bestMonthItem.spentAmount,
          }
        : null,
      highestSpendingMonth: highestSpendingItem
        ? {
            monthLabel: highestSpendingItem.monthLabel,
            usagePercentage: highestSpendingItem.usagePercentage,
            budgetAmount: highestSpendingItem.budgetAmount,
            spentAmount: highestSpendingItem.spentAmount,
          }
        : null,
      onTrackMonthsCount,
      nearLimitMonthsCount,
      overBudgetMonthsCount,
      totalMonthsEvaluated,
    };

    // 7. Chart Data (Budget vs Spending History)
    const avgSpentRupiah = Math.round(averageSpent / 100);
    const chartData: BudgetVsSpendingDataPoint[] = monthlyHistoryChronological.map(
      (m) => {
        const d = new Date(m.year, m.monthIndex, 1);
        const shortName = d.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        return {
          monthKey: m.monthKey,
          label: shortName,
          budgetAmount: Math.round(m.budgetAmount / 100),
          spentAmount: Math.round(m.spentAmount / 100),
          averageSpending: avgSpentRupiah,
          usagePercentage: m.usagePercentage,
          isOverBudget: m.usagePercentage > 100,
        };
      }
    );

    // 8. Spending by Category across the period
    const categorySpendingMap = new Map<string, number>();

    allPeriodExpenses.forEach((t) => {
      if (!t.categoryId) return;
      const cat = categoryMap.get(t.categoryId);
      // Map to parent category if it's a subcategory
      const effectiveCatId = cat?.parentId || t.categoryId;
      const cur = categorySpendingMap.get(effectiveCatId) || 0;
      categorySpendingMap.set(effectiveCatId, cur + (t.amount || 0));
    });

    const categorySpending: BudgetHistoryCategorySpending[] = [];
    const totalPeriodSpentNonZero = totalSpentInPeriod > 0 ? totalSpentInPeriod : 1;

    let paletteIdx = 0;
    Array.from(categorySpendingMap.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([catId, spentCents]) => {
        const cat = categoryMap.get(catId);
        const pct = Math.round((spentCents / totalPeriodSpentNonZero) * 100);

        categorySpending.push({
          categoryId: catId,
          categoryName: cat?.name || 'Uncategorized',
          categoryIcon: cat?.icon || 'tag',
          categoryColor:
            cat?.color || BUDGET_PALETTE[paletteIdx % BUDGET_PALETTE.length],
          spentAmount: spentCents,
          percentage: pct,
        });
        paletteIdx++;
      });

    // 9. Key Insights Generation
    const insights: BudgetHistoryInsight[] = [];

    // Insight 1: On-track ratio
    const evaluatedMonthsCount =
      monthsWithBudget.length > 0 ? monthsWithBudget.length : totalMonthsEvaluated;
    const onTrackRatio =
      evaluatedMonthsCount > 0
        ? Math.round((onTrackMonthsCount / evaluatedMonthsCount) * 100)
        : 0;
    insights.push({
      id: 'stayed-on-budget',
      type: 'success',
      title: `You stayed on budget for ${onTrackMonthsCount} out of ${evaluatedMonthsCount} months`,
      description: `That's ${onTrackRatio}% of the time. Great financial discipline!`,
    });

    // Insight 2: Spending trend compare to preceding half or previous 12 months
    const half = Math.floor(monthlyHistoryChronological.length / 2);
    if (half > 0) {
      const earlierMonths = monthlyHistoryChronological.slice(0, half);
      const recentMonths = monthlyHistoryChronological.slice(half);

      const earlierSpent = earlierMonths.reduce((s, m) => s + m.spentAmount, 0);
      const recentSpent = recentMonths.reduce((s, m) => s + m.spentAmount, 0);

      if (earlierSpent > 0) {
        const pctDiff = Math.round(
          ((recentSpent - earlierSpent) / earlierSpent) * 100
        );
        if (pctDiff > 0) {
          insights.push({
            id: 'spending-trend',
            type: 'warning',
            title: `Your spending increased by ${pctDiff}%`,
            description: `Compared to the earlier half of this tracking period.`,
          });
        } else {
          insights.push({
            id: 'spending-trend',
            type: 'success',
            title: `Your spending decreased by ${Math.abs(pctDiff)}%`,
            description: `You reduced your expenses compared to earlier months!`,
          });
        }
      }
    }

    // Insight 3: Highest spending exceedance
    if (highestSpendingItem) {
      const overAmount =
        highestSpendingItem.spentAmount - highestSpendingItem.budgetAmount;
      if (overAmount > 0) {
        insights.push({
          id: 'highest-spending',
          type: 'danger',
          title: `${highestSpendingItem.monthLabel} had the highest spending`,
          description: `You exceeded the budget by ${Math.round(
            highestSpendingItem.usagePercentage - 100
          )}% (${highestSpendingItem.monthLabel}).`,
        });
      } else {
        insights.push({
          id: 'highest-spending',
          type: 'warning',
          title: `${highestSpendingItem.monthLabel} had the highest spending`,
          description: `Peak spending reached ${highestSpendingItem.usagePercentage}% of its planned budget.`,
        });
      }
    }

    // For table display, sort descending (latest month first: Oct 2026 -> Nov 2025)
    const monthlyHistoryDescending = [...monthlyHistoryChronological].reverse();

    const selectedOption = TIME_RANGE_OPTIONS.find(
      (opt) => opt.value === timeRange
    );

    return {
      summary,
      monthlyHistory: monthlyHistoryDescending,
      chartData,
      categorySpending,
      insights,
      timeRange,
      timeRangeLabel: selectedOption?.label || 'Last 12 months',
      totalSpentInPeriod,
      totalBudgetInPeriod,
    };
  }, [budgets, transactions, categories, timeRange, referenceMonth]);
};
