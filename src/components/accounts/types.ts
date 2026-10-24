import { FundSource, FundType, Transaction } from '@/types/finance';

export type AccountTabFilter = 'all' | 'bank' | 'wallet' | 'cash' | 'credit_card';

export interface AccountWithAnalytics extends FundSource {
  lastTransaction?: {
    description: string;
    date: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
  } | null;
  percentChange?: number;
  sparkline?: number[];
}

export interface BalanceDistributionItem {
  type: FundType;
  label: string;
  total: number; // in cents
  percentage: number;
  color: string;
}

export interface SpendingByAccountItem {
  id: string;
  name: string;
  type: FundType;
  amount: number; // in cents
  color: string;
}

export interface MonthlyTrendItem {
  monthKey: string;
  label: string;
  balance: number; // in cents
  income: number;
  expense: number;
}
