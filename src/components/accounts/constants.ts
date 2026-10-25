import { FundType } from '@/types/finance';

export const ACCOUNT_TYPE_LABELS: Record<FundType, string> = {
  bank: 'Bank',
  wallet: 'E-wallet',
  cash: 'Cash',
  credit_card: 'Credit Card',
  other: 'Other',
};

export const ACCOUNT_TYPE_COLORS: Record<FundType, { bg: string; text: string; border: string; hex: string }> = {
  bank: {
    bg: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    hex: '#529E42', // green matching mockup
  },
  wallet: {
    bg: 'bg-purple-50 text-purple-700',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hex: '#9353D3', // purple
  },
  cash: {
    bg: 'bg-lime-50 text-lime-700',
    text: 'text-lime-700',
    border: 'border-lime-200',
    hex: '#84CC16', // lime
  },
  credit_card: {
    bg: 'bg-amber-50 text-amber-700',
    text: 'text-amber-700',
    border: 'border-amber-200',
    hex: '#F59E0B', // amber / orange
  },
  other: {
    bg: 'bg-slate-50 text-slate-700',
    text: 'text-slate-700',
    border: 'border-slate-200',
    hex: '#64748B',
  },
};

export const SPENDING_PALETTE = [
  '#529E42', // Green (BCA)
  '#84CC16', // Light Green (Mandiri)
  '#A855F7', // Light Purple (GoPay)
  '#8B5CF6', // Purple (OVO)
  '#FBBF24', // Amber/Yellow (Cash)
  '#06B6D4', // Cyan
  '#F97316', // Orange
];
