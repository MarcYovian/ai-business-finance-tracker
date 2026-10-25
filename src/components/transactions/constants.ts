import { TransactionFilterState } from './types';

const getInitialDateRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${d}`,
  };
};

const initialDates = getInitialDateRange();

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilterState = {
  search: '',
  datePreset: 'current',
  startDate: initialDates.start,
  endDate: initialDates.end,
  types: ['income', 'expense', 'transfer'],
  accountId: 'all',
  categoryId: 'all',
  minAmount: '',
  maxAmount: '',
  status: 'all',
};

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
] as const;

export const DATE_RANGE_PRESETS = [
  { value: 'custom', label: 'Custom range' },
  { value: 'current', label: 'Current Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
] as const;

export interface BrandMeta {
  name: string;
  bgColor: string;
  textColor: string;
  iconType: 'shopping-cart' | 'car' | 'tv' | 'arrow-down' | 'wifi' | 'arrow-left-right' | 'coffee' | 'shopping-bag' | 'briefcase' | 'dumbbell' | 'zap' | 'music' | 'heart' | 'utensils' | 'fuel' | 'gamepad';
}

export const BRAND_MAP: Record<string, BrandMeta> = {
  superindo: {
    name: 'Superindo',
    bgColor: 'bg-red-50 text-red-600 border-red-200',
    textColor: 'text-red-600',
    iconType: 'shopping-cart',
  },
  grab: {
    name: 'Grab',
    bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    textColor: 'text-emerald-600',
    iconType: 'car',
  },
  netflix: {
    name: 'Netflix',
    bgColor: 'bg-neutral-900 text-red-500 border-neutral-700',
    textColor: 'text-red-500',
    iconType: 'tv',
  },
  salary: {
    name: 'Salary',
    bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    textColor: 'text-emerald-600',
    iconType: 'arrow-down',
  },
  gaji: {
    name: 'Salary',
    bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    textColor: 'text-emerald-600',
    iconType: 'arrow-down',
  },
  indihome: {
    name: 'Indihome',
    bgColor: 'bg-red-50 text-orange-600 border-orange-200',
    textColor: 'text-orange-600',
    iconType: 'wifi',
  },
  dana: {
    name: 'Dana',
    bgColor: 'bg-blue-50 text-blue-600 border-blue-200',
    textColor: 'text-blue-600',
    iconType: 'arrow-left-right',
  },
  transfer: {
    name: 'Transfer',
    bgColor: 'bg-blue-50 text-blue-600 border-blue-200',
    textColor: 'text-blue-600',
    iconType: 'arrow-left-right',
  },
  starbucks: {
    name: 'Starbucks',
    bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    textColor: 'text-emerald-700',
    iconType: 'coffee',
  },
  tokopedia: {
    name: 'Tokopedia',
    bgColor: 'bg-green-50 text-green-600 border-green-200',
    textColor: 'text-green-600',
    iconType: 'shopping-bag',
  },
  freelance: {
    name: 'Freelance',
    bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
    textColor: 'text-amber-700',
    iconType: 'briefcase',
  },
  gym: {
    name: 'Gym',
    bgColor: 'bg-pink-50 text-pink-600 border-pink-200',
    textColor: 'text-pink-600',
    iconType: 'dumbbell',
  },
  shopee: {
    name: 'Shopee',
    bgColor: 'bg-orange-50 text-orange-600 border-orange-200',
    textColor: 'text-orange-600',
    iconType: 'shopping-bag',
  },
  pln: {
    name: 'PLN',
    bgColor: 'bg-amber-50 text-amber-600 border-amber-200',
    textColor: 'text-amber-600',
    iconType: 'zap',
  },
  spotify: {
    name: 'Spotify',
    bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    textColor: 'text-emerald-600',
    iconType: 'music',
  },
  pertamina: {
    name: 'Pertamina',
    bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
    textColor: 'text-blue-700',
    iconType: 'fuel',
  },
  steam: {
    name: 'Steam',
    bgColor: 'bg-slate-900 text-cyan-400 border-slate-700',
    textColor: 'text-cyan-400',
    iconType: 'gamepad',
  },
};
