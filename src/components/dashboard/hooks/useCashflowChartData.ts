import { useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { ChartDataPoint, PeriodSummary, PeriodType } from '../types';

interface UseCashflowChartDataParams {
  transactions: Transaction[];
  selectedPeriod: PeriodType;
  activeCustomRange: { start: string; end: string } | null;
}

export function useCashflowChartData({
  transactions,
  selectedPeriod,
  activeCustomRange,
}: UseCashflowChartDataParams) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const chartActivityData = useMemo<ChartDataPoint[]>(() => {
    if (selectedPeriod === '7d') {
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const days: ChartDataPoint[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = dayNames[d.getDay()];

        const dayTx = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          return t.transactionDate.split('T')[0] === dateStr;
        });

        const income = dayTx
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = dayTx
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expense);

        days.push({
          id: dateStr,
          label: dayLabel,
          fullDate: d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          income,
          expense,
          savings,
        });
      }

      return days;
    }

    if (selectedPeriod === '30d') {
      const buckets: ChartDataPoint[] = [];
      const now = new Date();

      for (let b = 4; b >= 0; b--) {
        const endOffset = b * 6;
        const startOffset = (b + 1) * 6 - 1;

        const startDate = new Date();
        startDate.setDate(now.getDate() - startOffset);
        const startStr = startDate.toISOString().split('T')[0];

        const endDate = new Date();
        endDate.setDate(now.getDate() - endOffset);
        const endStr = endDate.toISOString().split('T')[0];

        const bucketTx = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          const dStr = t.transactionDate.split('T')[0];
          return dStr >= startStr && dStr <= endStr;
        });

        const income = bucketTx
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = bucketTx
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expense);
        const bucketIndex = 5 - b;

        const formatShort = (d: Date) =>
          d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        buckets.push({
          id: `bucket-${b}`,
          label: `Mgg ${bucketIndex}`,
          fullDate: `${formatShort(startDate)} - ${formatShort(endDate)}`,
          income,
          expense,
          savings,
        });
      }

      return buckets;
    }

    if (selectedPeriod === '1y') {
      const year = new Date().getFullYear();
      const monthShort = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];
      const monthFull = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];

      const months: ChartDataPoint[] = [];

      for (let m = 0; m < 12; m++) {
        const monthPrefix = `${year}-${String(m + 1).padStart(2, '0')}`;

        const monthTx = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          return t.transactionDate.startsWith(monthPrefix);
        });

        const income = monthTx
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthTx
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expense);

        months.push({
          id: `month-${m}`,
          label: monthShort[m],
          fullDate: `${monthFull[m]} ${year}`,
          income,
          expense,
          savings,
        });
      }

      return months;
    }

    if (selectedPeriod === 'custom') {
      const range = activeCustomRange || {
        start: thirtyDaysAgoStr,
        end: todayStr,
      };

      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays <= 14) {
        const days: ChartDataPoint[] = [];
        for (let i = 0; i < diffDays; i++) {
          const cur = new Date(startDate);
          cur.setDate(startDate.getDate() + i);
          const dateStr = cur.toISOString().split('T')[0];

          const dayTx = transactions.filter((t) => {
            if (!t.transactionDate) return false;
            return t.transactionDate.split('T')[0] === dateStr;
          });

          const income = dayTx
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const expense = dayTx
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const savings = Math.max(0, income - expense);

          days.push({
            id: dateStr,
            label: `${cur.getDate()}/${cur.getMonth() + 1}`,
            fullDate: cur.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            income,
            expense,
            savings,
          });
        }
        return days;
      }

      const bucketCount = 5;
      const bucketDays = Math.ceil(diffDays / bucketCount);
      const buckets: ChartDataPoint[] = [];

      for (let b = 0; b < bucketCount; b++) {
        const bStart = new Date(startDate);
        bStart.setDate(startDate.getDate() + b * bucketDays);

        const bEnd = new Date(startDate);
        bEnd.setDate(startDate.getDate() + Math.min((b + 1) * bucketDays - 1, diffDays - 1));

        const bStartStr = bStart.toISOString().split('T')[0];
        const bEndStr = bEnd.toISOString().split('T')[0];

        const bucketTx = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          const dStr = t.transactionDate.split('T')[0];
          return dStr >= bStartStr && dStr <= bEndStr;
        });

        const income = bucketTx
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = bucketTx
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expense);

        const formatShort = (d: Date) =>
          d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        buckets.push({
          id: `custom-b-${b}`,
          label: `P${b + 1}`,
          fullDate: `${formatShort(bStart)} - ${formatShort(bEnd)}`,
          income,
          expense,
          savings,
        });
      }

      return buckets;
    }

    return [];
  }, [selectedPeriod, activeCustomRange, transactions, thirtyDaysAgoStr, todayStr]);

  const periodSummary = useMemo<PeriodSummary>(() => {
    const income = chartActivityData.reduce((sum, d) => sum + d.income, 0);
    const expense = chartActivityData.reduce((sum, d) => sum + d.expense, 0);
    const savings = Math.max(0, income - expense);
    return { income, expense, savings };
  }, [chartActivityData]);

  const maxChartVal = useMemo(() => {
    const highest = Math.max(
      ...chartActivityData.map((d) => Math.max(d.income, d.expense, d.savings)),
      0
    );
    return Math.max(highest, 1000000);
  }, [chartActivityData]);

  return {
    chartActivityData,
    periodSummary,
    maxChartVal,
    todayStr,
    thirtyDaysAgoStr,
  };
}
