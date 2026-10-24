import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Upload, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { useDataManagement } from '../hooks/useDataManagement';
import { useAuth } from '@/contexts/AuthContext';
import { ImportCsvDialog } from '../dialogs/ImportCsvDialog';
import { ResetDataConfirmDialog } from '../dialogs/ResetDataConfirmDialog';
import { toast } from '@/hooks/use-toast';

export const QuickActionsWidget: React.FC = () => {
  const { user } = useAuth();
  const { exportData } = useDataManagement(user?.id);

  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportData('json');
      toast({
        title: 'Export Complete',
        description: 'Financial data backup has been downloaded.',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'Could not export data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Card className="rounded-2xl border-[#E2E6DF] bg-white shadow-sm overflow-hidden h-full flex flex-col justify-between">
        <div>
          <CardHeader className="pb-3 pt-6 px-6">
            <CardTitle className="text-base sm:text-lg font-bold text-[#161F18]">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs text-[#737E75]">
              Manage your data and account.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-1 space-y-2.5">
            {/* Export Data Item */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E2E6DF] hover:border-[#529E42] hover:bg-[#F9FAF8] transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EDF8E8] text-[#2C6E20] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#161F18] group-hover:text-[#2C6E20] transition-colors">
                    Export Data
                  </div>
                  <div className="text-[11px] text-[#737E75]">
                    Download your transactions, accounts, and budgets.
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#9AA59C] group-hover:text-[#2C6E20] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Import Transactions Item */}
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E2E6DF] hover:border-[#529E42] hover:bg-[#F9FAF8] transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EDF8E8] text-[#2C6E20] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#161F18] group-hover:text-[#2C6E20] transition-colors">
                    Import Transactions
                  </div>
                  <div className="text-[11px] text-[#737E75]">
                    Import from CSV file.
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#9AA59C] group-hover:text-[#2C6E20] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Reset App Data Item */}
            <button
              type="button"
              onClick={() => setIsResetOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-red-100 hover:border-red-300 hover:bg-red-50/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-red-700">
                    Reset App Data
                  </div>
                  <div className="text-[11px] text-[#737E75]">
                    Delete all your data. This action cannot be undone.
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#9AA59C] group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </CardContent>
        </div>
      </Card>

      <ImportCsvDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <ResetDataConfirmDialog open={isResetOpen} onOpenChange={setIsResetOpen} />
    </>
  );
};
