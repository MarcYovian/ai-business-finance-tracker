import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { budgetStorage } from '@/lib/storage';
import { useQuery } from '@tanstack/react-query';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import {
  AverageBudgetWidget,
  AverageSpentWidget,
  BestMonthWidget,
  HighestSpendingWidget,
  BudgetVsSpendingChartWidget,
  TotalBudgetUsageWidget,
  MonthlyBudgetHistoryTableWidget,
  SpendingByCategoryWidget,
  KeyInsightsWidget,
  BudgetHistorySkeleton,
  useBudgetHistoryAnalytics,
  TIME_RANGE_OPTIONS,
  BudgetHistoryTimeRange,
} from '@/components/budget-history';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const BudgetHistory: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const navigate = useNavigate();
  const location = useLocation();

  // Selected time range filter
  const [timeRange, setTimeRange] = useState<BudgetHistoryTimeRange>('12m');
  const [rangePickerOpen, setRangePickerOpen] = useState(false);

  // Anchor month cursor: default to November 2026 (matching Monthly Budget page and active mock dates)
  const [referenceMonth, setReferenceMonth] = useState<Date>(() => {
    if (location.state?.targetDate) {
      const d = new Date(location.state.targetDate);
      if (!isNaN(d.getTime())) return d;
    }
    const now = new Date();
    if (now.getFullYear() === 2026 && now.getMonth() === 9) {
      return new Date(2026, 10, 1); // November 2026
    }
    return new Date(2026, 10, 1);
  });

  // Queries
  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets', userId, 'history'],
    queryFn: () => (userId ? budgetStorage.getBudgetsWithItems(userId) : Promise.resolve([])),
    enabled: !!userId,
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(userId);
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(userId, 'expense');

  // Analytics Hook
  const analytics = useBudgetHistoryAnalytics({
    budgets,
    transactions,
    categories,
    timeRange,
    referenceMonth,
  });

  // Handlers for period stepping
  const handlePrevPeriod = () => {
    setReferenceMonth((prev) => {
      const next = new Date(prev);
      if (timeRange === '6m') next.setMonth(prev.getMonth() - 6);
      else if (timeRange === 'year') next.setFullYear(prev.getFullYear() - 1);
      else next.setMonth(prev.getMonth() - 12);
      return next;
    });
  };

  const handleNextPeriod = () => {
    setReferenceMonth((prev) => {
      const next = new Date(prev);
      if (timeRange === '6m') next.setMonth(prev.getMonth() + 6);
      else if (timeRange === 'year') next.setFullYear(prev.getFullYear() + 1);
      else next.setMonth(prev.getMonth() + 12);
      return next;
    });
  };

  const isLoading = isLoadingBudgets || isLoadingTransactions || isLoadingCategories;

  if (isLoading) {
    return (
      <Layout>
        <BudgetHistorySkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-3.5 sm:p-6 lg:p-7 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto">
        {/* Top Header Bar (Identical to Monthly Budget) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#161F18] tracking-tight">
              Budget History
            </h1>
            <p className="text-xs sm:text-[13px] text-[#737E75] mt-0.5">
              Plan and track your spending to stay on target.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Period Navigator Pill */}
            <div className="flex items-center justify-between sm:justify-start gap-1 bg-white border border-[#E2E6DF] rounded-xl p-1 shadow-2xs w-full sm:w-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevPeriod}
                className="h-8 w-8 rounded-lg text-[#6D776F] hover:text-[#172019] hover:bg-[#F4F6F2]"
                title="Previous period"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover open={rangePickerOpen} onOpenChange={setRangePickerOpen}>
                <PopoverTrigger asChild>
                  <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1 text-xs sm:text-[13px] font-semibold text-[#161F18] hover:bg-[#F4F6F2] rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                    <CalendarIcon className="h-4 w-4 text-[#529E42]" />
                    <span>{analytics.timeRangeLabel}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-52 p-2 rounded-2xl border border-[#E2E6DF] shadow-lg">
                  <div className="text-xs font-semibold text-[#6D776F] mb-1.5 px-2 py-1">
                    Select Time Range
                  </div>
                  <div className="space-y-1">
                    {TIME_RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTimeRange(opt.value);
                          setRangePickerOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          timeRange === opt.value
                            ? 'bg-[#529E42] text-white font-bold'
                            : 'hover:bg-[#F4F6F2] text-[#172019]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextPeriod}
                className="h-8 w-8 rounded-lg text-[#6D776F] hover:text-[#172019] hover:bg-[#F4F6F2]"
                title="Next period"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Switch to Active Monthly Budget CTA Button */}
            <Button
              onClick={() => navigate('/budget')}
              className="w-full sm:w-auto h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-[#529E42] hover:bg-[#438335] text-white font-semibold text-xs sm:text-[13px] gap-1.5 shadow-xs transition-colors shrink-0 whitespace-nowrap justify-center"
            >
              <CalendarIcon className="h-4 w-4" />
              Active Monthly Budget
            </Button>
          </div>
        </div>

        {/* 4 Top KPI Cards (Widgets 1-4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <AverageBudgetWidget averageBudget={analytics.summary.averageBudget} />
          <AverageSpentWidget
            averageSpent={analytics.summary.averageSpent}
            averageUsagePercentage={analytics.summary.averageUsagePercentage}
          />
          <BestMonthWidget bestMonth={analytics.summary.bestMonth} />
          <HighestSpendingWidget
            highestSpendingMonth={analytics.summary.highestSpendingMonth}
          />
        </div>

        {/* Main Content 2-Column Grid (12-column layout identical to Monthly Budget) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* Left Column (lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5">
            {/* Widget 5: Spending vs Budget Chart */}
            <BudgetVsSpendingChartWidget
              data={analytics.chartData}
              averageSpending={Math.round(analytics.summary.averageSpent / 100)}
            />

            {/* Widget 7: Monthly Budget History Table */}
            <MonthlyBudgetHistoryTableWidget
              monthlyHistory={analytics.monthlyHistory}
            />
          </div>

          {/* Right Column (lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-5) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-5">
            {/* Widget 6: Total Budget Usage Donut Chart */}
            <TotalBudgetUsageWidget
              averageUsagePercentage={analytics.summary.averageUsagePercentage}
              timeRangeLabel={analytics.timeRangeLabel}
              onTrackCount={analytics.summary.onTrackMonthsCount}
              nearLimitCount={analytics.summary.nearLimitMonthsCount}
              overBudgetCount={analytics.summary.overBudgetMonthsCount}
            />

            {/* Widget 8: Spending by Category */}
            <SpendingByCategoryWidget
              categorySpending={analytics.categorySpending}
              timeRangeLabel={analytics.timeRangeLabel}
            />

            {/* Widget 9: Key Insights */}
            <KeyInsightsWidget
              insights={analytics.insights}
              onViewDetails={() => navigate('/budget')}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BudgetHistory;
