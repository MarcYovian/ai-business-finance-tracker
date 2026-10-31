'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useBudgetDetails, useCurrentBudget, useUpsertBudget, usePreviousBudget } from '@/hooks/useBudget';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import {
  TotalBudgetWidget,
  TotalSpentWidget,
  RemainingBudgetWidget,
  DailyAverageWidget,
  SpendingVsBudgetWidget,
  BudgetCategoriesWidget,
  BudgetDistributionWidget,
  TopSpendingCategoriesWidget,
  RecentTransactionsWidget,
  BudgetFormDialog,
  AddCategoryBudgetDialog,
  BudgetSkeleton,
  useMonthlyBudgetAnalytics,
  BudgetCategoryRow,
} from '@/components/budget';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function BudgetInner({ userId: propUserId }: { userId?: string }) {
  const { user } = useAuth();
  const userId = propUserId || user?.id || '';
  const searchParams = useSearchParams();
  const monthParam = searchParams.get('month');

  // Initialize month: if targetDate passed via location.state, use it; else default to current year/month
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (monthParam) {
      const d = new Date(monthParam);
      if (!isNaN(d.getTime())) return d;
    }
    // Default to November 2026 to show active data or current date
    const now = new Date();
    if (now.getFullYear() === 2026 && now.getMonth() === 9) {
      return new Date(2026, 10, 1); // November 2026
    }
    return new Date(2026, 10, 1);
  });

  // Dialog states
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  // Queries
  const { data: currentBudget, isLoading: isLoadingBudget } = useCurrentBudget(currentMonth);
  const { data: budgetDetails = [], isLoading: isLoadingDetails } = useBudgetDetails(currentBudget?.id);
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(userId);
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(userId, 'expense');
  const { data: previousBudget, isLoading: isLoadingPrevious } = usePreviousBudget(currentMonth);

  // Mutation
  const { mutateAsync: upsertBudget, isPending: isSaving } = useUpsertBudget();

  // Analytics Hook
  const analytics = useMonthlyBudgetAnalytics({
    currentMonth,
    currentBudget,
    budgetDetails,
    transactions,
    categories,
  });

  // Check if selected month is before the current real calendar month
  const now = new Date();
  const isPastMonth =
    currentMonth.getFullYear() < now.getFullYear() ||
    (currentMonth.getFullYear() === now.getFullYear() &&
      currentMonth.getMonth() < now.getMonth());

  // Handlers for month navigation
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const nextDate = new Date(prev);
      nextDate.setMonth(prev.getMonth() - 1);
      return nextDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const nextDate = new Date(prev);
      nextDate.setMonth(prev.getMonth() + 1);
      return nextDate;
    });
  };

  const handleSelectMonthYear = (monthIndex: number, yearNum: number) => {
    setCurrentMonth(new Date(yearNum, monthIndex, 1));
  };

  const handleSaveBudget = async (items: { category_id: string; amount: number }[]) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(Date.UTC(year, month, 1)).toISOString().split('T')[0];
    const endDate = new Date(Date.UTC(year, month + 1, 0)).toISOString().split('T')[0];
    const budgetName = `Budget for ${currentMonth.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    })}`;

    await upsertBudget({
      name: budgetName,
      start_date: startDate,
      end_date: endDate,
      items,
    });
  };

  const handleAddSingleCategory = async (categoryId: string, amount: number) => {
    // Merge with existing items
    const existingMap = new Map(
      budgetDetails.map((item) => [item.category_id, Math.round(item.amount / 100)])
    );
    existingMap.set(categoryId, amount);

    const items = Array.from(existingMap.entries()).map(([category_id, amt]) => ({
      category_id,
      amount: amt,
    }));

    await handleSaveBudget(items);
  };

  const handleQuickApplyPreviousBudget = async () => {
    if (!previousBudget || previousBudget.items.length === 0) return;
    await handleSaveBudget(previousBudget.items);
    toast({
      title: 'Budget Applied',
      description: `Successfully applied ${previousBudget.items.length} category limits from ${previousBudget.monthLabel}.`,
    });
  };

  const monthLabel = currentMonth.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const isLoading = isLoadingBudget || isLoadingDetails || isLoadingTransactions || isLoadingCategories;

  if (isLoading) {
    return (
      <>
        <BudgetSkeleton />
      </>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] mx-auto">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#161F18] tracking-tight">
              Monthly Budget
            </h1>
            <p className="text-xs sm:text-[13px] text-[#737E75] mt-0.5">
              Plan and track your spending to stay on target.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            {/* Month Navigator Controls */}
            <div className="flex items-center justify-between sm:justify-start gap-1 bg-white border border-[#E2E6DF] rounded-xl p-1 shadow-2xs w-full sm:w-auto shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-lg text-[#6D776F] hover:text-[#172019] hover:bg-[#F4F6F2]"
                title="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1 text-xs sm:text-[13px] font-semibold text-[#172019] hover:bg-[#F4F6F2] rounded-lg transition-colors cursor-pointer">
                    <CalendarIcon className="h-4 w-4 text-[#529E42]" />
                    <span>{monthLabel}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-56 p-3 rounded-2xl">
                  <div className="text-xs font-semibold text-[#6D776F] mb-2 px-1">
                    Select Month (2026)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                    ].map((mName, idx) => (
                      <button
                        key={mName}
                        onClick={() => handleSelectMonthYear(idx, 2026)}
                        className={`py-1.5 rounded-lg font-medium transition-colors ${
                          currentMonth.getMonth() === idx && currentMonth.getFullYear() === 2026
                            ? 'bg-[#529E42] text-white font-bold'
                            : 'hover:bg-[#F4F6F2] text-[#172019]'
                        }`}
                      >
                        {mName}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8 rounded-lg text-[#6D776F] hover:text-[#172019] hover:bg-[#F4F6F2]"
                title="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Create / Edit Budget CTA Button */}
            {(!isPastMonth || analytics.hasBudget) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                {!isPastMonth && !analytics.hasBudget && previousBudget && previousBudget.items.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleQuickApplyPreviousBudget}
                    disabled={isSaving || isLoadingPrevious}
                    className="w-full sm:w-auto h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border-[#E2E6DF] bg-white hover:bg-[#F6F7F5] text-[#172019] font-semibold text-xs sm:text-[13px] gap-1.5 shadow-2xs transition-colors truncate"
                    title={`Apply all budget limits from ${previousBudget.monthLabel}`}
                  >
                    <RotateCcw className="h-4 w-4 text-[#529E42] shrink-0" />
                    <span className="truncate">Use {previousBudget.monthLabel} Budget</span>
                  </Button>
                )}
                <Button
                  onClick={() => setBudgetFormOpen(true)}
                  className="w-full sm:w-auto h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-[#529E42] hover:bg-[#438335] text-white font-semibold text-xs sm:text-[13px] gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  {analytics.hasBudget ? 'Edit Budget' : 'Create Budget'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Top KPI Cards (Widgets 1-4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <TotalBudgetWidget
            amount={analytics.summary.totalBudget}
            monthLabel={monthLabel}
          />
          <TotalSpentWidget
            amount={analytics.summary.totalSpent}
            percentage={analytics.summary.spentPercentage}
          />
          <RemainingBudgetWidget
            amount={analytics.summary.remaining}
            percentage={analytics.summary.remainingPercentage}
          />
          <DailyAverageWidget
            averageSpent={analytics.summary.dailyAverageSpent}
            targetDaily={analytics.summary.dailyTarget}
          />
        </div>

        {/* Main Content 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* Left Column (Widgets 5 & 6) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5">
            {/* Widget 5: Spending vs Budget Chart */}
            <SpendingVsBudgetWidget trend={analytics.trend} />

            {/* Widget 6: Budget Categories Table */}
            <BudgetCategoriesWidget
              categories={analytics.categories}
              onAddCategoryClick={
                !isPastMonth || analytics.hasBudget
                  ? () => setAddCategoryOpen(true)
                  : undefined
              }
              onEditCategoryClick={() => setBudgetFormOpen(true)}
            />
          </div>

          {/* Right Column (Widgets 7, 8 & 9) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-5">
            {/* Widget 7: Budget Distribution Donut Chart */}
            <BudgetDistributionWidget
              distribution={analytics.distribution}
              totalSpent={analytics.summary.totalSpent}
              totalBudget={analytics.summary.totalBudget}
              spentPercentage={analytics.summary.spentPercentage}
            />

            {/* Widget 8: Top Spending Categories */}
            <TopSpendingCategoriesWidget
              items={analytics.topSpending}
            />

            {/* Widget 9: Recent Transactions List */}
            <RecentTransactionsWidget
              transactions={analytics.recentTransactions}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BudgetFormDialog
        open={budgetFormOpen}
        onOpenChange={setBudgetFormOpen}
        currentMonth={currentMonth}
        categories={categories}
        existingBudgetItems={budgetDetails}
        onSave={handleSaveBudget}
        isSaving={isSaving}
      />

      <AddCategoryBudgetDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        categories={categories}
        existingCategoryIds={budgetDetails.map((b) => b.category_id)}
        onAdd={handleAddSingleCategory}
        isSaving={isSaving}
      />
    </>
  );
}

export default function BudgetClient({ userId }: { userId?: string }) {
  return (
    <Suspense fallback={<div className="p-6"><BudgetSkeleton /></div>}>
      <BudgetInner userId={userId} />
    </Suspense>
  );
}
