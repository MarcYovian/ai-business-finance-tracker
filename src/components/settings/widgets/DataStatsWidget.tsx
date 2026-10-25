import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Receipt, WalletCards, Tags, PieChart, Database } from 'lucide-react';
import { useDataManagement } from '../hooks/useDataManagement';
import { useAuth } from '@/contexts/AuthContext';

export const DataStatsWidget: React.FC = () => {
  const { user } = useAuth();
  const { stats, isLoadingStats } = useDataManagement(user?.id);

  const items = [
    {
      label: 'Recorded Transactions',
      count: stats?.transactionsCount ?? 0,
      icon: Receipt,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Fund Accounts',
      count: stats?.accountsCount ?? 0,
      icon: WalletCards,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Custom Categories',
      count: stats?.categoriesCount ?? 0,
      icon: Tags,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Budget Plans',
      count: stats?.budgetsCount ?? 0,
      icon: PieChart,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-[#EDF8E8] text-[#2C6E20]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
              Data Storage Summary
            </CardTitle>
            <CardDescription className="text-xs text-[#737E75]">
              Overview of records currently saved in your database account.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="p-3.5 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9] flex flex-col justify-between gap-2"
              >
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-[#161F18]">
                    {isLoadingStats ? '...' : item.count}
                  </div>
                  <div className="text-[11px] text-[#737E75] line-clamp-1">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
