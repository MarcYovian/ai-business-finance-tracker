import React from 'react';
import { DataStatsWidget } from '../widgets/DataStatsWidget';
import { QuickActionsWidget } from '../widgets/QuickActionsWidget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, HardDrive, FileSpreadsheet } from 'lucide-react';

export const DataManagementSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. Storage Statistics */}
      <DataStatsWidget />

      {/* 2. Quick Actions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <QuickActionsWidget />

        {/* Data Guidelines & Privacy Card */}
        <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden h-full flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 pt-6 px-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-lg bg-[#EDF8E8] text-[#2C6E20]">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
                    Data Security & Exports
                  </CardTitle>
                  <CardDescription className="text-xs text-[#737E75]">
                    Your financial records are strictly protected with Row-Level Security (RLS).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-1 space-y-3.5">
              <div className="p-3.5 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9] space-y-1.5">
                <div className="text-xs font-semibold text-[#161F18] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#2C6E20]" />
                  Zero Shared Tenancy
                </div>
                <p className="text-[11px] text-[#737E75] leading-relaxed">
                  Only your authenticated account has permissions to read, mutate, or export financial transactions and bank account ledgers.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9] space-y-1.5">
                <div className="text-xs font-semibold text-[#161F18] flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Portable Backups
                </div>
                <p className="text-[11px] text-[#737E75] leading-relaxed">
                  You can download full JSON snapshots at any time for offline archival or migrate transactions directly via standard CSV tables.
                </p>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};
