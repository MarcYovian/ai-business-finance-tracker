import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Category } from '@/types/finance';
import { formatCurrencyForInput } from '@/lib/currency';

interface AddCategoryBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  existingCategoryIds: string[];
  onAdd: (categoryId: string, amount: number) => Promise<void>;
  isSaving: boolean;
}

export const AddCategoryBudgetDialog: React.FC<AddCategoryBudgetDialogProps> = ({
  open,
  onOpenChange,
  categories,
  existingCategoryIds,
  onAdd,
  isSaving,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const parentCategories = expenseCategories.filter((c) => !c.parentId);

  // Group unbudgeted categories by parent
  const availableCategories = expenseCategories.filter(
    (c) => !existingCategoryIds.includes(c.id)
  );

  const handleSave = async () => {
    if (!selectedCategoryId) return;
    const amount = parseInt(amountInput.replace(/[^\d]/g, ''), 10) || 0;
    if (amount <= 0) return;

    await onAdd(selectedCategoryId, amount);
    setSelectedCategoryId('');
    setAmountInput('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold text-[#172019]">
            Add Category Budget
          </DialogTitle>
          <DialogDescription className="text-xs text-[#869288]">
            Select an unbudgeted parent category or subcategory and set its limit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172019]">
              Category
            </label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger className="h-9 rounded-xl border-[#E2E6DF] text-xs">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableCategories.length === 0 ? (
                  <div className="p-3 text-xs text-[#869288] text-center">
                    All categories have been budgeted.
                  </div>
                ) : (
                  parentCategories.map((parent) => {
                    const isParentAvailable = availableCategories.some((c) => c.id === parent.id);
                    const childCategories = availableCategories.filter((c) => c.parentId === parent.id);

                    if (!isParentAvailable && childCategories.length === 0) return null;

                    return (
                      <SelectGroup key={parent.id}>
                        <SelectLabel className="text-[11px] font-bold text-[#172019] px-2 pt-1.5">
                          {parent.name}
                        </SelectLabel>
                        {isParentAvailable && (
                          <SelectItem value={parent.id} className="text-xs font-semibold">
                            {parent.name} (Entire Category)
                          </SelectItem>
                        )}
                        {childCategories.map((child) => (
                          <SelectItem
                            key={child.id}
                            value={child.id}
                            className="text-xs pl-5 font-normal text-[#556057]"
                          >
                            ↳ {child.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172019]">
              Budget Amount
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-xs text-[#869288] font-medium pointer-events-none">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="pl-9 h-9 text-xs font-semibold rounded-xl border-[#E2E6DF]"
                value={formatCurrencyForInput(amountInput)}
                onChange={(e) => setAmountInput(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-[#EDF1EB]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="rounded-xl border-[#E2E6DF] text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !selectedCategoryId || !amountInput}
            className="rounded-xl bg-[#529E42] hover:bg-[#438335] text-white text-xs font-semibold"
          >
            {isSaving ? 'Saving...' : 'Add to Budget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
