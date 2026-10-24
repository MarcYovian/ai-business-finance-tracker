import React from 'react';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface AverageBudgetWidgetProps {
  averageBudget: number; // in cents
}

export const AverageBudgetWidget: React.FC<AverageBudgetWidgetProps> = ({
  averageBudget,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs transition-all hover:border-[#D5DCD0]">
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#EDF8E8] text-[#529E42] flex items-center justify-center shrink-0">
        <BarChart3 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] sm:text-[12px] font-medium text-[#6D776F] block truncate">
          Average Budget
        </span>
        <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold text-[#172019] tracking-tight block truncate mt-0.5">
          {formatCurrency(averageBudget)}
        </span>
        <span className="text-[10px] sm:text-[11px] text-[#869288] block truncate mt-0.5">
          per month
        </span>
      </div>
    </div>
  );
};
