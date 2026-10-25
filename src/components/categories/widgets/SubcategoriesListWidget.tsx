import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { CategoryWithAnalytics } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '@/lib/currency';

interface SubcategoriesListWidgetProps {
  parentCategory: CategoryWithAnalytics | null;
  subcategories: CategoryWithAnalytics[];
  onAddSubcategory: (parent: CategoryWithAnalytics) => void;
  onEditSubcategory: (category: CategoryWithAnalytics) => void;
  onDeleteSubcategory: (category: CategoryWithAnalytics) => void;
  onDeleteParentCategory: (parent: CategoryWithAnalytics) => void;
}

export const SubcategoriesListWidget: React.FC<SubcategoriesListWidgetProps> = ({
  parentCategory,
  subcategories,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
  onDeleteParentCategory,
}) => {
  if (!parentCategory) {
    return null;
  }

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs">
      <CardHeader className="p-3.5 sm:p-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-[16px] sm:text-[17px] font-bold text-[#161F18]">
            Subcategories
          </CardTitle>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddSubcategory(parentCategory)}
            className="h-8 text-xs sm:text-[12px] font-semibold border-[#E2E8DF] bg-[#FAFBF9] hover:bg-[#F2F5F0] text-[#161F18] rounded-xl px-2.5 gap-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Subcategory
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[380px]">
            <thead>
              <tr className="border-y border-[#EDF1EB] bg-[#FAFBF9] text-[11px] font-semibold text-[#6E7B71] uppercase tracking-wider">
                <th className="py-2.5 pl-4 sm:pl-5 pr-3">Name</th>
                <th className="py-2.5 px-3">Transactions</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 pr-4 sm:pr-5 pl-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F2F5F0] text-[13px]">
              {subcategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#8B968D]">
                    No subcategories yet. Click &quot;Add Subcategory&quot; to create one.
                  </td>
                </tr>
              ) : (
                subcategories.map((sub) => {
                  const SubIcon = getCategoryIcon(sub.icon);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-[#FAFBF9] transition-colors"
                    >
                      {/* Name with Icon */}
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: sub.color
                                ? `${sub.color}15`
                                : '#F3F4F6',
                              color: sub.color || '#4B5563',
                            }}
                          >
                            <SubIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-[#161F18]">
                            {sub.name}
                          </span>
                        </div>
                      </td>

                      {/* Transactions Count */}
                      <td className="py-3 px-3 text-[#4B5563] font-medium">
                        {sub.transactionCount}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-semibold text-[#161F18] whitespace-nowrap">
                        {formatCurrency(sub.totalAmount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-5 pl-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-[#8B968D] hover:text-[#161F18]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 text-[13px]">
                            <DropdownMenuItem onClick={() => onEditSubcategory(sub)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteSubcategory(sub)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
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

        {/* Delete Category Button at Bottom */}
        <div className="p-4 sm:p-5 pt-4 border-t border-[#EDF1EB]">
          <Button
            variant="outline"
            onClick={() => onDeleteParentCategory(parentCategory)}
            className="w-full h-10 border-[#FECDCA] text-[#DE4436] hover:bg-[#FEF2F2] hover:text-[#DE4436] font-semibold text-[13px] rounded-xl gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Category
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
