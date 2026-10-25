import { useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { TransactionsAnalyticsSummary } from '../types';

interface UseTransactionsAnalyticsParams {
  transactions: Transaction[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export function useTransactionsAnalytics({
  transactions,
  startDate,
  endDate,
}: UseTransactionsAnalyticsParams): TransactionsAnalyticsSummary {
  return useMemo(() => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    const durationMs = end.getTime() - start.getTime();

    // Previous comparison period of identical duration
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    let incCurrent = 0;
    let expCurrent = 0;
    let trCurrent = 0;
    let countCurrent = 0;

    let incPrev = 0;
    let expPrev = 0;
    let trPrev = 0;

    // Buckets for sparklines (8 sample points)
    const BUCKET_COUNT = 8;
    const bucketDuration = Math.max(durationMs / BUCKET_COUNT, 1);
    const incBuckets = new Array(BUCKET_COUNT).fill(0);
    const expBuckets = new Array(BUCKET_COUNT).fill(0);
    const trBuckets = new Array(BUCKET_COUNT).fill(0);

    for (const tx of transactions) {
      if (!tx.transactionDate) continue;
      const txTime = new Date(tx.transactionDate).getTime();

      // Current period
      if (txTime >= start.getTime() && txTime <= end.getTime()) {
        countCurrent++;
        const bucketIdx = Math.min(
          Math.floor((txTime - start.getTime()) / bucketDuration),
          BUCKET_COUNT - 1
        );

        if (tx.type === 'income') {
          incCurrent += tx.amount;
          incBuckets[bucketIdx] += tx.amount / 100;
        } else if (tx.type === 'expense') {
          expCurrent += tx.amount;
          expBuckets[bucketIdx] += tx.amount / 100;
        } else if (tx.type === 'transfer') {
          trCurrent += tx.amount;
          trBuckets[bucketIdx] += tx.amount / 100;
        }
      }
      // Previous period
      else if (txTime >= prevStart.getTime() && txTime <= prevEnd.getTime()) {
        if (tx.type === 'income') {
          incPrev += tx.amount;
        } else if (tx.type === 'expense') {
          expPrev += tx.amount;
        } else if (tx.type === 'transfer') {
          trPrev += tx.amount;
        }
      }
    }

    // Calculate percentage differences
    const calcPercent = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const incomeMomPercent = calcPercent(incCurrent, incPrev);
    const expenseMomPercent = calcPercent(expCurrent, expPrev);
    const transferMomPercent = calcPercent(trCurrent, trPrev);

    // Fallback baseline sparkline if empty so SVG line charts render smoothly
    const ensureSparkline = (arr: number[]) => {
      const hasValue = arr.some((v) => v > 0);
      if (!hasValue) return [10, 20, 15, 35, 25, 45, 35, 50];
      return arr;
    };

    return {
      totalIncome: incCurrent,
      totalExpense: expCurrent,
      totalTransfer: trCurrent,
      incomeMomPercent,
      expenseMomPercent,
      transferMomPercent,
      incomeSparkline: ensureSparkline(incBuckets),
      expenseSparkline: ensureSparkline(expBuckets),
      transferSparkline: ensureSparkline(trBuckets),
      filteredCount: countCurrent,
    };
  }, [transactions, startDate, endDate]);
}
