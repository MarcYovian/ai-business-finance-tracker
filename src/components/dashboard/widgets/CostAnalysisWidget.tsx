import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '@/lib/currency';
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
  const navigate = useNavigate();

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const categoryAnalysis = useMemo<CategoryBreakdownItem[]>(() => {
    const parentCats = categories.filter((c) => !c.parentId);
    const subCats = categories.filter((c) => c.parentId);

    const breakdown = parentCats.map((parent, idx) => {
      const parentSubIds = subCats
        .filter((s) => s.parentId === parent.id)
        .map((s) => s.id);
      const relevantCategoryIds = [parent.id, ...parentSubIds];

      const categoryExpenses = transactions
        .filter((t) => t.type === 'expense' && relevantCategoryIds.includes(t.categoryId || ''))
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        id: parent.id,
        name: parent.name,
        amount: categoryExpenses,
        percentage: 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      };
    });

    const totalExpense = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return breakdown
      .filter((item) => item.amount > 0)
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [categories, transactions]);

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-[13px] text-[#161F18]">
              Analisis Biaya
            </h4>
            <span className="text-[10px] text-[#8A958C]">
              Kategori pengeluaran
            </span>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-[20px] font-extrabold text-[#161F18] font-sans">
            {formatRupiah(totalExpenses)}
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
                  title={`${cat.name}: ${cat.percentage}%`}
                />
              ))}
            </div>

            {/* Category breakdown list */}
            <div className="mt-3 space-y-1 text-[10px]">
              {categoryAnalysis.slice(0, 5).map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between text-[#68736A]"
                >
                  <span className="flex items-center gap-1.5 truncate max-w-[130px]">
                    <span
                      className="w-1.5 h-1.5 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                  <span className="font-bold text-[#18211A] shrink-0 font-numeric">
                    {cat.percentage}% ({formatRupiah(cat.amount)})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-[#8A958C]">
            <p className="text-[11px]">Belum ada pengeluaran terkategori</p>
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
