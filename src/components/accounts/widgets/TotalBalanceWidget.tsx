import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface TotalBalanceWidgetProps {
  totalBalance: number; // in cents
  percentageChange: number;
}

export const TotalBalanceWidget: React.FC<TotalBalanceWidgetProps> = ({
  totalBalance,
  percentageChange,
}) => {
  const isPositive = percentageChange >= 0;

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex items-center gap-3.5">
        {/* Left Icon Container */}
        <div className="w-11 h-11 rounded-xl bg-[#EDF8E8] text-[#529E42] flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5" />
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium text-[#737E75] block leading-tight">
            Total Balance
          </span>
          <div className="text-[19px] sm:text-[21px] font-bold text-[#161F18] leading-tight my-0.5 truncate">
            {formatCurrency(totalBalance)}
          </div>
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-0.5 font-medium leading-none">
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 shrink-0 text-[#529E42]" />
              ) : (
                <ArrowDownRight className="w-3 h-3 shrink-0 text-[#DE4436]" />
              )}
              <span className={isPositive ? 'text-[#529E42]' : 'text-[#DE4436]'}>
                {Math.abs(percentageChange)}%
              </span>
              <span className="text-[#8B968D] font-normal ml-0.5">from last month</span>
            </div>

            {/* Sparkline curve */}
            <div className="w-12 h-4 shrink-0">
              <svg viewBox="0 0 48 16" className="w-full h-full overflow-visible">
                <path
                  d="M 2 12 Q 14 14, 24 8 T 46 3"
                  fill="none"
                  stroke={isPositive ? '#529E42' : '#DE4436'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
