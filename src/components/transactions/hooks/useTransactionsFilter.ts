import { useMemo, useState } from 'react';
import { Category, FundSource, Transaction } from '@/types/finance';
import {
  DEFAULT_TRANSACTION_FILTERS,
  BRAND_MAP,
} from '../constants';
import {
  EnrichedTransaction,
  SortField,
  SortOrder,
  TransactionFilterState,
  TransactionTab,
} from '../types';

interface UseTransactionsFilterParams {
  transactions: Transaction[];
  categories: Category[];
  fundSources: FundSource[];
  pageSize?: number;
}

export function useTransactionsFilter({
  transactions,
  categories,
  fundSources,
  pageSize = 10,
}: UseTransactionsFilterParams) {
  const [activeTab, setActiveTab] = useState<TransactionTab>('all');
  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_TRANSACTION_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilterState>(DEFAULT_TRANSACTION_FILTERS);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Category & FundSource lookup maps
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const fundSourceMap = useMemo(() => {
    const map = new Map<string, FundSource>();
    fundSources.forEach((fs) => map.set(fs.id, fs));
    return map;
  }, [fundSources]);

  // Enriched transactions with names, accounts, notes, and visual fallbacks
  const enrichedTransactions = useMemo<EnrichedTransaction[]>(() => {
    return transactions.map((t) => {
      const cat = t.categoryId ? categoryMap.get(t.categoryId) : undefined;
      const srcFs = t.sourceFundId ? fundSourceMap.get(t.sourceFundId) : undefined;
      const dstFs = t.destinationFundId ? fundSourceMap.get(t.destinationFundId) : undefined;

      let accountDisplay = 'N/A';
      if (t.type === 'transfer') {
        const fromName = srcFs?.name || 'Account';
        const toName = dstFs?.name || 'Account';
        accountDisplay = `${fromName} → ${toName}`;
      } else if (t.type === 'income') {
        accountDisplay = srcFs?.name || dstFs?.name || 'Account';
      } else {
        accountDisplay = srcFs?.name || 'Account';
      }

      const categoryName = t.type === 'transfer' ? 'Transfer' : cat?.name || 'Uncategorized';
      const subtitle = t.notes || (t.type === 'transfer' ? 'Fund Transfer' : categoryName);

      return {
        ...t,
        categoryName,
        categoryIcon: cat?.icon,
        categoryColor: cat?.color,
        sourceAccountName: srcFs?.name,
        sourceAccountType: srcFs?.type,
        destinationAccountName: dstFs?.name,
        destinationAccountType: dstFs?.type,
        accountDisplay,
        subtitle,
      };
    });
  }, [transactions, categoryMap, fundSourceMap]);

  // Filter pipeline
  const filteredTransactions = useMemo(() => {
    return enrichedTransactions.filter((t) => {
      // 1. Quick Tabs
      if (activeTab !== 'all' && t.type !== activeTab) {
        return false;
      }

      // 2. Applied Type Checkboxes
      if (appliedFilters.types.length > 0 && !appliedFilters.types.includes(t.type)) {
        return false;
      }

      // 3. Search query
      if (appliedFilters.search.trim()) {
        const query = appliedFilters.search.toLowerCase().trim();
        const descMatch = t.description?.toLowerCase().includes(query);
        const notesMatch = t.notes?.toLowerCase().includes(query);
        const catMatch = t.categoryName.toLowerCase().includes(query);
        const accMatch = t.accountDisplay.toLowerCase().includes(query);
        if (!descMatch && !notesMatch && !catMatch && !accMatch) {
          return false;
        }
      }

      // 4. Date Range
      if (appliedFilters.startDate) {
        const start = new Date(`${appliedFilters.startDate}T00:00:00`).getTime();
        const txTime = new Date(t.transactionDate).getTime();
        if (txTime < start) return false;
      }
      if (appliedFilters.endDate) {
        const end = new Date(`${appliedFilters.endDate}T23:59:59`).getTime();
        const txTime = new Date(t.transactionDate).getTime();
        if (txTime > end) return false;
      }

      // 5. Account filter
      if (appliedFilters.accountId && appliedFilters.accountId !== 'all') {
        const matchesAccount =
          t.sourceFundId === appliedFilters.accountId ||
          t.destinationFundId === appliedFilters.accountId;
        if (!matchesAccount) return false;
      }

      // 6. Category filter
      if (appliedFilters.categoryId && appliedFilters.categoryId !== 'all') {
        if (t.categoryId !== appliedFilters.categoryId) return false;
      }

      // 7. Amount Range (amount in cents, user input in Rupiah)
      const amountInRupiah = t.amount / 100;
      if (appliedFilters.minAmount) {
        const minVal = parseFloat(appliedFilters.minAmount.replace(/[^\d.]/g, ''));
        if (!isNaN(minVal) && amountInRupiah < minVal) return false;
      }
      if (appliedFilters.maxAmount) {
        const maxVal = parseFloat(appliedFilters.maxAmount.replace(/[^\d.]/g, ''));
        if (!isNaN(maxVal) && amountInRupiah > maxVal) return false;
      }

      // 8. Status
      if (appliedFilters.status && appliedFilters.status !== 'all') {
        if (t.status !== appliedFilters.status) return false;
      }

      return true;
    });
  }, [enrichedTransactions, activeTab, appliedFilters]);

  // Sort pipeline
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'category':
          comparison = a.categoryName.localeCompare(b.categoryName);
          break;
        case 'account':
          comparison = a.accountDisplay.localeCompare(b.accountDisplay);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  // Pagination calculation
  const totalCount = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedTransactions.slice(startIndex, startIndex + pageSize);
  }, [sortedTransactions, safeCurrentPage, pageSize]);

  // Sorting toggle
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTransactions.map((t) => t.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter actions
  const applyFilter = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  const resetFilter = () => {
    setFilters(DEFAULT_TRANSACTION_FILTERS);
    setAppliedFilters(DEFAULT_TRANSACTION_FILTERS);
    setActiveTab('all');
    setCurrentPage(1);
  };

  const setDateRange = (startDate: string, endDate: string, preset: string = 'custom') => {
    const newFilters = {
      ...filters,
      startDate,
      endDate,
      datePreset: preset,
    };
    setFilters(newFilters);
    setAppliedFilters(newFilters);
    setCurrentPage(1);
  };

  return {
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    appliedFilters,
    applyFilter,
    resetFilter,
    setDateRange,
    sortField,
    sortOrder,
    toggleSort,
    currentPage: safeCurrentPage,
    setCurrentPage,
    pageSize,
    totalCount,
    totalPages,
    paginatedTransactions,
    sortedTransactions,
    selectedIds,
    toggleSelectAll,
    toggleSelectRow,
    setSelectedIds,
  };
}
