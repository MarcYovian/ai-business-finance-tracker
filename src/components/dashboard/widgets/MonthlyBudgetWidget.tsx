import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import { formatRupiah } from '@/lib/currency';
import { Transaction } from '@/types/finance';
import { DEFAULT_MONTHLY_BUDGET_LIMIT } from '../constants';

interface MonthlyBudgetWidgetProps {
  transactions: Transaction[];
  monthlyLimit?: number;
}

export function MonthlyBudgetWidget({
  transactions,
  monthlyLimit = DEFAULT_MONTHLY_BUDGET_LIMIT,
}: MonthlyBudgetWidgetProps) {
  const navigate = useNavigate();

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const budgetUsedPercentage = Math.min(
    100,
    Math.round((totalExpenses / monthlyLimit) * 100)
  );

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[14px] text-[#161F18]">
            Batas Pengeluaran Bulanan
          </h3>
          <button
            type="button"
            onClick={() => navigate('/budget')}
            className="text-[#98A39A] hover:text-[#172019] transition-colors"
            title="Kelola Anggaran"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-[#859087] mt-0.5">
          Akun gabungan operasional &amp; belanja
        </p>
      </div>

      <div className="mt-4">
        {/* Segmented lime progress bar */}
        <div className="w-full bg-[#EBF0E6] h-6 rounded-lg overflow-hidden flex p-0.5 gap-0.5">
          <div
            className="h-full bg-[#8DC53E] rounded-l-md flex items-center px-2 transition-all duration-500"
            style={{ width: `${Math.max(6, budgetUsedPercentage)}%` }}
          />
          <div className="h-full bg-[#E4EADF] rounded-r-md flex-1" />
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] font-semibold">
          <span className="text-[#172019] font-numeric">
            {formatRupiah(totalExpenses)} (Terpakai)
          </span>
          <span className="text-[#88938A] font-numeric">
            Plafon: {formatRupiah(monthlyLimit)}
          </span>
        </div>
      </div>
    </div>
  );
}
