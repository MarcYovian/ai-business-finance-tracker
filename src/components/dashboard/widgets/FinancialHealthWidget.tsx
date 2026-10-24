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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthLabel = now.toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
  });

  // 1. Hitung pemasukan & pengeluaran khusus bulan berjalan
  const { monthlyIncome, monthlyExpenses } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (!t.transactionDate) continue;
      const d = new Date(t.transactionDate);
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      ) {
        if (t.type === 'income') income += t.amount;
        if (t.type === 'expense') expense += t.amount;
      }
    }
    return { monthlyIncome: income, monthlyExpenses: expense };
  }, [transactions, currentYear, currentMonth]);

  // 2. Hitung rasio tabungan (Savings Rate) bulan berjalan
  const savingsRate = useMemo(() => {
    if (monthlyIncome <= 0) return 0;
    const rate = Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100);
    return Math.max(0, Math.min(100, rate));
  }, [monthlyIncome, monthlyExpenses]);

  // 3. Status kesehatan finansial dinamis berdasarkan rasio
  const healthStatus = useMemo(() => {
    if (monthlyIncome <= 0) {
      return {
        label: 'Perlu Pemasukan',
        badgeBg: 'bg-[#FDF2EC]',
        badgeText: 'text-[#B85724]',
        color: '#F5A87B', // Peach
        desc: 'Belum ada catatan pemasukan di bulan ini.',
      };
    }
    if (savingsRate >= 20) {
      return {
        label: 'Sangat Sehat',
        badgeBg: 'bg-[#F2F8EA]',
        badgeText: 'text-[#4A7C1E]',
        color: '#8DC53E', // Lime green
        desc: 'Arus kas surplus dan sangat ideal.',
      };
    }
    if (savingsRate >= 10) {
      return {
        label: 'Cukup Sehat',
        badgeBg: 'bg-[#F8FAF0]',
        badgeText: 'text-[#688E23]',
        color: '#9CD447', // Soft lime
        desc: 'Arus kas stabil dengan porsi simpanan aman.',
      };
    }
    if (savingsRate > 0) {
      return {
        label: 'Moderat',
        badgeBg: 'bg-[#FEF9EC]',
        badgeText: 'text-[#966E14]',
        color: '#F7D063', // Yellow
        desc: 'Arus kas positif tipis, waspadai pengeluaran.',
      };
    }
    return {
      label: 'Perlu Perhatian',
      badgeBg: 'bg-[#FDF2EC]',
      badgeText: 'text-[#B85724]',
      color: '#F5A87B', // Peach
      desc: 'Pengeluaran sama atau melebihi pemasukan.',
    };
  }, [monthlyIncome, savingsRate]);

  // Keliling setengah lingkaran (R = 60, L = PI * 60 ≈ 188.5)
  const arcTotalLength = 188.5;
  const strokeDashoffset = arcTotalLength * (1 - savingsRate / 100);

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header Section */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h4 className="font-bold text-[13px] text-[#161F18]">
              Kesehatan Finansial
            </h4>
            <span className="text-[10px] text-[#8A958C]">
              Rasio tabungan ({currentMonthLabel})
            </span>
          </div>

          <span
            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${healthStatus.badgeBg} ${healthStatus.badgeText} shrink-0`}
          >
            {healthStatus.label}
          </span>
        </div>

        {/* Saldo Kas Aktif */}
        <div className="mt-2.5">
          <span className="text-[10px] text-[#8A958C] block -mb-0.5 font-medium">
            Total Saldo Kas Aktif
          </span>
          <span className="text-[20px] font-extrabold text-[#161F18] font-sans">
            {formatRupiah(totalFundBalance)}
          </span>
        </div>

        {/* Semicircular Dynamic Segmented Gauge Graphic */}
        <div className="relative flex flex-col items-center justify-center mt-2.5 pt-1">
          <svg className="w-36 h-20 overflow-visible" viewBox="0 0 160 90">
            {/* Background Semicircle Track */}
            <path
              d="M 20 80 A 60 60 0 0 1 140 80"
              fill="none"
              stroke="#EAEFE6"
              strokeLinecap="round"
              strokeWidth="13"
            />

            {/* Dynamic Foreground Arc (Only rendered if savingsRate > 0) */}
            {savingsRate > 0 && (
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke={healthStatus.color}
                strokeLinecap="round"
                strokeWidth="13"
                strokeDasharray={arcTotalLength}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Centered Percentage Inside Arc */}
          <div className="text-center -mt-8">
            <span className="font-extrabold text-[18px] text-[#172019] font-sans block leading-none">
              {savingsRate}%
            </span>
            <span className="text-[9px] text-[#7A857D] leading-tight block mt-1">
              dari pemasukan disimpan
            </span>
          </div>
        </div>

        {/* Dynamic Contextual Helper Text */}
        <p className="text-[9.5px] text-[#8A958C] text-center mt-3 leading-relaxed">
          {healthStatus.desc}
        </p>
      </div>
    </div>
  );
}
