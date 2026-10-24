import React, { useRef } from 'react';
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
  Calendar,
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
import { DATE_RANGE_PRESETS, STATUS_OPTIONS } from '../constants';
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
  const startPickerRef = useRef<HTMLInputElement>(null);
  const endPickerRef = useRef<HTMLInputElement>(null);

  const formatDisplayDate = (isoStr: string, fallback: string) => {
    if (!isoStr) return fallback;
    try {
      const d = new Date(`${isoStr}T00:00:00`);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };
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

  // Handle Preset Date Range Selection
  const handlePresetChange = (preset: string) => {
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === 'current') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      start = first.toISOString().split('T')[0];
      end = last.toISOString().split('T')[0];
    } else if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      start = first.toISOString().split('T')[0];
      end = last.toISOString().split('T')[0];
    } else if (preset === 'last_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = thirtyDaysAgo.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (preset === 'all') {
      start = '';
      end = '';
    } else {
      start = filters.startDate;
      end = filters.endDate;
    }

    onFilterChange((prev) => ({
      ...prev,
      datePreset: preset,
      startDate: start,
      endDate: end,
    }));
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

        {/* Date Range */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#161F18]">
            <Calendar className="w-3.5 h-3.5 text-[#161F18]" />
            <span>Date Range</span>
          </div>

          <Select value={filters.datePreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-9 text-xs rounded-xl border-[#E5EAE3] bg-white text-[#161F18]">
              <SelectValue placeholder="Custom range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#EDF1EB] text-xs">
              {DATE_RANGE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Start and End inputs matching mockup */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-1.5 items-center pt-0.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  try {
                    startPickerRef.current?.showPicker?.();
                  } catch {
                    startPickerRef.current?.focus();
                  }
                }}
                className="w-full h-8 px-2 rounded-lg border border-[#E5EAE3] bg-white text-[11px] font-medium text-[#161F18] hover:bg-[#F9FAF8] flex items-center justify-center transition-colors shadow-2xs truncate select-none"
              >
                {formatDisplayDate(filters.startDate, '1 Nov 2026')}
              </button>
              <input
                ref={startPickerRef}
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  onFilterChange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    datePreset: 'custom',
                  }))
                }
                className="sr-only"
                tabIndex={-1}
              />
            </div>

            <span className="text-[#8B968D] text-xs px-0.5 select-none text-center">→</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  try {
                    endPickerRef.current?.showPicker?.();
                  } catch {
                    endPickerRef.current?.focus();
                  }
                }}
                className="w-full h-8 px-2 rounded-lg border border-[#E5EAE3] bg-white text-[11px] font-medium text-[#161F18] hover:bg-[#F9FAF8] flex items-center justify-center transition-colors shadow-2xs truncate select-none"
              >
                {formatDisplayDate(filters.endDate, '30 Nov 2026')}
              </button>
              <input
                ref={endPickerRef}
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  onFilterChange((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                    datePreset: 'custom',
                  }))
                }
                className="sr-only"
                tabIndex={-1}
              />
            </div>
          </div>
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
