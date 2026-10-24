export type PeriodType = '7d' | '30d' | '1y' | 'custom';

export interface ChartDataPoint {
  id: string;
  label: string;
  fullDate: string;
  income: number;
  expense: number;
  savings: number;
}

export interface PeriodSummary {
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface CardThemeConfig {
  bg: string;
  text: string;
  subText: string;
  ringColor: string;
  chipBg: string;
  chipBorder: string;
}
