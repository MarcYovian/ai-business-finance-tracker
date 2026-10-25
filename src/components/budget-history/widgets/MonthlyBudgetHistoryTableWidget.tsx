import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Calendar, Receipt } from 'lucide-react';
import { BudgetHistoryMonthItem } from '../types';
import { STATUS_CONFIG } from '../constants';
import { formatCurrency } from '@/lib/currency';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface MonthlyBudgetHistoryTableWidgetProps {
  monthlyHistory: BudgetHistoryMonthItem[];
}

export const MonthlyBudgetHistoryTableWidget: React.FC<
  MonthlyBudgetHistoryTableWidgetProps
> = ({ monthlyHistory }) => {
  const navigate = useNavigate();

  const handleNavigateToMonth = (monthKey: string) => {
    navigate('/budget', { state: { targetDate: `${monthKey}-01` } });
  };

  const handleNavigateToTransactions = () => {
    navigate('/transactions');
  };

  const getProgressBarColor = (progress: number) => {
    if (progress > 95) return 'bg-[#EF4444]'; // red
    if (progress > 80) return 'bg-[#F97316]'; // orange
    if (progress > 65) return 'bg-[#EAB308]'; // yellow
    return 'bg-[#529E42]'; // green
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 shadow-2xs space-y-3.5 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
            Monthly Budget History
          </h3>
          <p className="text-[11px] text-[#869288] mt-0.5">
            Past monthly budgets, spending progress, and track records
          </p>
        </div>
      </div>

      {/* Table (Responsive scroll with negative margin for full edge alignment) */}
      <div className="overflow-x-auto -mx-3.5 sm:-mx-5 px-3.5 sm:px-5">
        <table className="w-full text-left border-collapse min-w-[560px] sm:min-w-[620px]">
          <thead>
            <tr className="border-b border-[#EDF1EB] text-[10px] sm:text-[11px] font-semibold text-[#869288] uppercase tracking-wider">
              <th className="pb-3 pl-1">Month</th>
              <th className="pb-3 text-right">Budget Amount</th>
              <th className="pb-3 text-right">Spent</th>
              <th className="pb-3 pl-2">Progress</th>
              <th className="pb-3 text-right">Remaining</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 text-right pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F6F2] text-xs sm:text-[13px]">
            {monthlyHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-[#869288]">
                  No past budget records found for this period.
                </td>
              </tr>
            ) : (
              monthlyHistory.map((item) => {
                const statusStyle = STATUS_CONFIG[item.status];
                const progressBarColor = getProgressBarColor(item.usagePercentage);
                const isOverBudget = item.remainingAmount < 0;

                return (
                  <tr
                    key={item.monthKey}
                    className="hover:bg-[#F9FAF8] transition-colors group"
                  >
                    {/* Month */}
                    <td className="py-3 sm:py-3.5 pl-1 font-semibold text-[#161F18] whitespace-nowrap">
                      {item.monthLabel}
                    </td>

                    {/* Budget Amount */}
                    <td className="py-3 sm:py-3.5 text-right font-medium text-[#161F18] whitespace-nowrap">
                      {formatCurrency(item.budgetAmount)}
                    </td>

                    {/* Spent */}
                    <td className="py-3 sm:py-3.5 text-right font-medium text-[#161F18] whitespace-nowrap">
                      {formatCurrency(item.spentAmount)}
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3 sm:py-3.5 pl-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[11px] sm:text-xs text-[#161F18] w-7 sm:w-8">
                          {item.usagePercentage}%
                        </span>
                        <div className="w-16 sm:w-24 bg-[#F0F3EE] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                            style={{
                              width: `${Math.min(item.usagePercentage, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Remaining */}
                    <td className="py-3 sm:py-3.5 text-right font-semibold whitespace-nowrap">
                      {isOverBudget ? (
                        <span className="text-[#EF4444]">
                          - {formatCurrency(Math.abs(item.remainingAmount))}
                        </span>
                      ) : (
                        <span className="text-[#161F18]">
                          {formatCurrency(item.remainingAmount)}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 sm:py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold ${statusStyle.badgeBg} ${statusStyle.badgeText}`}
                      >
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* Action Menu */}
                    <td className="py-3 sm:py-3.5 text-right pr-1 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-[#869288] hover:text-[#172019] hover:bg-[#EDF1EB] rounded-lg"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl shadow-lg border border-[#E2E6DF]"
                        >
                          <DropdownMenuItem
                            onClick={() => handleNavigateToMonth(item.monthKey)}
                            className="cursor-pointer text-xs font-medium text-[#161F18] flex items-center gap-2 py-2"
                          >
                            <Calendar className="h-3.5 w-3.5 text-[#529E42]" />
                            View Monthly Budget
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleNavigateToTransactions}
                            className="cursor-pointer text-xs font-medium text-[#161F18] flex items-center gap-2 py-2"
                          >
                            <Receipt className="h-3.5 w-3.5 text-[#3B82F6]" />
                            View Transactions
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
