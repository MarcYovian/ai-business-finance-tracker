import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SpendingByAccountItem } from '../types';
import { formatCurrency } from '@/lib/currency';

interface SpendingByAccountWidgetProps {
  spendingData: SpendingByAccountItem[];
}

export const SpendingByAccountWidget: React.FC<SpendingByAccountWidgetProps> = ({
  spendingData,
}) => {
  const formatYAxis = (cents: number) => {
    const rupiah = cents / 100;
    if (rupiah === 0) return '0';
    if (rupiah >= 1000000) {
      const millions = rupiah / 1000000;
      return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
    }
    if (rupiah >= 1000) {
      return `${Math.round(rupiah / 1000)}k`;
    }
    return String(rupiah);
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#161F18] text-white text-xs p-2 rounded-lg shadow-md border border-slate-700">
          <p className="font-semibold">{item.name}</p>
          <p className="text-[#8DC53E] font-medium mt-0.5">
            {formatCurrency(item.amount)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs">
      <CardContent className="p-4 sm:p-5">
        <h2 className="text-base font-bold text-[#161F18]">
          Spending by Account{' '}
          <span className="text-xs font-normal text-[#8B968D]">(This Month)</span>
        </h2>

        <div className="h-44 sm:h-48 w-full mt-3">
          {spendingData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#8B968D]">
              No spending recorded for this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={spendingData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={32}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737E75', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737E75', fontSize: 11 }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {spendingData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
