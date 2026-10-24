import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Building2,
  Tag,
  BarChart2,
  Clock,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { Category, FundSource, TransactionType } from '@/types/finance';
import { TransactionFilterState } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { cn } from '@/lib/utils';

interface TransactionsFilterWidgetProps {
  filters: TransactionFilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<TransactionFilterState>>;
  onApply: () => void;
  onReset: () => void;
  categories: Category[];
  fundSources: FundSource[];
  className?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export function TransactionsFilterWidget({
  filters,
  onFilterChange,
  onApply,
  onReset,
  categories,
  fundSources,
  className,
  isModal = false,
  onClose,
}: TransactionsFilterWidgetProps) {
  // Toggle transaction type in checkbox list
  const handleTypeToggle = (type: TransactionType) => {
    onFilterChange((prev) => {
      const exists = prev.types.includes(type);
      const updatedTypes = exists
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type];
      return {
        ...prev,
        types: updatedTypes,
      };
    });
  };

  const formContent = (
    <div className={cn('space-y-4', !isModal && 'p-5')}>
      {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B968D]" />
          <Input
            value={filters.search}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search in transactions..."
            className="pl-9 h-9 text-xs rounded-xl border-[#E5EAE3] bg-white text-[#161F18] focus-visible:ring-[#4F9B3F] placeholder:text-[#8B968D]"
          />
        </div>

        {/* Transaction Type Checkboxes */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#161F18]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#161F18]" />
            <span>Transaction Type</span>
          </div>

          <div className="space-y-2 pt-0.5">
            {/* Income */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#161F18] select-none">
              <Checkbox
                checked={filters.types.includes('income')}
                onCheckedChange={() => handleTypeToggle('income')}
                className="data-[state=checked]:bg-[#4F9B3F] data-[state=checked]:border-[#4F9B3F] rounded-md w-4 h-4"
              />
              <span className="flex items-center gap-1.5">
                <ArrowUp className="w-3.5 h-3.5 text-[#4F9B3F] stroke-[2.5]" />
                <span>Income</span>
              </span>
            </label>

            {/* Expense */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#161F18] select-none">
              <Checkbox
                checked={filters.types.includes('expense')}
                onCheckedChange={() => handleTypeToggle('expense')}
                className="data-[state=checked]:bg-[#4F9B3F] data-[state=checked]:border-[#4F9B3F] rounded-md w-4 h-4"
              />
              <span className="flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5 text-[#E04D3D] stroke-[2.5]" />
                <span>Expense</span>
              </span>
            </label>

            {/* Transfer */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#161F18] select-none">
              <Checkbox
                checked={filters.types.includes('transfer')}
                onCheckedChange={() => handleTypeToggle('transfer')}
                className="data-[state=checked]:bg-[#4F9B3F] data-[state=checked]:border-[#4F9B3F] rounded-md w-4 h-4"
              />
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#2F7BEA] stroke-[2.5]" />
                <span>Transfer</span>
              </span>
            </label>
          </div>
        </div>

        {/* Account Dropdown */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#161F18]">
            <Building2 className="w-3.5 h-3.5 text-[#161F18]" />
            <span>Account</span>
          </div>
          <Select
            value={filters.accountId}
            onValueChange={(val) =>
              onFilterChange((prev) => ({ ...prev, accountId: val }))
            }
          >
            <SelectTrigger className="h-9 text-xs rounded-xl border-[#E5EAE3] bg-white text-[#161F18]">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#EDF1EB] text-xs">
              <SelectItem value="all" className="text-xs">
                All accounts
              </SelectItem>
              {fundSources.map((fs) => (
                <SelectItem key={fs.id} value={fs.id} className="text-xs">
                  {fs.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Dropdown */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#161F18]">
            <Tag className="w-3.5 h-3.5 text-[#161F18]" />
            <span>Category</span>
          </div>
          <Select
            value={filters.categoryId}
            onValueChange={(val) =>
              onFilterChange((prev) => ({ ...prev, categoryId: val }))
            }
          >
            <SelectTrigger className="h-9 text-xs rounded-xl border-[#E5EAE3] bg-white text-[#161F18]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl border-[#EDF1EB] text-xs">
              <SelectItem value="all" className="text-xs">
                All categories
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Range */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#161F18]">
            <BarChart2 className="w-3.5 h-3.5 text-[#161F18]" />
            <span>Amount Range</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={filters.minAmount}
              onChange={(e) =>
                onFilterChange((prev) => ({ ...prev, minAmount: e.target.value }))
              }
              placeholder="Min amount"
              className="h-8 text-xs rounded-lg border-[#E5EAE3] bg-white px-2.5 text-[#161F18] placeholder:text-[#8B968D]"
            />
            <Input
              type="number"
              value={filters.maxAmount}
              onChange={(e) =>
                onFilterChange((prev) => ({ ...prev, maxAmount: e.target.value }))
              }
              placeholder="Max amount"
              className="h-8 text-xs rounded-lg border-[#E5EAE3] bg-white px-2.5 text-[#161F18] placeholder:text-[#8B968D]"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#161F18]">
            <Clock className="w-3.5 h-3.5 text-[#161F18]" />
            <span>Status</span>
          </div>
          <Select
            value={filters.status}
            onValueChange={(val) =>
              onFilterChange((prev) => ({ ...prev, status: val }))
            }
          >
            <SelectTrigger className="h-9 text-xs rounded-xl border-[#E5EAE3] bg-white text-[#161F18]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#EDF1EB] text-xs">
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#EDF1EB]">
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#6D776F] hover:text-[#161F18] font-semibold transition-colors py-2 px-1"
          >
            Reset filters
          </button>

          <div className="flex items-center gap-2">
            {isModal && onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-9 px-3.5 rounded-xl text-xs font-semibold border-[#EDF1EB] bg-white text-[#161F18] hover:bg-[#F6F7F5]"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                onApply();
                if (isModal && onClose) {
                  onClose();
                }
              }}
              className="h-9 px-4 rounded-xl text-xs font-semibold bg-[#4F9B3F] hover:bg-[#3E7A31] text-white shadow-2xs"
            >
              Apply filters
            </Button>
          </div>
        </div>
    </div>
  );

  if (isModal) {
    return <div className={className}>{formContent}</div>;
  }

  return (
    <Card className={cn('rounded-2xl border border-[#EDF1EB] bg-white shadow-xs', className)}>
      <CardContent className="p-0">{formContent}</CardContent>
    </Card>
  );
}
