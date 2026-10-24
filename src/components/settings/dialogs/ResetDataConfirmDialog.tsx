import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';
import { useDataManagement } from '../hooks/useDataManagement';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ResetDataConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResetDataConfirmDialog: React.FC<ResetDataConfirmDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { resetData, isResettingData } = useDataManagement(user?.id);

  const [confirmText, setConfirmText] = useState('');
  const [resetTransactions, setResetTransactions] = useState(true);
  const [resetBudgets, setResetBudgets] = useState(true);
  const [resetBalances, setResetBalances] = useState(true);
  const [resetGoals, setResetGoals] = useState(false);

  const handleReset = async () => {
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      toast({
        title: 'Confirmation Required',
        description: 'Please type RESET to confirm data deletion.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await resetData({
        resetTransactions,
        resetBudgets,
        resetGoals,
        resetBalances,
      });

      toast({
        title: 'App Data Reset Complete',
        description: 'Your selected financial data has been deleted.',
      });

      setConfirmText('');
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Reset Failed',
        description: err.message || 'Could not reset application data.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[460px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <AlertDialogTitle className="text-red-700">
                Reset Application Data
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action is permanent and cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-lg bg-red-50/70 border border-red-200 p-3 text-xs text-red-800 leading-relaxed">
            Deleting this data will remove all selected transaction history, budgets, or reset account balances back to zero.
          </div>

          <div className="space-y-2.5 text-sm">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select What to Reset:
            </Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={resetTransactions}
                  onCheckedChange={(c) => setResetTransactions(!!c)}
                />
                <span>Delete All Transactions & Transfers</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={resetBudgets}
                  onCheckedChange={(c) => setResetBudgets(!!c)}
                />
                <span>Delete All Budgets & Budget Allocations</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={resetBalances}
                  onCheckedChange={(c) => setResetBalances(!!c)}
                />
                <span>Reset Fund Source Balances to Rp 0</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={resetGoals}
                  onCheckedChange={(c) => setResetGoals(!!c)}
                />
                <span>Delete Financial Goals</span>
              </label>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="confirm-reset-text" className="text-xs font-medium">
              Type <span className="font-bold text-red-600 font-mono">RESET</span> to confirm:
            </Label>
            <Input
              id="confirm-reset-text"
              placeholder="RESET"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="border-red-300 focus-visible:ring-red-400 font-mono uppercase"
            />
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isResettingData}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReset}
            disabled={confirmText.trim().toUpperCase() !== 'RESET' || isResettingData}
          >
            {isResettingData ? 'Resetting...' : 'Yes, Delete Selected Data'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
