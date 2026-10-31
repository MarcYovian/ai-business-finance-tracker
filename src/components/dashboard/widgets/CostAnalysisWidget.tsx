'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Category, Transaction } from '@/types/finance';
import { CATEGORY_COLORS } from '../constants';
import { CategoryBreakdownItem } from '../types';

interface CostAnalysisWidgetProps {
  transactions: Transaction[];
  categories: Category[];
}

export function CostAnalysisWidget({
  transactions,
  categories,
}: CostAnalysisWidgetProps) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthLabel = now.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  // Filter transaksi pengeluaran khusus bulan berjalan
  const currentMonthExpenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense' || !t.transactionDate) return false;
      const d = new Date(t.transactionDate);
      return (
        !isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    });
  }, [transactions, currentYear, currentMonth]);

  // Total pengeluaran bulan berjalan
  const totalExpenses = useMemo(() => {
    return currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthExpenses]);

  // Analisis breakdown per kategori + penanganan Tanpa Kategori
  const categoryAnalysis = useMemo<CategoryBreakdownItem[]>(() => {
    const parentCats = categories.filter((c) => !c.parentId);
    const subCats = categories.filter((c) => c.parentId);

    const allKnownCategoryIds = new Set(categories.map((c) => c.id));

    // 1. Hitung alokasi per kategori induk (termasuk subkategorinya)
    const breakdown: CategoryBreakdownItem[] = parentCats.map((parent, idx) => {
      const parentSubIds = subCats
        .filter((s) => s.parentId === parent.id)
        .map((s) => s.id);
      const relevantCategoryIds = [parent.id, ...parentSubIds];

      const categoryExpenses = currentMonthExpenses
        .filter((t) => t.categoryId && relevantCategoryIds.includes(t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        id: parent.id,
        name: parent.name,
        amount: categoryExpenses,
        percentage: 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      };
    });

    // 2. Hitung pengeluaran yang belum memiliki kategori (Uncategorized)
    const uncategorizedExpenses = currentMonthExpenses
      .filter((t) => !t.categoryId || !allKnownCategoryIds.has(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    if (uncategorizedExpenses > 0) {
      breakdown.push({
        id: 'uncategorized',
        name: 'Tanpa Kategori',
        amount: uncategorizedExpenses,
        percentage: 0,
        color: '#CBD5CA', // Neutral soft grey
      });
    }

    const totalCalculated = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return breakdown
      .filter((item) => item.amount > 0)
      .map((item) => ({
        ...item,
        percentage:
          totalCalculated > 0
            ? Math.round((item.amount / totalCalculated) * 100)
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [categories, currentMonthExpenses]);

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-1">
          <div>
            <h4 className="font-bold text-[13px] text-[#161F18]">
              Analisis Biaya
            </h4>
            <span className="text-[10px] text-[#8A958C]">
              {currentMonthLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="text-[10px] font-semibold text-[#8A958C] hover:text-[#18211A] flex items-center transition-colors"
            title="Buka Halaman Transaksi"
          >
            <span>Detail</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-2.5">
          <span className="text-[20px] font-extrabold text-[#161F18] font-sans">
            {formatCurrency(totalExpenses)}
          </span>
        </div>

        {categoryAnalysis.length > 0 ? (
          <>
            {/* Horizontal Multi-Color Segmented Pill Bar */}
            <div className="w-full h-3 rounded-full bg-[#F3F6F1] flex gap-0.5 mt-2 overflow-hidden p-0.5">
              {categoryAnalysis.map((cat, idx) => (
                <div
                  key={cat.id || idx}
                  style={{
                    width: `${Math.max(6, cat.percentage)}%`,
                    backgroundColor: cat.color,
                  }}
                  className={`h-full ${idx === 0 ? 'rounded-l-full' : ''} ${
                    idx === categoryAnalysis.length - 1 ? 'rounded-r-full' : ''
                  }`}
                  title={`${cat.name}: ${cat.percentage}% (${formatCurrency(cat.amount)})`}
                />
              ))}
            </div>

            {/* Category breakdown list (Top 5) */}
            <div className="mt-3 space-y-1 text-[10px]">
              {categoryAnalysis.slice(0, 5).map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => navigate('/transactions')}
                  className="flex items-center justify-between text-[#68736A] hover:text-[#18211A] cursor-pointer py-0.5 transition-colors group"
                >
                  <span className="flex items-center gap-1.5 truncate max-w-[130px]">
                    <span
                      className="w-1.5 h-1.5 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate group-hover:underline">
                      {cat.name}
                    </span>
                  </span>
                  <span className="font-bold text-[#18211A] shrink-0 font-numeric">
                    {cat.percentage}% ({formatCurrency(cat.amount)})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-[#8A958C]">
            <p className="text-[11px]">Belum ada pengeluaran di bulan ini</p>
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="mt-2 text-[10px] font-bold text-[#4A7C1E] hover:underline"
            >
              + Catat Transaksi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
