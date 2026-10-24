import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface RemainingBudgetWidgetProps {
  amount: number; // in cents
  percentage: number;
}

export const RemainingBudgetWidget: React.FC<RemainingBudgetWidgetProps> = ({
  amount,
  percentage,
}) => {
  const isDeficit = amount < 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs transition-all hover:border-[#D5DCD0]">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${
        isDeficit ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#E8F8EE] text-[#1B8044]'
      }`}>
        <ClipboardCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] sm:text-[12px] font-medium text-[#6D776F] block">
          Remaining
        </span>
        <span className={`text-lg xs:text-xl sm:text-2xl font-extrabold tracking-tight block truncate mt-0.5 ${
          isDeficit ? 'text-[#DE4436]' : 'text-[#172019]'
        }`}>
          {formatCurrency(amount)}
        </span>
        <span className="text-[10px] sm:text-[11px] text-[#869288] block truncate mt-0.5">
          {isDeficit ? 'Over budget' : `${percentage}% left`}
        </span>
      </div>
    </div>
  );
};
