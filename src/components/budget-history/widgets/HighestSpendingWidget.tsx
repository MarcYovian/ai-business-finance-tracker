import React from 'react';
import { TrendingDown } from 'lucide-react';

interface HighestSpendingWidgetProps {
  highestSpendingMonth: {
    monthLabel: string;
    usagePercentage: number;
    budgetAmount: number;
    spentAmount: number;
  } | null;
}

export const HighestSpendingWidget: React.FC<HighestSpendingWidgetProps> = ({
  highestSpendingMonth,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs transition-all hover:border-[#D5DCD0]">
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center shrink-0">
        <TrendingDown className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] sm:text-[12px] font-medium text-[#6D776F] block truncate">
          Highest Spending
        </span>
        <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold text-[#172019] tracking-tight block truncate mt-0.5">
          {highestSpendingMonth ? highestSpendingMonth.monthLabel : 'N/A'}
        </span>
        <span className="text-[10px] sm:text-[11px] text-[#869288] block truncate mt-0.5">
          {highestSpendingMonth
            ? `${highestSpendingMonth.usagePercentage}% of budget`
            : 'No past records'}
        </span>
      </div>
    </div>
  );
};
