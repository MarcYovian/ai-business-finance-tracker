import { useMemo } from 'react';
import { Category, Transaction } from '@/types/finance';
import {
  CategoryTypeFilter,
  CategoryWithAnalytics,
  CategoriesSummary,
  SelectedCategoryAnalytics,
  CategoryMonthlySpending,
} from '../types';

interface UseCategoriesAnalyticsProps {
  categories: Category[];
  transactions: Transaction[];
  selectedCategoryId: string | null;
  typeFilter?: CategoryTypeFilter;
  searchQuery?: string;
}

export function useCategoriesAnalytics({
  categories,
  transactions,
  selectedCategoryId,
  typeFilter = 'all',
  searchQuery = '',
}: UseCategoriesAnalyticsProps) {
  // Current date markers
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Calculate Summary Metrics
  const summary = useMemo<CategoriesSummary>(() => {
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Collect category IDs with recent transactions (within last 3 months)
    const recentlyUsedCategoryIds = new Set<string>();
    for (const tx of transactions) {
      if (!tx.categoryId || !tx.transactionDate) continue;
      const txDate = new Date(tx.transactionDate);
      if (txDate >= threeMonthsAgo) {
        recentlyUsedCategoryIds.add(tx.categoryId);
      }
    }

    const totalCategories = categories.length;
    const totalParents = categories.filter((c) => !c.parentId).length;
    const totalSubcategories = categories.filter((c) => c.parentId).length;

    const incomeCategoriesList = categories.filter((c) => c.type === 'income');
    const incomeCategories = incomeCategoriesList.length;
    const incomeParents = incomeCategoriesList.filter((c) => !c.parentId).length;
    const incomeSubcategories = incomeCategoriesList.filter((c) => c.parentId).length;

    const expenseCategoriesList = categories.filter((c) => c.type === 'expense');
    const expenseCategories = expenseCategoriesList.length;
    const expenseParents = expenseCategoriesList.filter((c) => !c.parentId).length;
    const expenseSubcategories = expenseCategoriesList.filter((c) => c.parentId).length;

    // Unused categories: categories that have no transactions in the last 3 months
    const unusedCategoryIds = categories
      .filter((c) => !recentlyUsedCategoryIds.has(c.id))
      .map((c) => c.id);

    return {
      totalCategories,
      totalParents,
      totalSubcategories,
      incomeCategories,
      incomeParents,
      incomeSubcategories,
      expenseCategories,
      expenseParents,
      expenseSubcategories,
      unusedCategoriesCount: unusedCategoryIds.length,
      unusedCategoryIds,
    };
  }, [categories, transactions, now]);

  // 2. Transaction aggregations per category
  const categoryStatsMap = useMemo(() => {
    const stats = new Map<string, { count: number; totalAmount: number }>();

    for (const tx of transactions) {
      if (!tx.categoryId) continue;
      const existing = stats.get(tx.categoryId) || { count: 0, totalAmount: 0 };
      stats.set(tx.categoryId, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + (tx.amount || 0),
      });
    }

    return stats;
  }, [transactions]);

  // 3. Build enriched hierarchical categories
  const enrichedCategories = useMemo<CategoryWithAnalytics[]>(() => {
    const parentCats = categories.filter((c) => !c.parentId);
    const subCats = categories.filter((c) => Boolean(c.parentId));

    return parentCats.map((parent) => {
      // Find subcategories for this parent
      const children = subCats
        .filter((sub) => sub.parentId === parent.id)
        .map((sub) => {
          const subStat = categoryStatsMap.get(sub.id) || { count: 0, totalAmount: 0 };
          return {
            ...sub,
            transactionCount: subStat.count,
            totalAmount: subStat.totalAmount,
            subcategories: [],
          };
        });

      // Direct parent transactions
      const parentDirectStat = categoryStatsMap.get(parent.id) || { count: 0, totalAmount: 0 };

      // Roll up children's transactions to the parent
      const rolledUpCount = children.reduce((sum, ch) => sum + ch.transactionCount, parentDirectStat.count);
      const rolledUpAmount = children.reduce((sum, ch) => sum + ch.totalAmount, parentDirectStat.totalAmount);

      return {
        ...parent,
        transactionCount: rolledUpCount,
        totalAmount: rolledUpAmount,
        subcategories: children,
      };
    });
  }, [categories, categoryStatsMap]);

  // 4. Filtered categories for AllCategories table
  const filteredCategories = useMemo(() => {
    let list = enrichedCategories;

    // Filter by type
    if (typeFilter !== 'all') {
      list = list.filter((cat) => cat.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list
        .map((parent) => {
          const parentMatches = parent.name.toLowerCase().includes(q) || parent.description?.toLowerCase().includes(q);
          const matchingChildren = parent.subcategories.filter(
            (child) => child.name.toLowerCase().includes(q) || child.description?.toLowerCase().includes(q)
          );

          if (parentMatches) {
            return parent;
          }
          if (matchingChildren.length > 0) {
            return {
              ...parent,
              subcategories: matchingChildren,
            };
          }
          return null;
        })
        .filter((item): item is CategoryWithAnalytics => item !== null);
    }

    return list;
  }, [enrichedCategories, typeFilter, searchQuery]);

  // 5. Selected Category and its Analytics (for Detail Widget & Subcategories Widget)
  const selectedCategoryAnalytics = useMemo<SelectedCategoryAnalytics>(() => {
    // If no category selected, select the first expense parent or first parent
    const targetId =
      selectedCategoryId ||
      enrichedCategories.find((c) => c.type === 'expense')?.id ||
      enrichedCategories[0]?.id ||
      null;

    if (!targetId) {
      return {
        category: null,
        subcategories: [],
        totalSpentThisMonth: 0,
        spentLastMonth: 0,
        percentageChange: 0,
        transactionsThisMonthCount: 0,
        totalTransactionsCount: 0,
        monthlyTrend: [],
        subcategoriesMonthlyTrend: [],
        recentTransactions: [],
      };
    }

    // Find category (check parent or subcategory)
    let selectedCat: CategoryWithAnalytics | null = null;
    let parentOfSelected: CategoryWithAnalytics | null = null;

    for (const parent of enrichedCategories) {
      if (parent.id === targetId) {
        selectedCat = parent;
        break;
      }
      const foundSub = parent.subcategories.find((s) => s.id === targetId);
      if (foundSub) {
        selectedCat = foundSub;
        parentOfSelected = parent;
        break;
      }
    }

    if (!selectedCat) {
      return {
        category: null,
        subcategories: [],
        totalSpentThisMonth: 0,
        spentLastMonth: 0,
        percentageChange: 0,
        transactionsThisMonthCount: 0,
        totalTransactionsCount: 0,
        monthlyTrend: [],
        subcategoriesMonthlyTrend: [],
        recentTransactions: [],
      };
    }

    // Associated category IDs (the category itself + its subcategories if it is a parent)
    const associatedIds = new Set<string>([selectedCat.id]);
    if (selectedCat.subcategories && selectedCat.subcategories.length > 0) {
      selectedCat.subcategories.forEach((sub) => associatedIds.add(sub.id));
    }

    // Subcategories list for the widget (if selected is parent, use its subcategories; if sub, use siblings or empty)
    const subcategories = selectedCat.subcategories || [];

    // Filter transactions associated with this category
    const categoryTransactions = transactions.filter(
      (tx) => tx.categoryId && associatedIds.has(tx.categoryId)
    );

    // Calculate this month & last month
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;

    let thisMonthTotal = 0;
    let thisMonthCount = 0;
    let lastMonthTotal = 0;

    for (const tx of categoryTransactions) {
      if (!tx.transactionDate) continue;
      const d = new Date(tx.transactionDate);
      const yr = d.getFullYear();
      const mo = d.getMonth();

      if (yr === currentYear && mo === currentMonth) {
        thisMonthTotal += tx.amount || 0;
        thisMonthCount += 1;
      } else if (yr === lastMonthYear && mo === lastMonthIdx) {
        lastMonthTotal += tx.amount || 0;
      }
    }

    // Percentage change vs last month
    let percentageChange = 0;
    if (lastMonthTotal === 0) {
      percentageChange = thisMonthTotal > 0 ? 100 : 0;
    } else {
      percentageChange = Number((((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1));
    }

    // 6 Months trend calculation
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend: CategoryMonthlySpending[] = [];
    const subcategoriesMonthlyTrend: import('../types').SubcategoryMonthlyTrendItem[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = monthNames[m];
      const monthName = `${monthNames[m]} ${y}`;

      let monthAmount = 0;
      let monthTxCount = 0;

      const subItem: import('../types').SubcategoryMonthlyTrendItem = {
        monthKey,
        label,
        monthName,
        total: 0,
        totalCount: 0,
      };

      // Initialize all subcategories to 0
      for (const sub of subcategories) {
        subItem[sub.id] = 0;
        subItem[`${sub.id}_count`] = 0;
      }

      for (const tx of categoryTransactions) {
        if (!tx.transactionDate) continue;
        const txDate = new Date(tx.transactionDate);
        if (txDate.getFullYear() === y && txDate.getMonth() === m) {
          monthAmount += tx.amount || 0;
          monthTxCount += 1;

          // If this transaction belongs to a subcategory
          if (tx.categoryId && subItem[tx.categoryId] !== undefined) {
            subItem[tx.categoryId] = (Number(subItem[tx.categoryId]) || 0) + (tx.amount || 0);
            subItem[`${tx.categoryId}_count`] = (Number(subItem[`${tx.categoryId}_count`]) || 0) + 1;
            subItem.total += tx.amount || 0;
            subItem.totalCount += 1;
          }
        }
      }

      monthlyTrend.push({
        monthKey,
        label,
        amount: monthAmount,
        transactionCount: monthTxCount,
      });

      subcategoriesMonthlyTrend.push(subItem);
    }

    // Recent transactions sorted descending
    const sortedRecent = [...categoryTransactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 8);

    return {
      category: selectedCat,
      subcategories,
      totalSpentThisMonth: thisMonthTotal,
      spentLastMonth: lastMonthTotal,
      percentageChange,
      transactionsThisMonthCount: thisMonthCount,
      totalTransactionsCount: categoryTransactions.length,
      monthlyTrend,
      subcategoriesMonthlyTrend,
      recentTransactions: sortedRecent,
    };
  }, [
    selectedCategoryId,
    enrichedCategories,
    transactions,
    currentYear,
    currentMonth,
  ]);

  return {
    summary,
    enrichedCategories,
    filteredCategories,
    selectedCategoryAnalytics,
  };
}
