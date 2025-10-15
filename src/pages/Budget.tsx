import { BudgetDialog } from "@/components/BudgetDialog";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBudgetDetails, useBudgets } from "@/hooks/useBudget";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { BudgetDetail } from "@/types/finance";
import { ChevronLeft, ChevronRight, Target } from "lucide-react";
import { useMemo, useState } from "react";

const getProgressColor = (percentage: number): string => {
  if (percentage > 90) return "bg-red-500";
  if (percentage > 75) return "bg-yellow-500";
  return "bg-blue-500"; // Or your brand's primary color
};

const BudgetItemRow = ({ item }: { item: BudgetDetail }) => {
  const spent = item.spent || 0;
  const budgeted = item.amount || 0;
  const remaining = budgeted - spent;
  const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">{item.category_name}</span>
        <span className={cn("font-semibold", remaining < 0 && "text-red-500")}>
          {formatCurrency(remaining)} Remaining
        </span>
      </div>
      <Progress
        value={progress}
        indicatorClassName={getProgressColor(progress)}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatCurrency(spent)}</span>
        <span>Budgeted: {formatCurrency(budgeted)}</span>
      </div>
    </div>
  );
};

const BudgetPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setDialogOpen] = useState(false);

  const { data: budgets = [], isLoading: isLoadingBudgets } = useBudgets();

  const currentBudget = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return budgets.find((b) => {
      const startDate = new Date(b.start_date + "T00:00:00");
      return startDate.getFullYear() === year && startDate.getMonth() === month;
    });
  }, [currentMonth, budgets]);

  const { data: budgetDetails = [], isLoading: isLoadingDetails } =
    useBudgetDetails(currentBudget?.id);

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const totalBudgeted = useMemo(
    () => budgetDetails.reduce((sum, item) => sum + item.amount, 0),
    [budgetDetails]
  );
  const totalSpent = useMemo(
    () => budgetDetails.reduce((sum, item) => sum + item.spent, 0),
    [budgetDetails]
  );
  const totalProgress =
    totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Monthly Budget</h1>
            <p className="text-muted-foreground">
              Track your spending against your budget for the month.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMonthChange("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg w-40 text-center">
              {currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMonthChange("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Summary</CardTitle>
            <Button onClick={() => setDialogOpen(true)}>Edit Budget</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-xl">
                <span>Total Spent</span>
                <span>{formatCurrency(totalSpent)}</span>
              </div>
              <Progress
                value={totalProgress}
                indicatorClassName={getProgressColor(totalProgress)}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Remaining: {formatCurrency(totalBudgeted - totalSpent)}
                </span>
                <span className="font-medium">
                  Budget: {formatCurrency(totalBudgeted)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingBudgets || isLoadingDetails ? (
              <p>Loading budget details...</p>
            ) : budgetDetails.length > 0 ? (
              budgetDetails.map((item) => (
                <BudgetItemRow key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Budget Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't created a budget for this month yet.
                </p>
                <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                  Create Budget
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        currentMonth={currentMonth}
        existingBudgetItems={budgetDetails}
      />
    </Layout>
  );
};

export default BudgetPage;
