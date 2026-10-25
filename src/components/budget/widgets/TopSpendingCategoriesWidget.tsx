import React from 'react';
import { TopSpendingCategoryItem } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '@/lib/currency';

interface TopSpendingCategoriesWidgetProps {
  items: TopSpendingCategoryItem[];
  filterPeriod?: string;
  onFilterChange?: (period: string) => void;
}

export const TopSpendingCategoriesWidget: React.FC<TopSpendingCategoriesWidgetProps> = ({
  items,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
          Top Spending Categories
        </h3>
        <span className="text-[11px] font-semibold text-[#869288] bg-[#F6F7F5] px-2.5 py-1 rounded-lg border border-[#E2E6DF]">
          This Month
        </span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-[#869288] py-4 text-center">
            No spending recorded for any category yet.
          </p>
        ) : (
          items.map((item) => {
            const IconComponent = getCategoryIcon(item.icon);

            return (
              <div key={item.categoryId} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#869288] w-4 text-center shrink-0">
                  {item.rank}
                </span>

                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${item.color}18`,
                    color: item.color,
                  }}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#172019] truncate">
                      {item.name}
                    </span>
                    <span className="font-bold text-[#172019] shrink-0 ml-2">
                      {formatCurrency(item.spent)}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-[#EDF1EB] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(5, item.percentageOfMax))}%`,
                        backgroundColor: item.color || '#529E42',
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
