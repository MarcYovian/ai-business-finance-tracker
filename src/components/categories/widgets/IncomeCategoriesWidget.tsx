import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

interface IncomeCategoriesWidgetProps {
  total: number;
  parents: number;
  subcategories: number;
}

export const IncomeCategoriesWidget: React.FC<IncomeCategoriesWidgetProps> = ({
  total,
  parents,
  subcategories,
}) => {
  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs hover:shadow-sm transition-shadow">
      <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 sm:gap-3.5">
        {/* Left Icon Container - Blue theme */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          <span className="text-[11px] sm:text-[12px] font-medium text-[#737E75] block leading-tight">
            Income Categories
          </span>
          <div className="text-[20px] sm:text-[24px] font-bold text-[#161F18] leading-tight my-0.5">
            {total}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#8B968D] block leading-tight truncate">
            {parents} parent • {subcategories} subcategories
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
