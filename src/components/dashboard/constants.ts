import { CardThemeConfig, PeriodType } from './types';

export const CATEGORY_COLORS = [
  '#F5A87B', // Peach
  '#F7D063', // Yellow
  '#E2ED7C', // Soft Lime
  '#9CD447', // Lime Accent
  '#8DC53E', // Forest Lime
  '#4E8B74', // Teal Green
  '#D9E1D6', // Neutral Grey
];

export const BANK_OPTIONS = [
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'BSI',
  'CIMB Niaga',
  'Permata',
  'GoPay',
  'OVO',
  'DANA',
  'ShopeePay',
  'Lainnya',
];

export const CARD_THEMES: Record<string, CardThemeConfig> = {
  lime: {
    bg: 'bg-[#8DC53E]',
    text: 'text-[#18280D]',
    subText: 'text-[#2A4413]',
    ringColor: 'border-white/20',
    chipBg: 'bg-[#9FD84C]',
    chipBorder: 'border-[#6FA527]/50',
  },
  dark: {
    bg: 'bg-[#18211A]',
    text: 'text-white',
    subText: 'text-[#8E9B90]',
    ringColor: 'border-white/10',
    chipBg: 'bg-[#E2ED7C]',
    chipBorder: 'border-[#E2ED7C]/60',
  },
  blue: {
    bg: 'bg-[#1E3A8A]',
    text: 'text-white',
    subText: 'text-[#93C5FD]',
    ringColor: 'border-white/20',
    chipBg: 'bg-[#60A5FA]',
    chipBorder: 'border-[#3B82F6]/60',
  },
  peach: {
    bg: 'bg-[#F5A87B]',
    text: 'text-[#301605]',
    subText: 'text-[#5E2B0C]',
    ringColor: 'border-white/25',
    chipBg: 'bg-[#F7C0A0]',
    chipBorder: 'border-[#D97D45]/50',
  },
};

export const PERIOD_LABELS: Record<PeriodType, string> = {
  '7d': '7 Hari Terakhir',
  '30d': '30 Hari Terakhir',
  '1y': 'Tahun Ini (12 Bulan)',
  custom: 'Rentang Kustom',
};

export const DEFAULT_MONTHLY_BUDGET_LIMIT = 0;
export const DEFAULT_CASH_RESERVE_TARGET = 10000000;
