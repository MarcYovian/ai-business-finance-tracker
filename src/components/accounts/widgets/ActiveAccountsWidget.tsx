import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WalletCards } from 'lucide-react';

interface ActiveAccountsWidgetProps {
  activeCount: number;
  inactiveCount: number;
}

export const ActiveAccountsWidget: React.FC<ActiveAccountsWidgetProps> = ({
  activeCount,
  inactiveCount,
}) => {
  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex items-center gap-3.5">
        {/* Left Icon Container */}
        <div className="w-11 h-11 rounded-xl bg-[#E8F1FC] text-[#2563EB] flex items-center justify-center shrink-0">
          <WalletCards className="w-5 h-5" />
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium text-[#737E75] block leading-tight">
            Active Accounts
          </span>
          <div className="text-[19px] sm:text-[21px] font-bold text-[#161F18] leading-tight my-0.5 truncate">
            {activeCount}
          </div>
          <div className="text-[11px] text-[#8B968D] leading-none pt-0.5">
            {inactiveCount} {inactiveCount === 1 ? 'account' : 'accounts'} inactive
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
