import React, { useEffect, useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Category, BudgetDetail } from '@/types/finance';
import { getCategoryIcon } from '../constants';
import { formatCurrency, formatCurrencyForInput } from '@/lib/currency';
import { ChevronDown, ChevronRight, CornerDownRight, RotateCcw, Sparkles } from 'lucide-react';
import { usePreviousBudget } from '@/hooks/useBudget';
import { toast } from '@/hooks/use-toast';

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonth: Date;
  categories: Category[];
  existingBudgetItems: BudgetDetail[];
  onSave: (items: { category_id: string; amount: number }[]) => Promise<void>;
  isSaving: boolean;
}

export const BudgetFormDialog: React.FC<BudgetFormDialogProps> = ({
  open,
  onOpenChange,
  currentMonth,
  categories,
  existingBudgetItems,
  onSave,
  isSaving,
}) => {
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, string>>({});
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const { data: previousBudget, isLoading: isLoadingPrevious } = usePreviousBudget(currentMonth);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const parentCategories = expenseCategories.filter((c) => !c.parentId);

  useEffect(() => {
    if (open) {
      const initialAmounts: Record<string, string> = {};
      const itemsMap = new Map(
        existingBudgetItems.map((i) => [i.category_id, i.amount])
      );

      // Populate both parent and child categories
      expenseCategories.forEach((cat) => {
        const existingCents = itemsMap.get(cat.id);
        initialAmounts[cat.id] = existingCents
          ? String(Math.round(existingCents / 100))
          : '0';
      });

      setBudgetAmounts(initialAmounts);

      // Expand parents that already have budgeted children
      const initialExpanded: Record<string, boolean> = {};
      parentCategories.forEach((parent) => {
        const hasBudgetedChild = expenseCategories.some(
          (c) => c.parentId === parent.id && (itemsMap.get(c.id) || 0) > 0
        );
        if (hasBudgetedChild) {
          initialExpanded[parent.id] = true;
        }
      });
      setExpandedParents(initialExpanded);
    }
  }, [open, categories, existingBudgetItems]);

  const toggleExpand = (parentId: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  const handleAmountChange = (categoryId: string, value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setBudgetAmounts((prev) => ({ ...prev, [categoryId]: numericValue }));
  };

  // If subcategory budget changes, ensure parent reflects at least the sum if desired
  const handleChildAmountChange = (parentId: string, childId: string, value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setBudgetAmounts((prev) => {
      const updated = { ...prev, [childId]: numericValue };

      // Calculate sum of all children for this parent
      const childCategories = expenseCategories.filter((c) => c.parentId === parentId);
      const childSum = childCategories.reduce(
        (sum, ch) => sum + (parseInt(updated[ch.id] || '0', 10) || 0),
        0
      );

      const currentParentVal = parseInt(prev[parentId] || '0', 10) || 0;
      // If current parent is 0 or less than children sum, auto-expand parent budget
      if (currentParentVal < childSum) {
        updated[parentId] = String(childSum);
      }

      return updated;
    });
  };

  // Calculate total budget (sum of parent budgets, or sum of its children if children > parent)
  const calculatedTotal = parentCategories.reduce((sum, parent) => {
    const parentVal = parseInt(budgetAmounts[parent.id] || '0', 10) || 0;
    const childCategories = expenseCategories.filter((c) => c.parentId === parent.id);
    const childSum = childCategories.reduce(
      (cSum, ch) => cSum + (parseInt(budgetAmounts[ch.id] || '0', 10) || 0),
      0
    );
    return sum + Math.max(parentVal, childSum);
  }, 0);

  const handleCopyPreviousMonth = () => {
    if (!previousBudget || previousBudget.items.length === 0) {
      toast({
        title: 'No Previous Budget Found',
        description: 'There is no budget record available from previous months.',
        variant: 'destructive',
      });
      return;
    }

    const newAmounts: Record<string, string> = { ...budgetAmounts };
    const newlyExpanded: Record<string, boolean> = { ...expandedParents };

    let copiedCount = 0;
    previousBudget.items.forEach((item) => {
      newAmounts[item.category_id] = String(item.amount);
      copiedCount++;

      // If this item is a child, expand its parent
      const cat = expenseCategories.find((c) => c.id === item.category_id);
      if (cat?.parentId) {
        newlyExpanded[cat.parentId] = true;
      }
    });

    setBudgetAmounts(newAmounts);
    setExpandedParents(newlyExpanded);

    toast({
      title: 'Budget Copied',
      description: `Applied ${copiedCount} category limits from ${previousBudget.monthLabel}.`,
    });
  };

  const handleSubmit = async () => {
    // Collect all items (both parents and children) that have amount > 0
    const items = Object.entries(budgetAmounts)
      .map(([category_id, amountStr]) => ({
        category_id,
        amount: parseInt(amountStr, 10) || 0,
      }))
      .filter((item) => item.amount > 0);

    await onSave(items);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] sm:w-full rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold text-[#172019]">
            {existingBudgetItems.length > 0 ? 'Edit Monthly Budget' : 'Create Monthly Budget'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#869288]">
            Set spending limits for parent categories, subcategories, or both for{' '}
            <span className="font-semibold text-[#172019]">
              {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Total Summary Header inside dialog */}
        <div className="bg-[#F8FAF7] border border-[#E7EBE4] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-medium text-[#6D776F] block">
              Total Budget Target
            </span>
            <span className="text-base sm:text-lg font-extrabold text-[#529E42]">
              {formatCurrency(calculatedTotal * 100)}
            </span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-[#869288] block">
              {Object.values(budgetAmounts).filter((v) => parseInt(v, 10) > 0).length} items allocated
            </span>
            <span className="text-[10px] text-[#6D776F]">
              Envelope model: subcategories fit within parent limit
            </span>
          </div>
        </div>

        {/* Quick-copy banner when creating a new budget and previous budget exists */}
        {existingBudgetItems.length === 0 && previousBudget && previousBudget.items.length > 0 && (
          <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-xs text-[#166534] min-w-0">
                Quick-fill from <span className="font-bold">{previousBudget.monthLabel}</span> ({previousBudget.items.length} categories).
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleCopyPreviousMonth}
              className="h-7 px-3 rounded-lg bg-[#529E42] hover:bg-[#438335] text-white text-xs font-semibold shrink-0 gap-1.5 shadow-2xs"
            >
              <RotateCcw className="h-3 w-3" />
              Apply
            </Button>
          </div>
        )}

        {/* Categories Section Toolbar */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-xs font-bold text-[#172019]">
            Category Limits
          </span>
          {previousBudget && previousBudget.items.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPreviousMonth}
              disabled={isLoadingPrevious}
              className="h-7 px-2.5 rounded-lg border-[#E2E6DF] text-[#172019] hover:bg-[#F4F6F2] text-[11px] font-semibold gap-1.5 shadow-2xs"
              title={`Copy budget limits from ${previousBudget.monthLabel}`}
            >
              <RotateCcw className="h-3 w-3 text-[#529E42]" />
              Copy from {previousBudget.monthLabel}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[52vh] pr-4">
          <div className="space-y-3 py-2">
            {parentCategories.length === 0 ? (
              <p className="text-xs text-[#869288] py-4 text-center">
                No expense categories found.
              </p>
            ) : (
              parentCategories.map((parent) => {
                const IconComponent = getCategoryIcon(parent.icon);
                const children = expenseCategories.filter((c) => c.parentId === parent.id);
                const hasChildren = children.length > 0;
                const isExpanded = !!expandedParents[parent.id];

                const parentVal = parseInt(budgetAmounts[parent.id] || '0', 10) || 0;
                const childrenSum = children.reduce(
                  (sum, ch) => sum + (parseInt(budgetAmounts[ch.id] || '0', 10) || 0),
                  0
                );

                return (
                  <div
                    key={parent.id}
                    className="border border-[#EDF1EB] rounded-xl p-2.5 bg-white space-y-2 hover:border-[#DCE2D8] transition-colors"
                  >
                    {/* Parent Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(parent.id)}
                            className="p-1 rounded-lg text-[#869288] hover:text-[#172019] hover:bg-[#F4F6F2] transition-colors"
                            title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-6" />
                        )}

                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${parent.color || '#529E42'}18`,
                            color: parent.color || '#529E42',
                          }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <label
                            htmlFor={`budget-${parent.id}`}
                            className="text-xs font-bold text-[#172019] truncate cursor-pointer block"
                          >
                            {parent.name}
                          </label>
                          {hasChildren && (
                            <span className="text-[10px] text-[#869288] block">
                              {children.length} subcategories
                              {childrenSum > 0 ? (
                                <>
                                  {' • '}
                                  <span className="text-[#529E42] font-semibold">
                                    {formatCurrency(childrenSum * 100)}
                                  </span>{' '}
                                  allocated
                                  {parentVal > childrenSum && (
                                    <span>
                                      {' '}({formatCurrency((parentVal - childrenSum) * 100)} unallocated)
                                    </span>
                                  )}
                                </>
                              ) : null}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative shrink-0">
                        <span className="absolute inset-y-0 left-2.5 flex items-center text-xs text-[#869288] font-medium pointer-events-none">
                          Rp
                        </span>
                        <Input
                          id={`budget-${parent.id}`}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className="w-28 xs:w-32 sm:w-36 text-right pl-7 sm:pl-8 pr-2.5 sm:pr-3 h-8 text-xs font-bold rounded-lg border-[#E2E6DF]"
                          value={formatCurrencyForInput(budgetAmounts[parent.id] || '0')}
                          onChange={(e) => handleAmountChange(parent.id, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Collapsible Children Subcategories */}
                    {hasChildren && isExpanded && (
                      <div className="pl-4 sm:pl-8 pt-2 pb-1 border-t border-[#F4F6F2] space-y-2">
                        {children.map((child) => {
                          const ChildIcon = getCategoryIcon(child.icon || parent.icon);

                          return (
                            <div
                              key={child.id}
                              className="flex items-center justify-between gap-2 sm:gap-3 py-1 px-2 rounded-lg bg-[#FAFBF9] hover:bg-[#F2F5F0] transition-colors"
                            >
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <CornerDownRight className="h-3.5 w-3.5 text-[#9AA59C] shrink-0" />
                                <div
                                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                  style={{
                                    backgroundColor: `${child.color || parent.color || '#529E42'}18`,
                                    color: child.color || parent.color || '#529E42',
                                  }}
                                >
                                  <ChildIcon className="h-3 w-3" />
                                </div>
                                <span className="text-xs font-medium text-[#556057] truncate">
                                  {child.name}
                                </span>
                              </div>

                              <div className="relative shrink-0">
                                <span className="absolute inset-y-0 left-2 flex items-center text-[11px] text-[#869288] font-medium pointer-events-none">
                                  Rp
                                </span>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0"
                                  className="w-24 xs:w-28 sm:w-32 text-right pl-6 sm:pl-7 pr-2 sm:pr-2.5 h-7 text-xs font-medium rounded-lg border-[#E2E6DF] bg-white"
                                  value={formatCurrencyForInput(budgetAmounts[child.id] || '0')}
                                  onChange={(e) =>
                                    handleChildAmountChange(parent.id, child.id, e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

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
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-xl bg-[#529E42] hover:bg-[#438335] text-white text-xs font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save Budget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
