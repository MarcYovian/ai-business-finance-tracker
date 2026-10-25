import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { BudgetVsSpendingDataPoint } from '../types';
import { formatRupiah } from '@/lib/currency';

interface BudgetVsSpendingChartWidgetProps {
  data: BudgetVsSpendingDataPoint[];
  averageSpending: number; // in whole Rupiah
}

export const BudgetVsSpendingChartWidget: React.FC<BudgetVsSpendingChartWidgetProps> = ({
  data,
  averageSpending,
}) => {
  const [viewInterval, setViewInterval] = useState<'monthly' | 'quarterly'>('monthly');

  const displayData = React.useMemo(() => {
    if (viewInterval === 'monthly') return data;

    const quartersMap = new Map<
      string,
      { label: string; budget: number; spent: number; count: number }
    >();

    data.forEach((d) => {
      const [yearStr, monthStr] = d.monthKey.split('-');
      const m = parseInt(monthStr, 10);
      const q = Math.ceil(m / 3);
      const qKey = `${yearStr}-Q${q}`;
      const qLabel = `Q${q} ${yearStr}`;

      const curr = quartersMap.get(qKey) || {
        label: qLabel,
        budget: 0,
        spent: 0,
        count: 0,
      };
      curr.budget += d.budgetAmount;
      curr.spent += d.spentAmount;
      curr.count += 1;
      quartersMap.set(qKey, curr);
    });

    return Array.from(quartersMap.entries()).map(([k, v]) => ({
      monthKey: k,
      label: v.label,
      budgetAmount: v.budget,
      spentAmount: v.spent,
      averageSpending: averageSpending * (v.count || 1),
      usagePercentage: v.budget > 0 ? Math.round((v.spent / v.budget) * 100) : 0,
      isOverBudget: v.spent > v.budget,
    }));
  }, [data, viewInterval, averageSpending]);

  const maxVal = Math.max(
    ...displayData.map((d) => Math.max(d.budgetAmount, d.spentAmount)),
    10000000
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 sm:mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
            Budget vs Spending History
          </h3>
          <p className="text-[11px] text-[#869288] mt-0.5">
            Compare planned budget against actual spending across each month
          </p>
        </div>

        <select
          value={viewInterval}
          onChange={(e) => setViewInterval(e.target.value as 'monthly' | 'quarterly')}
          aria-label="Select interval"
          className="self-start sm:self-auto h-8 px-2.5 py-1 rounded-lg border border-[#E2E6DF] bg-white text-[12px] font-semibold text-[#172019] focus:outline-none focus:border-[#529E42] cursor-pointer shrink-0 shadow-2xs"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>

      {/* Chart Canvas */}
      <div className="h-[210px] sm:h-[260px] md:h-[280px] w-full">
        {displayData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#869288]">
            No spending data available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayData}
              margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F0F3EE"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#E7EBE4' }}
                tick={{ fontSize: 10, fill: '#869288' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#869288' }}
                width={36}
                domain={[0, Math.ceil((maxVal * 1.15) / 1000000) * 1000000]}
                tickFormatter={(val) => {
                  if (val === 0) return '0';
                  if (val >= 1000000) {
                    const m = val / 1000000;
                    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
                  }
                  if (val >= 1000) {
                    return `${Math.round(val / 1000)}k`;
                  }
                  return String(val);
                }}
              />
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 50, outline: 'none' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as BudgetVsSpendingDataPoint;
                  return (
                    <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-xl shadow-xl border border-[#E2E6DF] text-xs space-y-1.5 min-w-[150px]">
                      <p className="font-bold text-[#172019]">{item.label}</p>
                      <div className="flex items-center justify-between gap-3 text-[#529E42]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#B8E986] inline-block" />
                          <span>Budget:</span>
                        </span>
                        <span className="font-extrabold">
                          {formatRupiah(item.budgetAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[#F97316]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#FB923C] inline-block" />
                          <span>Spent:</span>
                        </span>
                        <span className="font-extrabold">
                          {formatRupiah(item.spentAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[#64748B] pt-1 border-t border-[#F0F3EE]">
                        <span>Usage:</span>
                        <span
                          className={`font-extrabold px-1.5 py-0.5 rounded text-[10px] ${
                            item.usagePercentage > 100
                              ? 'bg-[#FEE2E2] text-[#991B1B]'
                              : item.usagePercentage >= 80
                              ? 'bg-[#FEF9C3] text-[#854D0E]'
                              : 'bg-[#EDF8E8] text-[#2C6E20]'
                          }`}
                        >
                          {item.usagePercentage}%
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              {averageSpending > 0 && (
                <ReferenceLine
                  y={averageSpending}
                  stroke="#64748B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}
              <Bar
                dataKey="budgetAmount"
                name="Budget Amount"
                fill="#B8E986"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="spentAmount"
                name="Spent Amount"
                fill="#FB923C"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-2.5 sm:mt-3 text-xs text-[#6D776F]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-3 h-3 rounded-xs bg-[#B8E986] inline-block shrink-0" />
          <span>Budget Amount</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-3 h-3 rounded-xs bg-[#FB923C] inline-block shrink-0" />
          <span>Spent Amount</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-[#64748B] inline-block shrink-0" />
          <span>Average Spending</span>
        </div>
      </div>
    </div>
  );
};
