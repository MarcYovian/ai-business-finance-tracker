'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFundSources } from '@/hooks/useFundSources';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { TransactionDialog } from '@/components/TransactionDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Upload, Download, FileSpreadsheet, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Transaction } from '@/types/finance';
import {
  TransactionsSkeleton,
  useTransactionsAnalytics,
  useTransactionsFilter,
  TotalIncomeWidget,
  TotalExpensesWidget,
  TotalTransfersWidget,
  TransactionsTableWidget,
  TransactionsFilterWidget,
  EnrichedTransaction,
} from '@/components/transactions';
import { cn } from '@/lib/utils';

export default function TransactionsClient({ userId }: { userId?: string }) {
  const { user } = useAuth();

  // Queries
  const { data: transactions = [], isLoading: isLoadingTx } = useTransactions(userId || user?.id || '');
  const { data: categories = [], isLoading: isLoadingCat } = useCategories(userId || user?.id || '');
  const { data: fundSources = [], isLoading: isLoadingFunds } = useFundSources(userId || user?.id || '');

  // Mutations
  const deleteTransactionMutation = useDeleteTransaction();

  // Dialog and panel states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Responsive filter toggle: modal on mobile/small screen (< 1024px), sidebar toggle on desktop (>= 1024px)
  const handleToggleFilter = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileFilterOpen(true);
    } else {
      setIsFilterOpen((prev) => !prev);
    }
  };

  // Filter & Pagination hook
  const {
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    appliedFilters,
    applyFilter,
    resetFilter,
    setDateRange,
    sortField,
    toggleSort,
    currentPage,
    setCurrentPage,
    pageSize,
    totalCount,
    totalPages,
    paginatedTransactions,
    selectedIds,
    toggleSelectAll,
    toggleSelectRow,
  } = useTransactionsFilter({
    transactions,
    categories,
    fundSources,
    pageSize: 10,
  });

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const firstDayOfMonthStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }, []);

  // Analytics hook
  const analytics = useTransactionsAnalytics({
    transactions,
    startDate: appliedFilters.startDate || firstDayOfMonthStr,
    endDate: appliedFilters.endDate || todayStr,
  });

  // Calculate active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.types.length < 3) count++;
    if (appliedFilters.accountId !== 'all') count++;
    if (appliedFilters.categoryId !== 'all') count++;
    if (appliedFilters.minAmount || appliedFilters.maxAmount) count++;
    if (appliedFilters.status !== 'all') count++;
    return count;
  }, [appliedFilters]);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (!appliedFilters.startDate && !appliedFilters.endDate) return 'All Time';
    const formatDate = (isoStr: string) => {
      try {
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch {
        return isoStr;
      }
    };
    return `${formatDate(appliedFilters.startDate)} - ${formatDate(appliedFilters.endDate)}`;
  }, [appliedFilters.startDate, appliedFilters.endDate]);

  // Handlers
  const handleEdit = (tx: EnrichedTransaction) => {
    setEditingTransaction(tx);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransactionMutation.mutateAsync(transactionToDelete);
      toast({ title: 'Transaction deleted successfully' });
      setIsDeleteOpen(false);
      setTransactionToDelete(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast({ title: 'No transactions to export' });
      return;
    }
    const headers = ['Date,Description,Type,Amount,Category,Account,Status\n'];
    const rows = transactions.map((t) =>
      `"${t.transactionDate}","${t.description}","${t.type}","${t.amount / 100}","${t.categoryId || ''}","${t.sourceFundId || ''}","${t.status || ''}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Transactions exported to CSV' });
  };

  if (isLoadingTx || isLoadingCat || isLoadingFunds) {
    return (
        <TransactionsSkeleton />
    );
  }

  return (
      <div className="p-3.5 sm:p-6 lg:p-7 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#161F18] tracking-tight">
              Transactions
            </h1>
            <p className="text-xs sm:text-[13px] text-[#737E75] mt-0.5">
              Track and manage all your income, expenses, and transfers.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Import / Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 sm:h-10 px-3.5 rounded-xl text-xs font-semibold border-[#EDF1EB] bg-white text-[#161F18] hover:bg-[#F6F7F5] gap-2 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#161F18]" />
                  <span>Import</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6D776F] -ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#EDF1EB] text-xs">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="mr-2 w-3.5 h-3.5 text-[#6D776F]" />
                  <span>Export as CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast({
                      title: 'CSV Import',
                      description: 'Import wizard is ready. Drag and drop CSV to import.',
                    })
                  }
                >
                  <FileSpreadsheet className="mr-2 w-3.5 h-3.5 text-[#6D776F]" />
                  <span>Upload CSV file</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Transaction Button */}
            <Button
              onClick={() => {
                setEditingTransaction(null);
                setIsDialogOpen(true);
              }}
              size="sm"
              className="h-9 sm:h-10 px-4 rounded-xl text-xs font-semibold bg-[#4F9B3F] hover:bg-[#3E7A31] text-white gap-2 shadow-2xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Transaction</span>
            </Button>
          </div>
        </div>

        {/* Top 3 Stat Cards Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Widget 1: Total Income */}
          <TotalIncomeWidget
            totalAmount={analytics.totalIncome}
            momPercent={analytics.incomeMomPercent}
            sparklineData={analytics.incomeSparkline}
          />

          {/* Widget 2: Total Expenses */}
          <TotalExpensesWidget
            totalAmount={analytics.totalExpense}
            momPercent={analytics.expenseMomPercent}
            sparklineData={analytics.expenseSparkline}
          />

          {/* Widget 3: Total Transfers */}
          <TotalTransfersWidget
            totalAmount={analytics.totalTransfer}
            momPercent={analytics.transferMomPercent}
            sparklineData={analytics.transferSparkline}
          />
        </div>

        {/* Main Workspace Grid (Table + Filter Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* Widget 4: Transactions Table */}
          <div
            className={cn(
              'transition-all duration-200 w-full min-w-0',
              isFilterOpen ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'
            )}
          >
            <TransactionsTableWidget
              transactions={paginatedTransactions}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              dateRangeLabel={dateRangeLabel}
              startDate={appliedFilters.startDate}
              endDate={appliedFilters.endDate}
              datePreset={appliedFilters.datePreset}
              onDateRangeChange={(startDate, endDate, preset) => {
                setDateRange(startDate, endDate, preset);
              }}
              onToggleFilter={handleToggleFilter}
              isFilterOpen={isFilterOpen}
              activeFilterCount={activeFilterCount}
              sortField={sortField}
              onSort={toggleSort}
              selectedIds={selectedIds}
              onSelectAll={toggleSelectAll}
              onSelectRow={toggleSelectRow}
              onEdit={handleEdit}
              onDelete={handleDelete}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Widget 5: Transactions Filter Sidebar (Desktop >= 1024px only) */}
          {isFilterOpen && (
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-6 w-full min-w-0">
              <TransactionsFilterWidget
                filters={filters}
                onFilterChange={setFilters}
                onApply={applyFilter}
                onReset={resetFilter}
                categories={categories}
                fundSources={fundSources}
              />
            </div>
          )}
        </div>

      {/* Mobile / Small-screen Filter Modal Popup (< 1024px) */}
      <Dialog open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto p-0 rounded-2xl border-[#EDF1EB] bg-white shadow-xl">
          <DialogHeader className="p-4 sm:p-5 border-b border-[#EDF1EB] text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF5E5] text-[#4F9B3F] flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base font-bold text-[#161F18]">
                  Filter Transactions
                </DialogTitle>
                <DialogDescription className="text-xs text-[#737E75] mt-0.5">
                  Filter transactions by type, category, account, or amount.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-5">
            <TransactionsFilterWidget
              filters={filters}
              onFilterChange={setFilters}
              onApply={() => {
                applyFilter();
                setIsMobileFilterOpen(false);
              }}
              onReset={resetFilter}
              categories={categories}
              fundSources={fundSources}
              isModal
              onClose={() => setIsMobileFilterOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <TransactionDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onDelete={
          editingTransaction
            ? () => handleDelete(editingTransaction.id)
            : undefined
        }
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isPending={deleteTransactionMutation.isPending}
      />
    </div>
  );
}
