import { useMemo } from 'react';
import { formatRupiah } from '@/lib/currency';
import { Transaction } from '@/types/finance';

interface FinancialHealthWidgetProps {
  transactions: Transaction[];
  totalFundBalance: number;
}

export function FinancialHealthWidget({
  transactions,
  totalFundBalance,
}: FinancialHealthWidgetProps) {
  const { totalIncome, totalExpenses } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    }
    return { totalIncome: income, totalExpenses: expense };
  }, [transactions]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    const rate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
    return Math.max(0, Math.min(100, rate));
  }, [totalIncome, totalExpenses]);

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-[13px] text-[#161F18]">
              Kesehatan Finansial
            </h4>
            <span className="text-[10px] text-[#8A958C]">
              Rasio tabungan
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[20px] font-extrabold text-[#161F18] font-sans">
            {formatRupiah(totalFundBalance)}
          </span>
        </div>

        {/* Semicircular Segmented Gauge Graphic matching ACRU */}
        <div className="relative flex flex-col items-center justify-center mt-3 pt-1">
          <svg className="w-36 h-20 overflow-visible" viewBox="0 0 160 90">
            <path
              d="M 20 80 A 60 60 0 0 1 140 80"
              fill="none"
              stroke="#EAEFE6"
              strokeLinecap="round"
              strokeWidth="14"
            />
            <path
              d="M 20 80 A 60 60 0 0 1 115 28"
              fill="none"
              stroke="#8DC53E"
              strokeLinecap="round"
              strokeWidth="14"
            />
          </svg>

          <div className="text-center -mt-8">
            <span className="font-extrabold text-[18px] text-[#172019] font-sans block">
              {savingsRate}%
            </span>
            <span className="text-[9px] text-[#7A857D] leading-tight block">
              dari pemasukan disimpan
            </span>
          </div>
        </div>

        <p className="text-[9.5px] text-[#8A958C] text-center mt-3 leading-relaxed">
          Dihitung dari selisih pemasukan dan pengeluaran aktif.
        </p>
      </div>
    </div>
  );
}
