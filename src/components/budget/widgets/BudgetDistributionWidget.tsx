import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryDistributionItem } from '../types';
import { formatCurrency } from '@/lib/currency';

interface BudgetDistributionWidgetProps {
  distribution: CategoryDistributionItem[];
  totalSpent: number; // in cents
  totalBudget: number; // in cents
  spentPercentage: number;
}

export const BudgetDistributionWidget: React.FC<BudgetDistributionWidgetProps> = ({
  distribution,
  totalSpent,
  totalBudget,
  spentPercentage,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeCategory = activeIndex !== null && distribution[activeIndex]
    ? distribution[activeIndex]
    : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-4 sm:p-5 shadow-2xs space-y-4">
      <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
        Budget Distribution
      </h3>

      {distribution.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-[#869288]">
          No spending data available for distribution.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4">
          {/* Donut Chart with Center Text */}
          <div className="relative w-[170px] h-[170px] sm:w-[190px] sm:h-[190px] shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  allowEscapeViewBox={{ x: true, y: true }}
                  offset={14}
                  wrapperStyle={{ zIndex: 9999, outline: 'none' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as CategoryDistributionItem;

                    return (
                      <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-[#E2E6DF] text-xs pointer-events-none min-w-[150px] space-y-1.5 transition-all">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-bold text-[#172019] truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#F0F3EE]">
                          <span className="text-[11px] text-[#6D776F]">Spent</span>
                          <span className="font-extrabold text-[#172019]">
                            {formatCurrency(item.amount)}
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
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={distribution}
                  dataKey="percentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={76}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {distribution.map((entry, index) => {
                    const isHovered = activeIndex === index;
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

            {/* Center Summary Label (Dynamic on Hover) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 transition-all">
              {activeCategory ? (
                <>
                  <span
                    className="text-[11px] font-bold truncate max-w-[100px] block leading-tight"
                    style={{ color: activeCategory.color }}
                  >
                    {activeCategory.name}
                  </span>
                  <span className="text-[13px] font-extrabold text-[#172019] leading-tight mt-0.5">
                    {formatCurrency(activeCategory.amount)}
                  </span>
                  <span className="text-[11px] font-bold text-[#6D776F] leading-tight mt-0.5">
                    {activeCategory.percentage}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[12px] font-extrabold text-[#172019] leading-tight">
                    {formatCurrency(totalSpent)}
                  </span>
                  <span className="text-[9px] text-[#869288] leading-tight mt-0.5">
                    of {formatCurrency(totalBudget)}
                  </span>
                  <span className="text-[12px] font-bold text-[#172019] leading-tight mt-0.5">
                    {spentPercentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Category Distribution Legend List */}
          <div className="flex-1 w-full space-y-1 min-w-0">
            {distribution.map((item, idx) => {
              const isHovered = activeIndex === idx;

              return (
                <div
                  key={item.categoryId}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg transition-all cursor-pointer ${
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
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-[#172019] shrink-0 ml-2">
                    {item.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
