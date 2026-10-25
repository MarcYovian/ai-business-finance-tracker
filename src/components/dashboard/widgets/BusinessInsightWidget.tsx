import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { generateInsights } from '@/lib/insights';
import { Category, Transaction } from '@/types/finance';

interface BusinessInsightWidgetProps {
  transactions: Transaction[];
  categories: Category[];
}

export function BusinessInsightWidget({
  transactions,
  categories,
}: BusinessInsightWidgetProps) {
  const navigate = useNavigate();

  const insights = useMemo(() => {
    return generateInsights(transactions, categories);
  }, [transactions, categories]);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EAE3] shadow-sm flex items-center justify-between gap-3 h-full">
      <div className="max-w-[240px]">
        <h3 className="font-bold text-[13px] text-[#161F18] leading-tight">
          Optimalkan anggaran bisnis
        </h3>
        <p className="text-[11px] text-[#78837A] mt-1 leading-relaxed line-clamp-2">
          {insights[0]?.message ||
            'Siapkan alokasi cadangan bisnis 10-15% dari omzet untuk menjaga stabilitas arus kas.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/budget')}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#18211A] hover:text-[#8DC53E] mt-2 transition-colors"
        >
          <span>Kelola anggaran</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Abstract geometric pastel block arrangement from ACRU */}
      <div className="shrink-0 w-20 h-20 grid grid-cols-3 gap-1 p-1 bg-[#F9FAF8] rounded-xl border border-[#EDF1EA]">
        <div className="bg-[#F6CA84] rounded-sm" />
        <div className="bg-[#8DC53E] rounded-sm opacity-80" />
        <div className="bg-[#C5E48B] rounded-sm" />
        <div className="bg-[#8DC53E] rounded-sm" />
        <div className="bg-[#F8DEC0] rounded-sm" />
        <div className="bg-[#C5E48B] rounded-sm" />
        <div className="bg-[#E4EDD6] rounded-sm" />
        <div className="bg-[#8DC53E] rounded-sm" />
        <div className="bg-[#E2ED7C] rounded-sm" />
      </div>
    </div>
  );
}
