'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Transaction } from '@/types/finance';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyBudgetLimit } from '@/hooks/useBudget';

interface MonthlyBudgetWidgetProps {
  transactions: Transaction[];
  monthlyLimit?: number;
}

export function MonthlyBudgetWidget({
  transactions,
  monthlyLimit,
}: MonthlyBudgetWidgetProps) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { user } = useAuth();
  const budgetInfo = useMonthlyBudgetLimit(user?.id);

  // Jika monthlyLimit diberikan manual sebagai prop, gunakan itu;
  // Jika tidak, gunakan nilai dinamis dari database (bulan berjalan -> bulan sebelumnya -> 0)
  const effectiveLimit =
    monthlyLimit !== undefined ? monthlyLimit : budgetInfo.limit;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Pengeluaran khusus untuk bulan berjalan (in cents)
  const monthlyExpenses = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.type !== 'expense' || !t.transactionDate) return false;
        const d = new Date(t.transactionDate);
        return (
          !isNaN(d.getTime()) &&
          d.getFullYear() === currentYear &&
          d.getMonth() === currentMonth
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentYear, currentMonth]);

  const budgetUsedPercentage =
    effectiveLimit > 0
      ? Math.min(100, Math.round((monthlyExpenses / effectiveLimit) * 100))
      : 0;

  const isOverBudget = effectiveLimit > 0 && monthlyExpenses > effectiveLimit;

  // Subtitle dinamis yang informatif
  const subtitle = useMemo(() => {
    if (effectiveLimit === 0) {
      return 'Belum ada anggaran yang diatur';
    }
    if (budgetInfo.source === 'previous') {
      return `Mengikuti anggaran ${budgetInfo.sourceMonth || 'bulan sebelumnya'}`;
    }
    return 'Akun gabungan operasional & belanja';
  }, [budgetInfo.source, budgetInfo.sourceMonth, effectiveLimit]);

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
            title="Kelola Anggaran di Menu Anggaran"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-[#859087] mt-0.5 truncate">
          {subtitle}
        </p>
      </div>

      <div className="mt-4">
        {/* Segmented progress bar */}
        <div className="w-full bg-[#EBF0E6] h-6 rounded-lg overflow-hidden flex p-0.5 gap-0.5">
          {effectiveLimit > 0 && budgetUsedPercentage > 0 ? (
            <div
              className={`h-full ${
                isOverBudget ? 'bg-[#E0533C]' : 'bg-[#8DC53E]'
              } rounded-l-md flex items-center px-2 transition-all duration-500`}
              style={{ width: `${Math.max(6, budgetUsedPercentage)}%` }}
            />
          ) : null}
          <div className="h-full bg-[#E4EADF] rounded-r-md flex-1" />
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] font-semibold">
          <span
            className={`${
              isOverBudget ? 'text-[#E0533C]' : 'text-[#172019]'
            } font-numeric`}
          >
            {formatCurrency(monthlyExpenses)}{' '}
            {effectiveLimit > 0
              ? isOverBudget
                ? '(Melebihi Plafon)'
                : '(Terpakai)'
              : '(Pengeluaran Bulan Ini)'}
          </span>
          <span className="text-[#88938A] font-numeric">
            {effectiveLimit > 0
              ? `Plafon: ${formatCurrency(effectiveLimit)}`
              : 'Plafon: Belum Diatur (Rp 0)'}
          </span>
        </div>
      </div>
    </div>
  );
}
