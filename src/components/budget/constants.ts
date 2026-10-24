import { CATEGORY_ICON_MAP, getCategoryIcon } from '@/components/categories/constants';

export { CATEGORY_ICON_MAP, getCategoryIcon };

export const BUDGET_PALETTE = [
  '#529E42', // green (Housing / primary)
  '#F59E0B', // amber (Food & Dining)
  '#3B82F6', // blue (Transportation)
  '#EF4444', // red (Healthcare)
  '#F97316', // orange (Personal)
  '#8B5CF6', // violet (Entertainment)
  '#94A3B8', // slate (Others)
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#10B981', // emerald
];

export const PROGRESS_STATUS_COLORS = {
  safe: {
    bar: '#529E42',
    bg: '#EDF8E8',
    text: '#2C6E20',
  },
  warning: {
    bar: '#F59E0B',
    bg: '#FEF3C7',
    text: '#B45309',
  },
  caution: {
    bar: '#F97316',
    bg: '#FFEDD5',
    text: '#C2410C',
  },
  danger: {
    bar: '#EF4444',
    bg: '#FEE2E2',
    text: '#B91C1C',
  },
};

export const getProgressColor = (progress: number) => {
  if (progress > 95) return PROGRESS_STATUS_COLORS.danger;
  if (progress > 80) return PROGRESS_STATUS_COLORS.caution;
  if (progress > 65) return PROGRESS_STATUS_COLORS.warning;
  return PROGRESS_STATUS_COLORS.safe;
};
