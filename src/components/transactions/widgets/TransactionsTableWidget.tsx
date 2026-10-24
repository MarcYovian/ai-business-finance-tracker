import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  SlidersHorizontal,
  Building2,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  Utensils,
  Car,
  Tv,
  ArrowDown,
  ArrowUp,
  Home,
  Coffee,
  ShoppingBag,
  Briefcase,
  Dumbbell,
  Heart,
  Zap,
  Music,
  Fuel,
  Gamepad2,
  ShoppingCart,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { EnrichedTransaction, SortField, TransactionTab } from '../types';

interface TransactionsTableWidgetProps {
  transactions: EnrichedTransaction[];
  activeTab: TransactionTab;
  onTabChange: (tab: TransactionTab) => void;
  dateRangeLabel: string;
  startDate?: string;
  endDate?: string;
  datePreset?: string;
  onDateRangeChange?: (startDate: string, endDate: string, preset?: string) => void;
  onDateRangeClick?: () => void;
  onToggleFilter?: () => void;
  isFilterOpen?: boolean;
  activeFilterCount?: number;
  sortField: SortField;
  onSort: (field: SortField) => void;
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onSelectRow: (id: string) => void;
  onEdit: (tx: EnrichedTransaction) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function TransactionsTableWidget({
  transactions,
  activeTab,
  onTabChange,
  dateRangeLabel,
  startDate,
  endDate,
  onDateRangeChange,
  onDateRangeClick,
  onToggleFilter,
  isFilterOpen,
  activeFilterCount = 0,
  sortField,
  onSort,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
}: TransactionsTableWidgetProps) {
  const todayStr = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const firstDayOfMonthStr = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }, []);

  const [isDatePopoverOpen, setIsDatePopoverOpen] = React.useState(false);
  const [customStart, setCustomStart] = React.useState(startDate || firstDayOfMonthStr);
  const [customEnd, setCustomEnd] = React.useState(
    endDate ? (endDate > todayStr ? todayStr : endDate) : todayStr
  );

  React.useEffect(() => {
    if (startDate) setCustomStart(startDate);
    if (endDate) setCustomEnd(endDate > todayStr ? todayStr : endDate);
  }, [startDate, endDate, todayStr]);

  const handleApplyPreset = (preset: 'current' | 'last_month' | 'last_30_days' | 'all') => {
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === 'current') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      start = `${y}-${m}-01`;
      end = todayStr;
    } else if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      const y = first.getFullYear();
      const m = String(first.getMonth() + 1).padStart(2, '0');
      const d = String(last.getDate()).padStart(2, '0');
      start = `${y}-${m}-01`;
      end = `${y}-${m}-${d}`;
    } else if (preset === 'last_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const y1 = thirtyDaysAgo.getFullYear();
      const m1 = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0');
      const d1 = String(thirtyDaysAgo.getDate()).padStart(2, '0');
      start = `${y1}-${m1}-${d1}`;
      end = todayStr;
    } else if (preset === 'all') {
      start = '';
      end = todayStr;
    }

    setCustomStart(start);
    setCustomEnd(end);
    onDateRangeChange?.(start, end, preset);
    setIsDatePopoverOpen(false);
  };

  const handleApplyCustom = () => {
    let s = customStart;
    let e = customEnd;
    if (s && s > todayStr) s = todayStr;
    if (e && e > todayStr) e = todayStr;
    if (s && e && s > e) {
      s = e;
    }
    setCustomStart(s);
    setCustomEnd(e);
    onDateRangeChange?.(s, e, 'custom');
    setIsDatePopoverOpen(false);
  };

  // Format transaction date (e.g. 10 Nov 2026)
  const formatTxDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to render high-fidelity brand or merchant avatar
  const renderItemIcon = (tx: EnrichedTransaction) => {
    const descLower = (tx.description || '').toLowerCase();

    if (descLower.includes('superindo')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#FFF1F0] text-[#E04D3D] flex items-center justify-center shrink-0 border border-[#FDE2E1]">
          <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (descLower.includes('grab')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#EAF7ED] text-[#2EA44F] flex items-center justify-center shrink-0 border border-[#D5EFE0]">
          <Car className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (descLower.includes('netflix')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-black text-[#E50914] flex items-center justify-center shrink-0 font-black text-sm tracking-tighter shadow-2xs">
          N
        </div>
      );
    }
    if (descLower.includes('salary') || descLower.includes('gaji')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#EAF5E5] text-[#4F9B3F] flex items-center justify-center shrink-0 border border-[#D7ECD0]">
          <ArrowDown className="w-4 h-4 stroke-[2.4]" />
        </div>
      );
    }
    if (descLower.includes('indihome')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#FFF4ED] text-[#F97316] flex items-center justify-center shrink-0 border border-[#FED7AA]">
          <Home className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (descLower.includes('transfer') || descLower.includes('dana')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#EBF3FF] text-[#2563EB] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
          <ArrowRightLeft className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (descLower.includes('starbucks')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] text-[#006241] flex items-center justify-center shrink-0 border border-[#C6E7CE]">
          <Coffee className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (descLower.includes('tokopedia')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#E8F8EE] text-[#03AC0E] flex items-center justify-center shrink-0 border border-[#C5F0D2]">
          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (descLower.includes('freelance')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#F6EFE9] text-[#9A6A38] flex items-center justify-center shrink-0 border border-[#E9DDD0]">
          <Briefcase className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (descLower.includes('gym')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#FEECEB] text-[#E04D3D] flex items-center justify-center shrink-0 border border-[#FDC4C0]">
          <Dumbbell className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }

    // Fallbacks
    if (tx.type === 'income') {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#EAF5E5] text-[#4F9B3F] flex items-center justify-center shrink-0 border border-[#D7ECD0]">
          <ArrowUp className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (tx.type === 'transfer') {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#EBF3FF] text-[#2563EB] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
          <ArrowRightLeft className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-xl bg-[#F6F7F5] text-[#6D776F] flex items-center justify-center shrink-0 border border-[#EDF1EB]">
        <ShoppingCart className="w-4 h-4 stroke-[2]" />
      </div>
    );
  };

  // Helper for Category badge with pill style matching reference mockup
  const renderCategoryBadge = (tx: EnrichedTransaction) => {
    const rawName = tx.categoryName || '';
    const catLower = rawName.toLowerCase();
    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';

    let displayName = rawName;
    let pillClass = 'bg-[#F6F7F5] text-[#6D776F] border-[#EDF1EB]';
    let IconComp: React.ElementType = ShoppingBag;

    if (isIncome || catLower.includes('income') || catLower.includes('gaji') || catLower.includes('freelance') || catLower.includes('bisnis') || catLower.includes('bonus')) {
      displayName = 'Income';
      pillClass = 'bg-[#EAF5E5] text-[#3D7829] border-[#BBF7D0]';
      IconComp = ArrowUp;
    } else if (isTransfer || catLower.includes('transfer')) {
      displayName = 'Transfer';
      pillClass = 'bg-[#EBF3FF] text-[#2563EB] border-[#BFDBFE]';
      IconComp = ArrowRightLeft;
    } else if (catLower.includes('food') || catLower.includes('makan') || catLower.includes('dining') || catLower.includes('kopi') || catLower.includes('snack') || catLower.includes('kuliner')) {
      displayName = 'Food & Dining';
      pillClass = 'bg-[#FFF4E5] text-[#D97706] border-[#FED7AA]';
      IconComp = Utensils;
    } else if (catLower.includes('transport') || catLower.includes('bensin') || catLower.includes('ojek') || catLower.includes('parkir') || catLower.includes('angkutan')) {
      displayName = 'Transportation';
      pillClass = 'bg-[#EAF5E5] text-[#3D7829] border-[#BBF7D0]';
      IconComp = Car;
    } else if (catLower.includes('entertain') || catLower.includes('hiburan') || catLower.includes('stream') || catLower.includes('game') || catLower.includes('cinema') || catLower.includes('film')) {
      displayName = 'Entertainment';
      pillClass = 'bg-[#F1EAFF] text-[#7C3AED] border-[#DDD6FE]';
      IconComp = Gamepad2;
    } else if (catLower.includes('utilit') || catLower.includes('tagihan') || catLower.includes('internet') || catLower.includes('listrik') || catLower.includes('air') || catLower.includes('pulsa') || catLower.includes('pdam')) {
      displayName = 'Utilities';
      pillClass = 'bg-[#FFF9E5] text-[#B45309] border-[#FDE68A]';
      IconComp = Home;
    } else if (catLower.includes('health') || catLower.includes('sehat') || catLower.includes('gym') || catLower.includes('dokter') || catLower.includes('obat')) {
      displayName = 'Health & Fitness';
      pillClass = 'bg-[#FFF0F2] text-[#D83252] border-[#FFD6DC]';
      IconComp = Heart;
    } else if (catLower.includes('shop') || catLower.includes('belanja') || catLower.includes('grocer')) {
      displayName = 'Shopping';
      pillClass = 'bg-[#FCE8F0] text-[#BE185D] border-[#FBCFE8]';
      IconComp = ShoppingBag;
    }

    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-fit border', pillClass)}>
        <IconComp className="w-3 h-3 shrink-0 stroke-[2.2]" />
        <span>{displayName}</span>
      </span>
    );
  };

  // Helper for Account badge with icon
  const renderAccountBadge = (tx: EnrichedTransaction) => {
    const accLower = tx.accountDisplay.toLowerCase();

    if (accLower.includes('gopay')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-[#161F18] font-semibold">
          <div className="w-4 h-4 rounded-full bg-[#0081A0] text-white flex items-center justify-center text-[9px] font-black shrink-0">
            G
          </div>
          <span>GoPay</span>
        </div>
      );
    }
    if (accLower.includes('ovo')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-[#161F18] font-semibold">
          <div className="w-4 h-4 rounded-full bg-[#4C3494] text-white flex items-center justify-center text-[8px] font-black shrink-0 border border-purple-200">
            O
          </div>
          <span>OVO</span>
        </div>
      );
    }
    if (accLower.includes('credit card')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-[#161F18] font-semibold">
          <CreditCard className="w-3.5 h-3.5 text-[#2563EB] shrink-0 stroke-[2.2]" />
          <span>{tx.accountDisplay}</span>
        </div>
      );
    }
    if (tx.type === 'transfer') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-[#161F18] font-semibold">
          <ArrowRightLeft className="w-3.5 h-3.5 text-[#2563EB] shrink-0 stroke-[2.2]" />
          <span className="truncate max-w-[200px]" title={tx.accountDisplay}>
            {tx.accountDisplay}
          </span>
        </div>
      );
    }

    // Default Bank
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#161F18] font-semibold">
        <Building2 className="w-3.5 h-3.5 text-[#161F18] shrink-0 stroke-[2.2]" />
        <span className="truncate max-w-[180px]" title={tx.accountDisplay}>
          {tx.accountDisplay}
        </span>
      </div>
    );
  };

  const isAllSelected = transactions.length > 0 && selectedIds.size === transactions.length;

  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers
  const pageNumbers = React.useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs overflow-hidden">
      <CardContent className="p-0">
        {/* Top Control Bar: Quick Tabs & Action Buttons */}
        <div className="p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#EDF1EB]">
          {/* Quick Tabs matching reference mockup */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1">
            {(['all', 'income', 'expense', 'transfer'] as TransactionTab[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={cn(
                    'px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors shrink-0',
                    isActive
                      ? 'bg-[#EAF3DE] text-[#4E7934]'
                      : 'text-[#6D776F] hover:text-[#161F18]'
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Date Picker Popover & Filter Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none h-9 px-2.5 sm:px-3.5 rounded-xl text-xs font-medium border-[#EDF1EB] bg-white text-[#161F18] hover:bg-[#F6F7F5] gap-1.5 sm:gap-2 shadow-2xs truncate"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#6D776F] shrink-0" />
                  <span className="truncate">{dateRangeLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6D776F] ml-0.5 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 sm:w-80 p-4 rounded-2xl border border-[#EDF1EB] bg-white shadow-xl z-[70] space-y-3.5"
                align="end"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#EDF1EB]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EAF5E5] text-[#4F9B3F] flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#161F18]">Filter Tanggal</h4>
                      <p className="text-[10px] text-[#737E75]">Pilih rentang tanggal transaksi</p>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('current')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#EDF1EB] bg-[#F9FAF8] hover:bg-[#EAF5E5] hover:text-[#3D7829] text-[#161F18] transition-colors text-center"
                  >
                    Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('last_month')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#EDF1EB] bg-[#F9FAF8] hover:bg-[#EAF5E5] hover:text-[#3D7829] text-[#161F18] transition-colors text-center"
                  >
                    Bulan Lalu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('last_30_days')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#EDF1EB] bg-[#F9FAF8] hover:bg-[#EAF5E5] hover:text-[#3D7829] text-[#161F18] transition-colors text-center"
                  >
                    30 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('all')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#EDF1EB] bg-[#F9FAF8] hover:bg-[#EAF5E5] hover:text-[#3D7829] text-[#161F18] transition-colors text-center"
                  >
                    Semua Waktu
                  </button>
                </div>

                {/* Custom Date Inputs */}
                <div className="space-y-2 pt-1 border-t border-[#EDF1EB]">
                  <span className="text-[11px] font-bold text-[#161F18] block">Rentang Kustom</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-[#737E75]">Dari</label>
                      <Input
                        type="date"
                        max={todayStr}
                        value={customStart}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomStart(val > todayStr ? todayStr : val);
                        }}
                        className="h-8 text-xs rounded-xl border-[#E5EAE3] px-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-[#737E75]">Sampai</label>
                      <Input
                        type="date"
                        max={todayStr}
                        value={customEnd}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomEnd(val > todayStr ? todayStr : val);
                        }}
                        className="h-8 text-xs rounded-xl border-[#E5EAE3] px-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDF1EB]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDatePopoverOpen(false)}
                    className="h-8 px-3 rounded-xl text-xs font-semibold border-[#EDF1EB]"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyCustom}
                    className="h-8 px-3.5 rounded-xl text-xs font-semibold bg-[#4F9B3F] hover:bg-[#3E7A31] text-white"
                  >
                    Terapkan
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filter Toggle Button - ONLY VISIBLE ON MOBILE & TABLET (< 1024px) */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFilter}
              className={cn(
                'lg:hidden h-9 px-3 sm:px-3.5 rounded-xl text-xs font-medium border-[#EDF1EB] bg-white text-[#161F18] hover:bg-[#F6F7F5] gap-1.5 shadow-2xs shrink-0',
                isFilterOpen && 'bg-[#F6F7F5] border-[#D0D7CF]'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#6D776F]" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[#EAF3DE] text-[#4E7934] text-[10px] font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#EDF1EB] bg-[#FAFAF8] text-[11px] font-semibold text-[#8B968D]">
                <th className="py-2.5 pl-4 pr-2 w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all"
                    className="data-[state=checked]:bg-[#4F9B3F] data-[state=checked]:border-[#4F9B3F] rounded-md translate-y-[1px]"
                  />
                </th>
                <th
                  onClick={() => onSort('date')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#161F18] transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ChevronsUpDown className="w-3 h-3 text-[#8B968D]" />
                  </div>
                </th>
                <th
                  onClick={() => onSort('description')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#161F18] transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Description</span>
                    <ChevronsUpDown className="w-3 h-3 text-[#8B968D]" />
                  </div>
                </th>
                <th
                  onClick={() => onSort('category')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#161F18] transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ChevronsUpDown className="w-3 h-3 text-[#8B968D]" />
                  </div>
                </th>
                <th
                  onClick={() => onSort('account')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#161F18] transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Account</span>
                    <ChevronsUpDown className="w-3 h-3 text-[#8B968D]" />
                  </div>
                </th>
                <th
                  onClick={() => onSort('amount')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-[#161F18] transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <ChevronsUpDown className="w-3 h-3 text-[#8B968D]" />
                  </div>
                </th>
                <th className="py-2.5 pl-2 pr-4 text-center w-12 text-[#8B968D]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1EB] text-[12px]">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isSelected = selectedIds.has(tx.id);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className={cn(
                        'hover:bg-[#F9FAF8] transition-colors group',
                        isSelected && 'bg-[#F2F8ED]'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pl-4 pr-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onSelectRow(tx.id)}
                          aria-label={`Select ${tx.description}`}
                          className="data-[state=checked]:bg-[#4F9B3F] data-[state=checked]:border-[#4F9B3F] rounded-md translate-y-[1px]"
                        />
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-xs text-[#6D776F] whitespace-nowrap font-medium">
                        {formatTxDate(tx.transactionDate)}
                      </td>

                      {/* Description with Merchant Avatar & Note */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {renderItemIcon(tx)}
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-[13px] text-[#161F18] block truncate max-w-[190px]">
                              {tx.description || 'Untitled Transaction'}
                            </span>
                            <span className="text-[11px] text-[#8B968D] block truncate max-w-[190px]">
                              {tx.subtitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderCategoryBadge(tx)}
                      </td>

                      {/* Account */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderAccountBadge(tx)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={cn(
                            'font-bold text-xs sm:text-[13px] tracking-tight',
                            isIncome ? 'text-[#3D7829]' : 'text-[#DC2626]'
                          )}
                        >
                          {isIncome ? '+ ' : '- '}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-2 pr-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-[#8B968D] hover:text-[#161F18] rounded-lg"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl border-[#EDF1EB] text-xs">
                            <DropdownMenuItem onClick={() => onEdit(tx)}>
                              <Pencil className="mr-2 w-3.5 h-3.5 text-[#6D776F]" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${tx.description} - ${formatCurrency(tx.amount)}`
                                );
                              }}
                            >
                              <Copy className="mr-2 w-3.5 h-3.5 text-[#6D776F]" />
                              <span>Copy details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(tx.id)}
                              className="text-[#DC2626] focus:text-[#DC2626]"
                            >
                              <Trash2 className="mr-2 w-3.5 h-3.5 text-[#DC2626]" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#F6F7F5] flex items-center justify-center text-[#8B968D]">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-[#161F18]">No transactions found</p>
                      <p className="text-[11px] text-[#8B968D] max-w-sm">
                        Try adjusting your filters or date range to see transaction records.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EDF1EB] text-xs text-[#8B968D]">
          <div className="text-center sm:text-left text-xs">
            Showing <span className="font-semibold text-[#161F18]">{startRecord}</span> -{' '}
            <span className="font-semibold text-[#161F18]">{endRecord}</span> of{' '}
            <span className="font-semibold text-[#161F18]">{totalCount}</span> transactions
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg border-[#EDF1EB] bg-white text-[#6D776F] hover:bg-[#F6F7F5] p-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>

              {pageNumbers.map((p) => {
                const isCurrent = p === currentPage;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={cn(
                      'w-8 h-8 sm:w-7 sm:h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors',
                      isCurrent
                        ? 'bg-[#4F9B3F] text-white shadow-2xs'
                        : 'border border-[#EDF1EB] bg-white text-[#6D776F] hover:bg-[#F6F7F5]'
                    )}
                  >
                    {p}
                  </button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg border-[#EDF1EB] bg-white text-[#6D776F] hover:bg-[#F6F7F5] p-0"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
