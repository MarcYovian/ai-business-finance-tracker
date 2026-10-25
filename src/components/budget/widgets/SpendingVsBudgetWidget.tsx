import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { DailySpendingTrendPoint } from '../types';
import { formatRupiah } from '@/lib/currency';

interface SpendingVsBudgetWidgetProps {
  trend: DailySpendingTrendPoint[];
}

export const SpendingVsBudgetWidget: React.FC<SpendingVsBudgetWidgetProps> = ({
  trend,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');

  const chartData = trend.map((t) => ({
    ...t,
    displaySpent: viewMode === 'cumulative' ? t.cumulativeSpent : t.spent,
    displayBudgetPlan: viewMode === 'cumulative' ? t.budgetPlan : t.dailyBudgetPlan,
  }));

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 sm:mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
            Spending vs Budget
          </h3>
          <p className="text-[11px] text-[#869288] mt-0.5">
            {viewMode === 'daily'
              ? 'Daily spending compared to average daily target limit'
              : 'Cumulative spending pacing compared to ideal monthly limit'}
          </p>
        </div>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'daily' | 'cumulative')}
          className="self-start sm:self-auto h-8 px-2.5 py-1 rounded-lg border border-[#E2E6DF] bg-white text-[12px] font-semibold text-[#172019] focus:outline-none focus:border-[#529E42] cursor-pointer shrink-0 shadow-2xs"
        >
          <option value="daily">Daily</option>
          <option value="cumulative">Cumulative</option>
        </select>
      </div>

      <div className="h-[230px] xs:h-[260px] sm:h-[280px] w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#869288]">
            No spending data available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
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
                interval={Math.max(1, Math.floor(chartData.length / 7))}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#869288' }}
                width={38}
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
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as DailySpendingTrendPoint & {
                    displaySpent: number;
                    displayBudgetPlan: number;
                  };
                  return (
                    <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-xl shadow-xl border border-[#E2E6DF] text-xs space-y-1.5 min-w-[160px]">
                      <p className="font-bold text-[#172019]">{data.label}</p>
                      <div className="flex items-center justify-between gap-3 text-[#529E42]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#B8E986] inline-block" />
                          <span>{viewMode === 'cumulative' ? 'Cumulative:' : 'Spent:'}</span>
                        </span>
                        <span className="font-extrabold">
                          {formatRupiah(data.displaySpent)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[#64748B]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 bg-[#64748B] inline-block" />
                          <span>{viewMode === 'cumulative' ? 'Pacing Plan:' : 'Daily Target:'}</span>
                        </span>
                        <span className="font-bold">
                          {formatRupiah(data.displayBudgetPlan)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="displaySpent"
                fill="#B8E986"
                radius={[4, 4, 0, 0]}
                maxBarSize={16}
              />
              <Line
                type="monotone"
                dataKey="displayBudgetPlan"
                stroke="#64748B"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-2.5 sm:mt-3 text-xs text-[#6D776F]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-xs bg-[#B8E986] inline-block" />
          <span>Spent</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-[#64748B] inline-block" />
          <span>Budget plan</span>
        </div>
      </div>
    </div>
  );
};
