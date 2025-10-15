import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useUpsertBudget } from "@/hooks/useBudget";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatCurrencyForInput } from "@/lib/currency";
import { BudgetDetail, Category } from "@/types/finance";
import { useEffect, useState } from "react";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonth: Date;
  existingBudgetItems: BudgetDetail[];
}

export const BudgetDialog = ({
  open,
  onOpenChange,
  currentMonth,
  existingBudgetItems,
}: BudgetDialogProps) => {
  const { user } = useAuth();
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories(user.id, "expense");
  const { mutate: upsertBudget, isLoading: isSaving } = useUpsertBudget();
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    if (open) {
      const initialAmounts: Record<string, string> = {};
      const itemsMap = new Map(
        existingBudgetItems.map((i) => [i.category_id, i.amount])
      );

      categories.forEach((cat) => {
        const existingAmountInCents = itemsMap.get(cat.id);
        initialAmounts[cat.id] = existingAmountInCents
          ? String(existingAmountInCents / 100)
          : "0";
      });
      setBudgetAmounts(initialAmounts);
    }
  }, [open, categories, existingBudgetItems]);

  const handleAmountChange = (categoryId: string, value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setBudgetAmounts((prev) => ({ ...prev, [categoryId]: numericValue }));
  };

  const handleSave = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const startDate = new Date(Date.UTC(year, month, 1))
      .toISOString()
      .split("T")[0];
    const endDate = new Date(Date.UTC(year, month + 1, 0))
      .toISOString()
      .split("T")[0];

    const budgetName = `Budget for ${currentMonth.toLocaleString("default", {
      month: "long",
      year: "numeric",
    })}`;

    const items = Object.entries(budgetAmounts)
      .map(([category_id, amountStr]) => ({
        category_id,
        amount: parseInt(amountStr, 10) || 0,
      }))
      .filter((item) => item.amount > 0);
    upsertBudget(
      { startDate, endDate, name: budgetName, items },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>
            Set your budget amounts for{" "}
            {currentMonth.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
            .
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-4 py-4">
            {isLoadingCategories ? (
              <p>Loading categories...</p>
            ) : (
              categories.map((category: Category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-4"
                >
                  <label
                    htmlFor={`budget-${category.id}`}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {category.name}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id={`budget-${category.id}`}
                      type="text"
                      inputMode="numeric"
                      className="w-40 text-right pl-8"
                      value={formatCurrencyForInput(
                        budgetAmounts[category.id] || "0"
                      )}
                      onChange={(e) =>
                        handleAmountChange(category.id, e.target.value)
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
