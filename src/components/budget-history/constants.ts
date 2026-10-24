import { CATEGORY_ICON_MAP, getCategoryIcon } from '@/components/categories/constants';
import { BudgetHistoryTimeRange, BudgetMonthStatus } from './types';

export { CATEGORY_ICON_MAP, getCategoryIcon };

export const TIME_RANGE_OPTIONS: { label: string; value: BudgetHistoryTimeRange }[] = [
  { label: 'Last 12 months', value: '12m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'This Year (2026)', value: 'year' },
  { label: 'All time', value: 'all' },
];

export const STATUS_CONFIG: Record<
  BudgetMonthStatus,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
    progressColor: string;
  }
> = {
  on_track: {
    label: 'On track',
    badgeBg: 'bg-[#EDF8E8]',
    badgeText: 'text-[#2C6E20]',
    badgeBorder: 'border-[#D4EDCC]',
    dotColor: '#529E42',
    progressColor: '#529E42',
  },
  near_limit: {
    label: 'Near limit',
    badgeBg: 'bg-[#FEF9C3]',
    badgeText: 'text-[#854D0E]',
    badgeBorder: 'border-[#FEF08A]',
    dotColor: '#EAB308',
    progressColor: '#EAB308',
  },
  over_budget: {
    label: 'Over budget',
    badgeBg: 'bg-[#FEE2E2]',
    badgeText: 'text-[#991B1B]',
    badgeBorder: 'border-[#FECACA]',
    dotColor: '#EF4444',
    progressColor: '#EF4444',
  },
  no_budget: {
    label: 'No budget',
    badgeBg: 'bg-[#F4F6F2]',
    badgeText: 'text-[#6D776F]',
    badgeBorder: 'border-[#E2E6DF]',
    dotColor: '#9CA3AF',
    progressColor: '#E2E6DF',
  },
};

export const BUDGET_PALETTE = [
  '#529E42', // green (Housing / primary)
  '#F59E0B', // amber (Food & Dining)
  '#3B82F6', // blue (Transportation)
  '#EF4444', // red (Healthcare)
  '#8B5CF6', // purple (Entertainment)
  '#F97316', // orange (Personal)
  '#64748B', // slate (Others)
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#10B981', // emerald
];
