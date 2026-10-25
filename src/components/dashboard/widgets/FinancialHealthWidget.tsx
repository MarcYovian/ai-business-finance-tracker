import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  AlertCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Transaction } from '@/types/finance';

interface FinancialHealthWidgetProps {
  transactions: Transaction[];
  totalFundBalance: number;
}

export function FinancialHealthWidget({
  transactions,
  totalFundBalance,
}: FinancialHealthWidgetProps) {
  const navigate = useNavigate();

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

  // 2. Hitung pemasukan bulan lalu untuk persentase "dari bulan lalu"
  const { previousMonthIncome } = useMemo(() => {
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    let income = 0;
    for (const t of transactions) {
      if (!t.transactionDate) continue;
      const d = new Date(t.transactionDate);
      if (!isNaN(d.getTime()) && d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        if (t.type === 'income') income += t.amount;
      }
    }
    return { previousMonthIncome: income };
  }, [transactions, currentYear, currentMonth]);

  const momChange = useMemo(() => {
    if (previousMonthIncome > 0) {
      const diff = ((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100;
      return Math.round(diff);
    }
    return 0;
  }, [monthlyIncome, previousMonthIncome]);

  // 3. Hitung rasio tabungan (Savings Rate) bulan berjalan
  const savingsRate = useMemo(() => {
    if (monthlyIncome <= 0) return 0;
    const rate = Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100);
    return Math.max(0, Math.min(100, rate));
  }, [monthlyIncome, monthlyExpenses]);

  // 4. Status kesehatan & konfigurasi visual
  const healthStatus = useMemo(() => {
    if (monthlyIncome <= 0) {
      return {
        badgeLabel: 'Perlu Pemasukan',
        badgeBg: 'bg-[#FDF1E8]',
        badgeText: 'text-[#C25827]',
        badgeIconColor: 'fill-[#C25827] text-white',
        color: '#F5A87B', // Peach
        bannerBg: 'bg-[#FDF7F2]',
        bannerBorder: 'border-[#F9ECE0]',
        iconBg: 'bg-[#FCE7D8]',
        iconColor: 'text-[#D86927]',
        bannerTitle: 'Belum ada catatan pemasukan',
        bannerSubtitle: 'Catat pemasukan bulan ini untuk melihat kesehatan finansial.',
        actionIcon: Lightbulb,
      };
    }
    if (savingsRate >= 20) {
      return {
        badgeLabel: 'Sangat Sehat',
        badgeBg: 'bg-[#F2F8EA]',
        badgeText: 'text-[#3E7418]',
        badgeIconColor: 'fill-[#3E7418] text-white',
        color: '#8DC53E', // Lime green
        bannerBg: 'bg-[#F4FAF0]',
        bannerBorder: 'border-[#E2F0DC]',
        iconBg: 'bg-[#E7F5E0]',
        iconColor: 'text-[#3E7418]',
        bannerTitle: 'Arus kas surplus & ideal',
        bannerSubtitle: 'Pertahankan rasio tabungan untuk memperkuat cadangan.',
        actionIcon: Sparkles,
      };
    }
    if (savingsRate >= 10) {
      return {
        badgeLabel: 'Cukup Sehat',
        badgeBg: 'bg-[#F8FAF0]',
        badgeText: 'text-[#688E23]',
        badgeIconColor: 'fill-[#688E23] text-white',
        color: '#9CD447', // Soft lime
        bannerBg: 'bg-[#FAFBF2]',
        bannerBorder: 'border-[#EBF0DC]',
        iconBg: 'bg-[#EFF5DE]',
        iconColor: 'text-[#688E23]',
        bannerTitle: 'Arus kas stabil & terjaga',
        bannerSubtitle: 'Porsi tabungan berjalan baik, terus pantau biaya operasional.',
        actionIcon: Sparkles,
      };
    }
    return {
      badgeLabel: 'Perlu Perhatian',
      badgeBg: 'bg-[#FDF1E8]',
      badgeText: 'text-[#C25827]',
      badgeIconColor: 'fill-[#C25827] text-white',
      color: '#F5A87B', // Peach
      bannerBg: 'bg-[#FDF7F2]',
      bannerBorder: 'border-[#F9ECE0]',
      iconBg: 'bg-[#FCE7D8]',
      iconColor: 'text-[#D86927]',
      bannerTitle: 'Pengeluaran mendekati omzet',
      bannerSubtitle: 'Pertimbangkan menekan biaya agar rasio tabungan naik.',
      actionIcon: Lightbulb,
    };
  }, [monthlyIncome, savingsRate]);

  // Keliling busur setengah lingkaran (R = 60, L = PI * 60 ≈ 188.5)
  const arcTotalLength = 188.5;
  const strokeDashoffset = arcTotalLength * (1 - savingsRate / 100);
  const ActionIcon = healthStatus.actionIcon;

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full overflow-hidden">
      <div>
        {/* 1. Header Row: Heart Icon + Title/Subtitle + Status Badge */}
        <div className="flex items-center justify-between gap-1.5 pb-1">
          <div className="flex items-center gap-2 min-w-0">
            {/* Heartpulse Icon Box */}
            <div className="w-8 h-8 rounded-xl bg-[#EAF5E9] flex items-center justify-center text-[#2F7B38] shrink-0">
              <HeartPulse className="h-4 w-4 stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <h4 className="font-bold text-[13px] text-[#161F18] leading-tight truncate">
                Kesehatan Finansial
              </h4>
              <span className="text-[10px] text-[#8A958C] block truncate leading-tight mt-0.5">
                Rasio tabungan ({currentMonthLabel})
              </span>
            </div>
          </div>

          {/* Compact Status Badge Pill */}
          <div
            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold flex items-center gap-1 shrink-0 ${healthStatus.badgeBg} ${healthStatus.badgeText}`}
          >
            <AlertCircle className={`h-2.5 w-2.5 ${healthStatus.badgeIconColor}`} />
            <span className="truncate">{healthStatus.badgeLabel}</span>
          </div>
        </div>

        {/* 2. Total Saldo Kas Aktif & MoM Change Pill */}
        <div className="mt-2.5">
          <div className="flex items-center gap-1 text-[10px] text-[#8A958C] font-medium">
            <span>Total Saldo Kas Aktif</span>
            <Info className="h-3 w-3 text-[#98A39B] cursor-help shrink-0" />
          </div>

          <div className="text-[20px] font-extrabold text-[#161F18] font-sans tracking-tight leading-tight mt-0.5 truncate">
            {formatCurrency(totalFundBalance)}
          </div>

          {/* Growth Pill */}
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                momChange >= 0
                  ? 'bg-[#EAF6EA] text-[#2F7B38]'
                  : 'bg-[#FDF1E8] text-[#C25827]'
              }`}
            >
              {momChange >= 0 ? (
                <ArrowUp className="h-2.5 w-2.5 stroke-[2.5]" />
              ) : (
                <ArrowDown className="h-2.5 w-2.5 stroke-[2.5]" />
              )}
              <span>{Math.abs(momChange)}%</span>
              <span className="font-normal text-[#556A58] ml-0.5">
                dari bulan lalu
              </span>
            </span>
          </div>
        </div>

        {/* 3. Semicircle Dynamic Gauge Graphic */}
        <div className="relative flex flex-col items-center justify-center my-2">
          <svg className="w-36 h-20 overflow-visible" viewBox="0 0 160 90">
            {/* Background Semicircle Track */}
            <path
              d="M 20 80 A 60 60 0 0 1 140 80"
              fill="none"
              stroke="#EAEFE6"
              strokeLinecap="round"
              strokeWidth="13"
            />

            {/* Dynamic Colored Foreground Arc */}
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
          <div className="text-center -mt-8 z-10">
            <span className="font-extrabold text-[20px] text-[#172019] font-sans block leading-none">
              {savingsRate}%
            </span>
            <div className="text-[9.5px] text-[#7A857D] leading-tight mt-1">
              <div>dari pemasukan</div>
              <div>disimpan</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Contextual Banner Callout */}
      <div
        onClick={() => navigate('/transactions')}
        className={`mt-2 p-2.5 rounded-xl border ${healthStatus.bannerBg} ${healthStatus.bannerBorder} flex items-center justify-between gap-2 cursor-pointer hover:opacity-90 transition-opacity`}
        title="Buka Halaman Transaksi"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-full ${healthStatus.iconBg} ${healthStatus.iconColor} flex items-center justify-center shrink-0`}
          >
            <ActionIcon className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#231A14] block leading-tight truncate">
              {healthStatus.bannerTitle}
            </span>
            <span className="text-[9.5px] text-[#7B6E66] block leading-tight truncate mt-0.5">
              {healthStatus.bannerSubtitle}
            </span>
          </div>
        </div>

        <ChevronRight className="h-3.5 w-3.5 text-[#C27D56] shrink-0" />
      </div>
    </div>
  );
}
