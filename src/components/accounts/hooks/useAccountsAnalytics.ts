import { useMemo } from 'react';
import { FundSource, Transaction } from '@/types/finance';
import {
  AccountWithAnalytics,
  BalanceDistributionItem,
  SpendingByAccountItem,
  MonthlyTrendItem,
} from '../types';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS, SPENDING_PALETTE } from '../constants';

interface UseAccountsAnalyticsParams {
  fundSources: FundSource[];
  transactions: Transaction[];
  trendMonths?: number;
}

export function useAccountsAnalytics({
  fundSources,
  transactions,
  trendMonths = 6,
}: UseAccountsAnalyticsParams) {
  // Current date markers
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Active vs Inactive Accounts
  const activeFundSources = useMemo(() => {
    return fundSources.filter((fs) => fs.is_active !== false);
  }, [fundSources]);

  const activeAccountsCount = activeFundSources.length;
  const inactiveAccountsCount = fundSources.length - activeAccountsCount;

  // 2. Total Balance (active accounts)
  const totalBalance = useMemo(() => {
    return activeFundSources.reduce((sum, fs) => sum + (fs.balance || 0), 0);
  }, [activeFundSources]);

  // 3. Transactions this month and last month
  const {
    thisMonthTx,
    lastMonthTx,
    incomeThisMonth,
    expenseThisMonth,
    incomeLastMonth,
    expenseLastMonth,
  } = useMemo(() => {
    let incThis = 0;
    let expThis = 0;
    let incLast = 0;
    let expLast = 0;

    const thisMonthArr: Transaction[] = [];
    const lastMonthArr: Transaction[] = [];

    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;

    for (const tx of transactions) {
      if (!tx.transactionDate) continue;
      const d = new Date(tx.transactionDate);
      const txYear = d.getFullYear();
      const txMonth = d.getMonth();

      if (txYear === currentYear && txMonth === currentMonth) {
        thisMonthArr.push(tx);
        if (tx.type === 'income') incThis += tx.amount;
        if (tx.type === 'expense') expThis += tx.amount;
      } else if (txYear === lastMonthYear && txMonth === lastMonthIdx) {
        lastMonthArr.push(tx);
        if (tx.type === 'income') incLast += tx.amount;
        if (tx.type === 'expense') expLast += tx.amount;
      }
    }

    return {
      thisMonthTx: thisMonthArr,
      lastMonthTx: lastMonthArr,
      incomeThisMonth: incThis,
      expenseThisMonth: expThis,
      incomeLastMonth: incLast,
      expenseLastMonth: expLast,
    };
  }, [transactions, currentYear, currentMonth]);

  // 4. Percentage Changes
  const incomeChangePercent = useMemo(() => {
    if (incomeLastMonth === 0) return incomeThisMonth > 0 ? 100 : 0;
    return Number((((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100).toFixed(1));
  }, [incomeThisMonth, incomeLastMonth]);

  const expenseChangePercent = useMemo(() => {
    if (expenseLastMonth === 0) return expenseThisMonth > 0 ? 100 : 0;
    return Number((((expenseThisMonth - expenseLastMonth) / expenseLastMonth) * 100).toFixed(1));
  }, [expenseThisMonth, expenseLastMonth]);

  const balanceChangePercent = useMemo(() => {
    const netThisMonth = incomeThisMonth - expenseThisMonth;
    const openingBalance = totalBalance - netThisMonth;
    if (openingBalance <= 0) return 0;
    return Number((((totalBalance - openingBalance) / openingBalance) * 100).toFixed(1));
  }, [totalBalance, incomeThisMonth, expenseThisMonth]);

  // 5. Account Details with Last Transaction & Sparkline
  const accountsWithDetails = useMemo<AccountWithAnalytics[]>(() => {
    const txByFund = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      if (tx.sourceFundId) {
        const list = txByFund.get(tx.sourceFundId) || [];
        list.push(tx);
        txByFund.set(tx.sourceFundId, list);
      }
      if (tx.destinationFundId && tx.destinationFundId !== tx.sourceFundId) {
        const list = txByFund.get(tx.destinationFundId) || [];
        list.push(tx);
        txByFund.set(tx.destinationFundId, list);
      }
    }

    return fundSources.map((fs) => {
      const fundTx = txByFund.get(fs.id) || [];
      // Sort newest first
      const sorted = [...fundTx].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );

      const latest = sorted[0];
      const lastTransaction = latest
        ? {
            description: latest.description || 'Transaction',
            date: latest.transactionDate,
            amount: latest.amount,
            type: latest.type,
          }
        : null;

      // Net change this month for this fund
      let fundIncomeThisMonth = 0;
      let fundExpenseThisMonth = 0;

      for (const t of fundTx) {
        if (!t.transactionDate) continue;
        const d = new Date(t.transactionDate);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          if (t.type === 'income' && t.destinationFundId === fs.id) {
            fundIncomeThisMonth += t.amount;
          } else if (t.type === 'expense' && t.sourceFundId === fs.id) {
            fundExpenseThisMonth += t.amount;
          } else if (t.type === 'transfer') {
            if (t.destinationFundId === fs.id) fundIncomeThisMonth += t.amount;
            if (t.sourceFundId === fs.id) fundExpenseThisMonth += t.amount;
          }
        }
      }

      const netChange = fundIncomeThisMonth - fundExpenseThisMonth;
      const opening = fs.balance - netChange;
      const percentChange =
        opening !== 0 ? Number(((netChange / Math.abs(opening)) * 100).toFixed(1)) : 0;

      // Generate a mini sparkline array of 5 points
      const sparkline: number[] = [];
      const currentVal = fs.balance;
      // Synthesize realistic trajectory points backwards
      const delta1 = netChange * 0.2;
      const delta2 = netChange * 0.4;
      const delta3 = netChange * 0.7;
      sparkline.push(currentVal - netChange);
      sparkline.push(currentVal - delta3);
      sparkline.push(currentVal - delta2);
      sparkline.push(currentVal - delta1);
      sparkline.push(currentVal);

      return {
        ...fs,
        lastTransaction,
        percentChange,
        sparkline,
      };
    });
  }, [fundSources, transactions, currentYear, currentMonth]);

  // 6. Balance Distribution
  const balanceDistribution = useMemo<BalanceDistributionItem[]>(() => {
    const typeTotals: Record<string, number> = {
      bank: 0,
      wallet: 0,
      cash: 0,
      credit_card: 0,
    };

    for (const fs of activeFundSources) {
      const t = fs.type || 'bank';
      if (typeTotals[t] !== undefined) {
        typeTotals[t] += fs.balance;
      } else {
        typeTotals.bank += fs.balance;
      }
    }

    // Gross positive total to calculate percentage
    const grossPositive = Object.values(typeTotals)
      .filter((v) => v > 0)
      .reduce((sum, v) => sum + v, 0);

    const baseGross = grossPositive > 0 ? grossPositive : 1;

    const list: BalanceDistributionItem[] = [
      {
        type: 'bank',
        label: ACCOUNT_TYPE_LABELS.bank,
        total: typeTotals.bank,
        percentage: Math.round((typeTotals.bank / baseGross) * 100),
        color: ACCOUNT_TYPE_COLORS.bank.hex,
      },
      {
        type: 'wallet',
        label: ACCOUNT_TYPE_LABELS.wallet,
        total: typeTotals.wallet,
        percentage: Math.round((typeTotals.wallet / baseGross) * 100),
        color: ACCOUNT_TYPE_COLORS.wallet.hex,
      },
      {
        type: 'cash',
        label: ACCOUNT_TYPE_LABELS.cash,
        total: typeTotals.cash,
        percentage: Math.round((typeTotals.cash / baseGross) * 100),
        color: ACCOUNT_TYPE_COLORS.cash.hex,
      },
      {
        type: 'credit_card',
        label: ACCOUNT_TYPE_LABELS.credit_card,
        total: typeTotals.credit_card,
        percentage: Math.round((typeTotals.credit_card / baseGross) * 100),
        color: ACCOUNT_TYPE_COLORS.credit_card.hex,
      },
    ];

    return list;
  }, [activeFundSources]);

  // 7. Spending by Account (This Month)
  const spendingByAccount = useMemo<SpendingByAccountItem[]>(() => {
    const spendingMap = new Map<string, number>();

    for (const tx of thisMonthTx) {
      if (tx.type === 'expense' && tx.sourceFundId) {
        const cur = spendingMap.get(tx.sourceFundId) || 0;
        spendingMap.set(tx.sourceFundId, cur + tx.amount);
      }
    }

    // Map each account that has spending or include top active ones
    const items: SpendingByAccountItem[] = [];
    const fsMap = new Map(fundSources.map((fs) => [fs.id, fs]));

    spendingMap.forEach((amount, fsId) => {
      const fs = fsMap.get(fsId);
      if (fs) {
        items.push({
          id: fs.id,
          name: fs.name,
          type: fs.type,
          amount,
          color: ACCOUNT_TYPE_COLORS[fs.type]?.hex || SPENDING_PALETTE[0],
        });
      }
    });

    // If no transactions yet, fallback to active accounts with 0 spending for preview
    if (items.length === 0) {
      activeFundSources.slice(0, 5).forEach((fs, i) => {
        items.push({
          id: fs.id,
          name: fs.name,
          type: fs.type,
          amount: 0,
          color: SPENDING_PALETTE[i % SPENDING_PALETTE.length],
        });
      });
    }

    // Sort by amount descending
    items.sort((a, b) => b.amount - a.amount);
    return items;
  }, [thisMonthTx, fundSources, activeFundSources]);

  // 8. Monthly Balance Trend (Trailing N Months)
  const monthlyBalanceTrend = useMemo<MonthlyTrendItem[]>(() => {
    const months: MonthlyTrendItem[] = [];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    // Compute monthly net flows
    const monthlyNet = new Map<string, { income: number; expense: number }>();

    for (const tx of transactions) {
      if (!tx.transactionDate) continue;
      const d = new Date(tx.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyNet.get(key) || { income: 0, expense: 0 };
      if (tx.type === 'income') entry.income += tx.amount;
      if (tx.type === 'expense') entry.expense += tx.amount;
      monthlyNet.set(key, entry);
    }

    // Build chronological array from (now - trendMonths + 1) to now
    const tempBuckets: { key: string; label: string; income: number; expense: number }[] = [];

    for (let i = 0; i < trendMonths; i++) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${monthNames[m]} ${y}`;
      const data = monthlyNet.get(key) || { income: 0, expense: 0 };

      tempBuckets.push({
        key,
        label,
        income: data.income,
        expense: data.expense,
      });
    }

    // Reconstruct balances backwards from current totalBalance
    const reversed = [...tempBuckets]; // 0 is this month, 1 is last month...
    const resultWithBalance: MonthlyTrendItem[] = [];

    let currentTrackedBalance = totalBalance;
    for (let i = 0; i < reversed.length; i++) {
      const item = reversed[i];
      resultWithBalance.push({
        monthKey: item.key,
        label: item.label,
        balance: currentTrackedBalance,
        income: item.income,
        expense: item.expense,
      });
      // Previous month's balance = current balance - (income - expense)
      currentTrackedBalance = currentTrackedBalance - (item.income - item.expense);
    }

    // Sort chronologically (oldest to newest)
    resultWithBalance.reverse();
    return resultWithBalance;
  }, [transactions, totalBalance, trendMonths, currentYear, currentMonth]);

  // 9. Enriched Recent Transactions
  const recentTransactions = useMemo(() => {
    const fsMap = new Map(fundSources.map((fs) => [fs.id, fs.name]));

    const sorted = [...transactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 5);

    return sorted.map((t) => ({
      ...t,
      sourceFundName: t.sourceFundId ? fsMap.get(t.sourceFundId) : undefined,
      destinationFundName: t.destinationFundId ? fsMap.get(t.destinationFundId) : undefined,
    }));
  }, [transactions, fundSources]);

  return {
    activeAccountsCount,
    inactiveAccountsCount,
    totalBalance,
    balanceChangePercent,
    incomeThisMonth,
    incomeChangePercent,
    expenseThisMonth,
    expenseChangePercent,
    accountsWithDetails,
    balanceDistribution,
    spendingByAccount,
    monthlyBalanceTrend,
    recentTransactions,
  };
}
