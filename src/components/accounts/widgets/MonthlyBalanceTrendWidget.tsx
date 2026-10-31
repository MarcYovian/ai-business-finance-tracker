'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MonthlyTrendItem } from '../types';
import { formatCurrency } from '@/lib/currency';

interface MonthlyBalanceTrendWidgetProps {
  trendData: MonthlyTrendItem[];
  selectedMonths: number;
  onSelectMonths: (months: number) => void;
}

export const MonthlyBalanceTrendWidget: React.FC<MonthlyBalanceTrendWidgetProps> = ({
  trendData,
  selectedMonths,
  onSelectMonths,
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

  const CustomTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as MonthlyTrendItem;
      return (
        <div className="bg-[#161F18] text-white text-xs p-2 rounded-lg shadow-md border border-slate-700">
          <p className="font-semibold">{item.label}</p>
          <p className="text-[#8DC53E] font-medium mt-0.5">
            Balance: {formatCurrency(item.balance)}
          </p>
          <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
            <p>Income: +{formatCurrency(item.income)}</p>
            <p>Expense: -{formatCurrency(item.expense)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs">
      <CardContent className="p-4 sm:p-5">
        {/* Header with Period Dropdown */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#161F18]">Monthly Balance Trend</h2>

          <Select
            value={String(selectedMonths)}
            onValueChange={(val) => onSelectMonths(Number(val))}
          >
            <SelectTrigger className="h-7 w-24 text-[11px] rounded-lg border-[#EDF1EB] bg-[#F6F7F5] font-medium">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl text-xs">
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Area Line Chart */}
        <div className="h-44 sm:h-48 w-full">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#8B968D]">
              No trend data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="balanceTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#529E42" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#529E42" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737E75', fontSize: 10 }}
                  tickFormatter={(val) => (typeof val === 'string' ? val.split(' ')[0] : val)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737E75', fontSize: 11 }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#529E42"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#balanceTrendGrad)"
                  dot={{ r: 3, fill: '#529E42', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                  activeDot={{ r: 4.5, fill: '#3E7A31', strokeWidth: 2, stroke: '#FFFFFF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
