import React, { useState } from 'react';
import { BudgetHistoryCategorySpending } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '@/lib/currency';

interface SpendingByCategoryWidgetProps {
  categorySpending: BudgetHistoryCategorySpending[];
  timeRangeLabel: string;
}

export const SpendingByCategoryWidget: React.FC<SpendingByCategoryWidgetProps> = ({
  categorySpending,
  timeRangeLabel,
}) => {
  const [sortBy, setSortBy] = useState<'amount' | 'percentage'>('amount');

  const sortedCategories = React.useMemo(() => {
    return [...categorySpending].sort((a, b) => {
      if (sortBy === 'percentage') {
        return b.percentage - a.percentage;
      }
      return b.spentAmount - a.spentAmount;
    });
  }, [categorySpending, sortBy]);

  const maxSpent = sortedCategories.length > 0 ? sortedCategories[0].spentAmount : 1;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 shadow-2xs space-y-3.5 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
            Spending by Category
          </h3>
          <p className="text-[10px] sm:text-[11px] text-[#869288] mt-0.5 truncate max-w-[170px] sm:max-w-none">
            {timeRangeLabel}
          </p>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'amount' | 'percentage')}
          aria-label="Sort by"
          className="self-start sm:self-auto h-7 sm:h-8 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-[#E2E6DF] bg-white text-[11px] sm:text-[12px] font-semibold text-[#172019] focus:outline-none focus:border-[#529E42] cursor-pointer shrink-0 shadow-2xs"
        >
          <option value="amount">Amount</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>

      {/* List of categories */}
      <div className="space-y-2.5 sm:space-y-3">
        {sortedCategories.length === 0 ? (
          <p className="text-xs text-[#869288] py-4 text-center">
            No spending recorded for this period.
          </p>
        ) : (
          sortedCategories.slice(0, 6).map((item, idx) => {
            const IconComponent = getCategoryIcon(item.categoryIcon);
            const color = item.categoryColor || '#529E42';
            const percentageOfMax = Math.round((item.spentAmount / maxSpent) * 100);

            return (
              <div key={item.categoryId} className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-xs font-semibold text-[#869288] w-3.5 sm:w-4 text-center shrink-0">
                  {idx + 1}
                </span>

                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${color}18`,
                    color: color,
                  }}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#172019] truncate pr-2">
                      {item.categoryName}
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
                      <span className="text-[10px] sm:text-[11px] text-[#869288] font-medium">
                        {item.percentage}%
                      </span>
                      <span className="font-bold text-[#172019] text-xs">
                        {formatCurrency(item.spentAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-[#EDF1EB] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(5, percentageOfMax))}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
