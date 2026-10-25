import React, { useState } from 'react';
import { Plus, MoreHorizontal, Edit2, Trash2, ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';
import { BudgetCategoryRow } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BudgetCategoriesWidgetProps {
  categories: BudgetCategoryRow[];
  onAddCategoryClick?: () => void;
  onEditCategoryClick?: (row: BudgetCategoryRow) => void;
  onDeleteCategoryClick?: (row: BudgetCategoryRow) => void;
}

export const BudgetCategoriesWidget: React.FC<BudgetCategoriesWidgetProps> = ({
  categories,
  onAddCategoryClick,
  onEditCategoryClick,
  onDeleteCategoryClick,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (catId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const getProgressBarColor = (progress: number) => {
    if (progress > 95) return 'bg-[#EF4444]'; // red
    if (progress > 80) return 'bg-[#F97316]'; // orange
    if (progress > 65) return 'bg-[#EAB308]'; // yellow
    return 'bg-[#529E42]'; // green
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
            Budget Categories
          </h3>
          <p className="text-[11px] text-[#869288] mt-0.5">
            Click on categories with subcategories to expand and view granular details.
          </p>
        </div>
        {onAddCategoryClick && (
          <Button
            variant="outline"
            onClick={onAddCategoryClick}
            className="w-full sm:w-auto h-8 px-3 rounded-xl border-[#E2E6DF] text-[#172019] hover:bg-[#F6F7F5] font-semibold text-xs gap-1.5 shadow-2xs shrink-0"
          >
            <Plus className="h-3.5 w-3.5 text-[#529E42]" />
            Add Category Budget
          </Button>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
        <table className="w-full text-left border-collapse min-w-[580px] sm:min-w-[640px]">
          <thead>
            <tr className="border-b border-[#EDF1EB] text-[11px] font-semibold text-[#869288] uppercase tracking-wider">
              <th className="pb-3 pl-1">Category</th>
              <th className="pb-3">Budget Amount</th>
              <th className="pb-3">Spent</th>
              <th className="pb-3">Progress</th>
              <th className="pb-3">Remaining</th>
              <th className="pb-3 text-right pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F6F2] text-[13px]">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-[#869288]">
                  No budget categories found for this month.
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.categoryIcon);
                const progressBarColor = getProgressBarColor(cat.progress);
                const isOver = cat.remaining < 0;
                const hasChildren = cat.hasChildren && cat.children && cat.children.length > 0;
                const isExpanded = !!expandedRows[cat.id];

                return (
                  <React.Fragment key={cat.id}>
                    {/* Parent Category Row */}
                    <tr className="hover:bg-[#F9FAF8] transition-colors group">
                      <td className="py-3.5 pl-1">
                        <div className="flex items-center gap-2.5">
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleRow(cat.id)}
                              className="p-1 rounded-md text-[#869288] hover:text-[#172019] hover:bg-[#EDF1EB] transition-colors"
                              title={isExpanded ? 'Collapse' : 'Expand subcategories'}
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
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${cat.categoryColor}18`,
                              color: cat.categoryColor,
                            }}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>

                          <div>
                            <span className="font-bold text-[#172019] block">
                              {cat.categoryName}
                            </span>
                            {hasChildren && (
                              <span className="text-[10px] text-[#869288] block">
                                {cat.children!.length} subcategories
                                {cat.assignedToChildren > 0 && ` • ${formatCurrency(cat.assignedToChildren)} sub-allocated`}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 font-semibold text-[#172019]">
                        {formatCurrency(cat.budgetAmount)}
                      </td>

                      <td className="py-3.5 font-medium text-[#172019]">
                        {formatCurrency(cat.spent)}
                      </td>

                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[12px] font-semibold text-[#6D776F] w-9">
                            {cat.progress}%
                          </span>
                          <div className="w-24 sm:w-28 h-2 bg-[#EDF1EB] rounded-full overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                              style={{ width: `${Math.min(100, Math.max(0, cat.progress))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className={`py-3.5 font-semibold ${isOver ? 'text-[#DE4436]' : 'text-[#172019]'}`}>
                        {formatCurrency(cat.remaining)}
                      </td>

                      <td className="py-3.5 text-right pr-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-[#869288] hover:text-[#172019] hover:bg-[#EDF1EB]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {onEditCategoryClick && (
                              <DropdownMenuItem
                                onClick={() => onEditCategoryClick(cat)}
                                className="text-xs cursor-pointer gap-2"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit Budget
                              </DropdownMenuItem>
                            )}
                            {onDeleteCategoryClick && (
                              <DropdownMenuItem
                                onClick={() => onDeleteCategoryClick(cat)}
                                className="text-xs text-red-600 focus:text-red-600 cursor-pointer gap-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>

                    {/* Subcategories Rows (Rendered when expanded) */}
                    {hasChildren && isExpanded && (
                      cat.children!.map((child) => {
                        const ChildIcon = getCategoryIcon(child.categoryIcon);
                        const childProgressBarColor = getProgressBarColor(child.progress);
                        const isChildOver = child.remaining < 0;

                        return (
                          <tr
                            key={child.id}
                            className="bg-[#FAFBF9]/80 hover:bg-[#F3F6F1] transition-colors text-xs"
                          >
                            <td className="py-2.5 pl-8">
                              <div className="flex items-center gap-2">
                                <CornerDownRight className="h-3.5 w-3.5 text-[#9AA59C] shrink-0" />
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    backgroundColor: `${child.categoryColor}18`,
                                    color: child.categoryColor,
                                  }}
                                >
                                  <ChildIcon className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium text-[#465147]">
                                  {child.categoryName}
                                </span>
                              </div>
                            </td>

                            <td className="py-2.5 font-medium text-[#556057]">
                              {child.budgetAmount > 0 ? formatCurrency(child.budgetAmount) : '-'}
                            </td>

                            <td className="py-2.5 font-medium text-[#556057]">
                              {formatCurrency(child.spent)}
                            </td>

                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-[#6D776F] w-8">
                                  {child.progress}%
                                </span>
                                <div className="w-20 h-1.5 bg-[#EDF1EB] rounded-full overflow-hidden shrink-0">
                                  <div
                                    className={`h-full rounded-full ${childProgressBarColor}`}
                                    style={{ width: `${Math.min(100, Math.max(0, child.progress))}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className={`py-2.5 font-semibold ${isChildOver ? 'text-[#DE4436]' : 'text-[#556057]'}`}>
                              {child.budgetAmount > 0 ? formatCurrency(child.remaining) : '-'}
                            </td>

                            <td className="py-2.5 text-right pr-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md text-[#9AA59C] hover:text-[#172019] hover:bg-[#E2E6DF]"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  {onEditCategoryClick && (
                                    <DropdownMenuItem
                                      onClick={() => onEditCategoryClick(child)}
                                      className="text-xs cursor-pointer gap-2"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                      Edit Budget
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
