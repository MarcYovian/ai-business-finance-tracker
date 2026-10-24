import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FundSource, FundType } from '@/types/finance';
import { ACCOUNT_TYPE_LABELS } from '../constants';

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: FundSource | null;
  onSubmit: (data: {
    name: string;
    balance: number; // in cents
    type: FundType;
    account_number?: string;
    account_holder_name?: string;
    is_active: boolean;
  }) => Promise<void>;
}

// Helper to format currency for input while preserving negative sign for credit cards/debt
const formatBalanceForInput = (value: number | string): string => {
  const str = String(value).trim();
  const isNegative = str.startsWith('-');
  const digits = str.replace(/[^\d]/g, '');
  if (!digits) return isNegative ? '-' : '';
  const formatted = new Intl.NumberFormat('id-ID').format(Number(digits));
  return isNegative ? `-${formatted}` : formatted;
};

export const AccountFormDialog: React.FC<AccountFormDialogProps> = ({
  open,
  onOpenChange,
  account,
  onSubmit,
}) => {
  const isEditing = !!account;

  const [name, setName] = useState('');
  const [type, setType] = useState<FundType>('bank');
  const [balanceInput, setBalanceInput] = useState('0');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setType(account.type || 'bank');
      // account.balance is in cents -> convert to whole rupiah
      const rupiah = Math.round(account.balance / 100);
      setBalanceInput(formatBalanceForInput(rupiah));
      setAccountNumber(account.account_number || '');
      setAccountHolderName(account.account_holder_name || '');
      setIsActive(account.is_active !== false);
    } else {
      setName('');
      setType('bank');
      setBalanceInput('0');
      setAccountNumber('');
      setAccountHolderName('');
      setIsActive(true);
    }
  }, [account, open]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setBalanceInput(formatBalanceForInput(raw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      // Support negative balance for credit card or loans
      const rawNum = balanceInput.trim();
      const isNegative = rawNum.startsWith('-');
      const cleanDigits = rawNum.replace(/[^\d]/g, '');
      const parsedRupiah = (Number(cleanDigits) || 0) * (isNegative ? -1 : 1);
      const balanceInCents = parsedRupiah * 100;

      await onSubmit({
        name: name.trim(),
        balance: balanceInCents,
        type,
        account_number: accountNumber.trim() || undefined,
        account_holder_name: accountHolderName.trim() || undefined,
        is_active: isActive,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save account:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#161F18]">
            {isEditing ? 'Edit Account' : 'Add New Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Account Name */}
          <div className="space-y-1.5">
            <Label htmlFor="account-name" className="text-xs font-semibold text-[#161F18]">
              Account Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="account-name"
              placeholder="e.g. BCA Main Account, GoPay, Cash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-[#EDF1EB] text-sm"
              required
            />
          </div>

          {/* Account Type */}
          <div className="space-y-1.5">
            <Label htmlFor="account-type" className="text-xs font-semibold text-[#161F18]">
              Account Type <span className="text-red-500">*</span>
            </Label>
            <Select value={type} onValueChange={(val) => setType(val as FundType)}>
              <SelectTrigger id="account-type" className="rounded-xl border-[#EDF1EB] text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {(Object.keys(ACCOUNT_TYPE_LABELS) as FundType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {ACCOUNT_TYPE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Initial / Current Balance - Formatted with Rp prefix like TransactionDialog */}
          <div className="space-y-1.5">
            <Label htmlFor="account-balance" className="text-xs font-semibold text-[#161F18]">
              {isEditing ? 'Current Balance' : 'Initial Balance'}
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#737E75]">
                Rp
              </span>
              <Input
                id="account-balance"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={balanceInput}
                onChange={handleBalanceChange}
                className="pl-11 pr-3 text-right font-bold text-sm text-[#161F18] rounded-xl border-[#EDF1EB] focus-visible:ring-1 focus-visible:ring-[#529E42]"
              />
            </div>
            <p className="text-[11px] text-[#8B968D]">
              Gunakan tanda minus (misal: -2.000.000) untuk kartu kredit atau saldo hutang.
            </p>
          </div>

          {/* Account Number or Handle */}
          <div className="space-y-1.5">
            <Label htmlFor="account-number" className="text-xs font-semibold text-[#161F18]">
              Account Number / Handle / Card Digits
            </Label>
            <Input
              id="account-number"
              placeholder="e.g. 1234 5678 9012, @username, or **** 7890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="rounded-xl border-[#EDF1EB] text-sm"
            />
          </div>

          {/* Account Holder Name */}
          <div className="space-y-1.5">
            <Label htmlFor="holder-name" className="text-xs font-semibold text-[#161F18]">
              Account Holder Name (Optional)
            </Label>
            <Input
              id="holder-name"
              placeholder="e.g. Marcellinus Yovian"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              className="rounded-xl border-[#EDF1EB] text-sm"
            />
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[#EDF1EB]">
            <div>
              <span className="text-xs font-semibold text-[#161F18] block">Active Account</span>
              <span className="text-[11px] text-[#8B968D] block">
                Include this account in total balances and transactions
              </span>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl text-xs bg-[#529E42] hover:bg-[#3E7A31] text-white"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
