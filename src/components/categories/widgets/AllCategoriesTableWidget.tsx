import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
} from 'lucide-react';
import { CategoryTypeFilter, CategoryWithAnalytics } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '@/lib/currency';

interface AllCategoriesTableWidgetProps {
  categories: CategoryWithAnalytics[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  typeFilter: CategoryTypeFilter;
  onTypeFilterChange: (type: CategoryTypeFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEditCategory: (category: CategoryWithAnalytics) => void;
  onAddSubcategory: (parentCategory: CategoryWithAnalytics) => void;
  onDeleteCategory: (category: CategoryWithAnalytics) => void;
  onToggleStatus?: (category: CategoryWithAnalytics) => void;
}

export const AllCategoriesTableWidget: React.FC<AllCategoriesTableWidgetProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  typeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchChange,
  onEditCategory,
  onAddSubcategory,
  onDeleteCategory,
  onToggleStatus,
}) => {
  // State for expanded parent rows (default all expanded)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  // Selected category IDs for bulk action
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  // Sort order (name, transactions, amount)
  const [sortField, setSortField] = useState<'name' | 'transactions' | 'amount'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const isExpanded = (id: string) => {
    return expandedRows[id] !== false; // Default expanded
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<string>();
      categories.forEach((cat) => {
        allIds.add(cat.id);
        cat.subcategories?.forEach((sub) => allIds.add(sub.id));
      });
      setCheckedIds(allIds);
    } else {
      setCheckedIds(new Set());
    }
  };

  const handleToggleCheck = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSort = (field: 'name' | 'transactions' | 'amount') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sort categories
  const sortedCategories = [...categories].sort((a, b) => {
    let diff = 0;
    if (sortField === 'name') {
      diff = a.name.localeCompare(b.name);
    } else if (sortField === 'transactions') {
      diff = a.transactionCount - b.transactionCount;
    } else if (sortField === 'amount') {
      diff = a.totalAmount - b.totalAmount;
    }
    return sortAsc ? diff : -diff;
  });

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs">
      <CardHeader className="p-3.5 sm:p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-[16px] sm:text-[17px] font-bold text-[#161F18]">
            All Categories
          </CardTitle>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {/* Filter by Type */}
            <Select
              value={typeFilter}
              onValueChange={(val) => onTypeFilterChange(val as CategoryTypeFilter)}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-[13px] bg-[#F8FAF7] border-[#E2E8DF] rounded-xl focus:ring-1 focus:ring-[#529E42]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Input */}
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B968D]" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-9 text-[13px] bg-[#F8FAF7] border-[#E2E8DF] rounded-xl focus-visible:ring-1 focus-visible:ring-[#529E42]"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="border-y border-[#EDF1EB] bg-[#FAFBF9] text-[11px] font-semibold text-[#6E7B71] uppercase tracking-wider">
                <th className="py-2.5 pl-4 pr-2 w-10">
                  <Checkbox
                    checked={checkedIds.size > 0 && checkedIds.size >= categories.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="border-[#C3CDC4] data-[state=checked]:bg-[#529E42] data-[state=checked]:border-[#529E42]"
                  />
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#161F18] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Type</th>
                <th
                  onClick={() => handleSort('transactions')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#161F18] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Transactions</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('amount')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#161F18] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Total Amount</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 pr-4 pl-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F2F5F0] text-[13px]">
              {sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8B968D]">
                    No categories found.
                  </td>
                </tr>
              ) : (
                sortedCategories.map((parent) => {
                  const ParentIcon = getCategoryIcon(parent.icon);
                  const expanded = isExpanded(parent.id);
                  const isSelected = selectedCategoryId === parent.id;
                  const hasSub = parent.subcategories && parent.subcategories.length > 0;

                  return (
                    <React.Fragment key={parent.id}>
                      {/* Parent Row */}
                      <tr
                        onClick={() => onSelectCategory(parent.id)}
                        className={`group cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#F2F7EF]'
                            : 'hover:bg-[#F9FAF8]'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 pl-4 pr-2">
                          <Checkbox
                            checked={checkedIds.has(parent.id)}
                            onCheckedChange={() => handleToggleCheck(parent.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="border-[#C3CDC4] data-[state=checked]:bg-[#529E42] data-[state=checked]:border-[#529E42]"
                          />
                        </td>

                        {/* Category Name & Hierarchy Chevron */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {hasSub ? (
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(parent.id, e)}
                                className="w-5 h-5 flex items-center justify-center rounded text-[#8B968D] hover:text-[#161F18] hover:bg-black/5"
                              >
                                {expanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : (
                              <div className="w-5" />
                            )}

                            {/* Icon in container */}
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: parent.color
                                  ? `${parent.color}1A`
                                  : parent.type === 'income'
                                  ? '#EDF8E8'
                                  : '#FEF2F2',
                                color: parent.color || (parent.type === 'income' ? '#529E42' : '#EF4444'),
                              }}
                            >
                              <ParentIcon className="w-4 h-4" />
                            </div>

                            <span className="font-semibold text-[#161F18]">
                              {parent.name}
                            </span>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              parent.type === 'income'
                                ? 'bg-[#EDF8E8] text-[#529E42]'
                                : 'bg-[#FEECEC] text-[#DE4436]'
                            }`}
                          >
                            {parent.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>

                        {/* Transactions Count */}
                        <td className="py-3 px-3 font-semibold text-[#161F18]">
                          {parent.transactionCount}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-3 font-semibold text-[#161F18] whitespace-nowrap">
                          {formatCurrency(parent.totalAmount)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              parent.is_active !== false
                                ? 'bg-[#EDF8E8] text-[#529E42]'
                                : 'bg-[#F3F4F6] text-[#6B7280]'
                            }`}
                          >
                            {parent.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions Dropdown */}
                        <td className="py-3 pr-4 pl-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-[#8B968D] hover:text-[#161F18]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-[13px]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddSubcategory(parent);
                                }}
                              >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Add Subcategory
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditCategory(parent);
                                }}
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit Category
                              </DropdownMenuItem>
                              {onToggleStatus && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStatus(parent);
                                  }}
                                >
                                  {parent.is_active !== false ? (
                                    <>
                                      <XCircle className="mr-2 h-3.5 w-3.5 text-amber-600" />
                                      Mark Inactive
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-[#529E42]" />
                                      Mark Active
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteCategory(parent);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete Category
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>

                      {/* Subcategories (Indented Tree rows) */}
                      {hasSub &&
                        expanded &&
                        parent.subcategories.map((child, idx) => {
                          const ChildIcon = getCategoryIcon(child.icon);
                          const isChildSelected = selectedCategoryId === child.id;

                          return (
                            <tr
                              key={child.id}
                              onClick={() => onSelectCategory(child.id)}
                              className={`cursor-pointer transition-colors ${
                                isChildSelected
                                  ? 'bg-[#EBF3E8]'
                                  : 'hover:bg-[#FAFBF9] bg-white'
                              }`}
                            >
                              {/* Subcategory Checkbox */}
                              <td className="py-2.5 pl-4 pr-2">
                                <Checkbox
                                  checked={checkedIds.has(child.id)}
                                  onCheckedChange={() => handleToggleCheck(child.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-[#C3CDC4] data-[state=checked]:bg-[#529E42] data-[state=checked]:border-[#529E42]"
                                />
                              </td>

                              {/* Indented Subcategory Name & Branch connector */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2 pl-6">
                                  {/* Tree connector glyph */}
                                  <span className="text-[#C8D1CA] font-mono text-[11px] select-none">
                                    {idx === parent.subcategories.length - 1 ? '└──' : '├──'}
                                  </span>

                                  {/* Small Icon in container */}
                                  <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundColor: child.color
                                        ? `${child.color}15`
                                        : '#F3F4F6',
                                      color: child.color || '#4B5563',
                                    }}
                                  >
                                    <ChildIcon className="w-3.5 h-3.5" />
                                  </div>

                                  <span className="font-medium text-[#2E3830]">
                                    {child.name}
                                  </span>
                                </div>
                              </td>

                              {/* Type Badge */}
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                    child.type === 'income'
                                      ? 'bg-[#EDF8E8] text-[#529E42]'
                                      : 'bg-[#FEECEC] text-[#DE4436]'
                                  }`}
                                >
                                  {child.type === 'income' ? 'Income' : 'Expense'}
                                </span>
                              </td>

                              {/* Transactions Count */}
                              <td className="py-2.5 px-3 text-[#4B5563]">
                                {child.transactionCount}
                              </td>

                              {/* Total Amount */}
                              <td className="py-2.5 px-3 text-[#161F18] font-medium whitespace-nowrap">
                                {formatCurrency(child.totalAmount)}
                              </td>

                              {/* Status Badge */}
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                    child.is_active !== false
                                      ? 'bg-[#EDF8E8] text-[#529E42]'
                                      : 'bg-[#F3F4F6] text-[#6B7280]'
                                  }`}
                                >
                                  {child.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>

                              {/* Actions Dropdown */}
                              <td className="py-2.5 pr-4 pl-2 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-[#8B968D] hover:text-[#161F18]"
                                    >
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40 text-[13px]">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditCategory(child);
                                      }}
                                    >
                                      <Pencil className="mr-2 h-3.5 w-3.5" />
                                      Edit Subcategory
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteCategory(child);
                                      }}
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
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
