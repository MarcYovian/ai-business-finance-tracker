import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBudgetHistoryAnalytics } from '../hooks/useBudgetHistoryAnalytics';

describe('useBudgetHistoryAnalytics', () => {
  it('correctly calculates budget usage without exploding percentages when some months are unbudgeted', () => {
    // Simulate user data:
    // Budget set in November 2026: Rp 9.500.000 (950,000,000 cents)
    // Expense in November 2026: Rp 6.820.000 (682,000,000 cents)
    const mockBudgets = [
      {
        id: 'budget-nov',
        start_date: '2026-11-01',
        budget_items: [
          { planned_amount: 950000000 },
        ],
      },
    ];

    const mockTransactions: any[] = [
      {
        id: 'tx-1',
        type: 'expense',
        amount: 682000000,
        transactionDate: '2026-11-10T10:00:00Z',
      },
    ];

    const { result } = renderHook(() =>
      useBudgetHistoryAnalytics({
        budgets: mockBudgets,
        transactions: mockTransactions,
        categories: [],
        timeRange: '12m',
        referenceMonth: new Date(2026, 10, 1), // November 2026
      })
    );

    const { summary, monthlyHistory } = result.current;

    // November 2026 usage should be exactly 72%
    expect(summary.averageUsagePercentage).toBe(72);
    expect(summary.averageBudget).toBe(950000000);
    expect(summary.averageSpent).toBe(682000000);
    expect(summary.onTrackMonthsCount).toBe(1);
    expect(summary.nearLimitMonthsCount).toBe(0);
    expect(summary.overBudgetMonthsCount).toBe(0);

    // Verify November item
    const novItem = monthlyHistory.find((m) => m.monthKey === '2026-11');
    expect(novItem).toBeDefined();
    expect(novItem?.status).toBe('on_track');
    expect(novItem?.usagePercentage).toBe(72);

    // Verify other unbudgeted months are 'no_budget'
    const octItem = monthlyHistory.find((m) => m.monthKey === '2026-10');
    expect(octItem?.status).toBe('no_budget');
    expect(octItem?.budgetAmount).toBe(0);
  });

  it('safely handles zero budgets without producing NaN or Infinity', () => {
    const { result } = renderHook(() =>
      useBudgetHistoryAnalytics({
        budgets: [],
        transactions: [],
        categories: [],
        timeRange: '12m',
        referenceMonth: new Date(2026, 10, 1),
      })
    );

    expect(result.current.summary.averageUsagePercentage).toBe(0);
    expect(result.current.summary.averageBudget).toBe(0);
    expect(result.current.summary.averageSpent).toBe(0);
    expect(result.current.summary.onTrackMonthsCount).toBe(0);
  });
});
