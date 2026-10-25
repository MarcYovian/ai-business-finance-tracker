import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { BalanceDistributionItem } from '../types';
import { formatCurrency } from '@/lib/currency';

interface BalanceDistributionWidgetProps {
  distribution: BalanceDistributionItem[];
  totalBalance: number; // in cents
}

export const BalanceDistributionWidget: React.FC<BalanceDistributionWidgetProps> = ({
  distribution,
  totalBalance,
}) => {
  const [activeType, setActiveType] = useState<string | null>(null);

  // Filter for pie rendering: only items with positive value for slices
  const chartData = useMemo(() => {
    return distribution
      .filter((item) => item.total > 0)
      .map((item) => ({
        ...item,
        name: item.label,
        value: item.total,
      }));
  }, [distribution]);

  const finalChartData =
    chartData.length > 0 ? chartData : [{ name: 'Empty', value: 1, color: '#E2E8F0', type: 'empty' as any, label: 'Empty', total: 0, percentage: 0 }];

  const activeItem = activeType
    ? distribution.find((d) => d.type === activeType)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-[#EDF1EB] p-4 sm:p-5 shadow-xs space-y-4">
      <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
        Balance Distribution
      </h3>

      {distribution.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-[#869288]">
          No balance data available for distribution.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Donut Chart with Dynamic Center Text (matching Budget Distribution) */}
          <div className="relative w-[170px] h-[170px] sm:w-[185px] sm:h-[185px] shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  allowEscapeViewBox={{ x: true, y: true }}
                  offset={14}
                  wrapperStyle={{ zIndex: 9999, outline: 'none' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as BalanceDistributionItem;
                    if (item.type === ('empty' as any)) return null;

                    return (
                      <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-[#E2E6DF] text-xs pointer-events-none min-w-[150px] space-y-1.5 transition-all">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-bold text-[#172019] truncate">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#F0F3EE]">
                          <span className="text-[11px] text-[#6D776F]">Balance</span>
                          <span className="font-extrabold text-[#172019]">
                            {item.total < 0
                              ? `- ${formatCurrency(Math.abs(item.total))}`
                              : formatCurrency(item.total)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-[#6D776F]">Share</span>
                          <span
                            className="font-bold text-[11px] px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${item.color}20`,
                              color: item.color,
                            }}
                          >
                            {item.total < 0 ? `-${Math.abs(item.percentage)}%` : `${item.percentage}%`}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={finalChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={76}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                  onMouseEnter={(entry: any) => {
                    if (entry && entry.type && entry.type !== 'empty') {
                      setActiveType(entry.type);
                    }
                  }}
                  onMouseLeave={() => setActiveType(null)}
                >
                  {finalChartData.map((entry, index) => {
                    const isHovered = activeType === entry.type;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: 'center center',
                          filter: isHovered ? 'brightness(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.15))' : 'none',
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary Label (Dynamic on Hover, identical to Budget Distribution) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-3 transition-all">
              {activeItem ? (
                <>
                  <span
                    className="text-[11px] font-bold truncate max-w-[100px] block leading-tight"
                    style={{ color: activeItem.color }}
                  >
                    {activeItem.label}
                  </span>
                  <span className="text-[13px] font-extrabold text-[#172019] leading-tight mt-0.5 truncate max-w-[110px]">
                    {activeItem.total < 0
                      ? `- ${formatCurrency(Math.abs(activeItem.total))}`
                      : formatCurrency(activeItem.total)}
                  </span>
                  <span className="text-[11px] font-bold text-[#6D776F] leading-tight mt-0.5">
                    {activeItem.total < 0 ? `-${Math.abs(activeItem.percentage)}%` : `${activeItem.percentage}%`}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[12px] sm:text-[13px] font-extrabold text-[#172019] leading-tight truncate max-w-[110px]">
                    {formatCurrency(totalBalance)}
                  </span>
                  <span className="text-[9px] text-[#869288] leading-tight mt-0.5">
                    Total Balance
                  </span>
                  <span className="text-[11px] font-bold text-[#6D776F] leading-tight mt-0.5">
                    100%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Type Distribution Legend List with Interactive Hover State */}
          <div className="flex-1 w-full space-y-1.5 min-w-0">
            {distribution.map((item) => {
              const isHovered = activeType === item.type;

              return (
                <div
                  key={item.type}
                  onMouseEnter={() => setActiveType(item.type)}
                  onMouseLeave={() => setActiveType(null)}
                  className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-[#F4F6F2] font-semibold'
                      : 'hover:bg-[#F9FAF8]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${
                        isHovered ? 'scale-125' : ''
                      }`}
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={`truncate ${isHovered ? 'text-[#172019] font-bold' : 'text-[#556057] font-medium'}`}>
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[11px] text-[#869288] font-medium">
                      {item.total < 0
                        ? `- ${formatCurrency(Math.abs(item.total))}`
                        : formatCurrency(item.total)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                        isHovered
                          ? 'bg-[#172019] text-white'
                          : 'bg-[#F0F3EE] text-[#172019]'
                      }`}
                    >
                      {item.total < 0 ? `-${Math.abs(item.percentage)}%` : `${item.percentage}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
