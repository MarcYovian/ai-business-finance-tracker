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

  // 4. Status kesehatan & konfigurasi banner bawah
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
        bannerSubtitle: 'Catat pemasukan di bulan ini untuk melihat kesehatan finansial Anda.',
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
        bannerTitle: 'Arus kas surplus dan sangat ideal',
        bannerSubtitle: 'Pertahankan rasio tabungan untuk memperkuat dana cadangan bisnis.',
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
        bannerSubtitle: 'Porsi tabungan berjalan baik, terus pantau pos pengeluaran operasional.',
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
      bannerTitle: 'Pengeluaran mendekati pemasukan',
      bannerSubtitle: 'Pertimbangkan untuk menekan biaya non-esensial agar rasio tabungan naik.',
      actionIcon: Lightbulb,
    };
  }, [monthlyIncome, savingsRate]);

  // Keliling busur setengah lingkaran (R = 65, L = PI * 65 ≈ 204.2)
  const arcTotalLength = 204.2;
  const strokeDashoffset = arcTotalLength * (1 - savingsRate / 100);
  const ActionIcon = healthStatus.actionIcon;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* 1. Header Row: Heart Icon + Title/Subtitle + Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Heartpulse Icon Box */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EAF5E9] flex items-center justify-center text-[#2F7B38] shrink-0">
              <HeartPulse className="h-6 w-6 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="font-extrabold text-[16px] sm:text-[18px] text-[#161F18] font-sans tracking-tight leading-tight">
                Kesehatan Finansial
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#78857B] font-medium leading-tight mt-0.5">
                Rasio tabungan ({currentMonthLabel})
              </p>
            </div>
          </div>

          {/* Status Badge Pill */}
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shrink-0 ${healthStatus.badgeBg} ${healthStatus.badgeText}`}
          >
            <AlertCircle className={`h-3.5 w-3.5 ${healthStatus.badgeIconColor}`} />
            <span>{healthStatus.badgeLabel}</span>
          </div>
        </div>

        {/* 2. Total Saldo Kas Aktif & MoM Change Pill */}
        <div className="pt-1">
          <div className="flex items-center gap-1 text-[12px] sm:text-[12.5px] text-[#7A867D] font-medium">
            <span>Total Saldo Kas Aktif</span>
            <Info className="h-3.5 w-3.5 text-[#98A39B] cursor-help" />
          </div>

          <div className="text-[28px] sm:text-[32px] font-black text-[#161F18] font-sans tracking-tight leading-tight mt-0.5">
            {formatRupiah(totalFundBalance)}
          </div>

          {/* Growth Pill */}
          <div className="mt-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                momChange >= 0
                  ? 'bg-[#EAF6EA] text-[#2F7B38]'
                  : 'bg-[#FDF1E8] text-[#C25827]'
              }`}
            >
              {momChange >= 0 ? (
                <ArrowUp className="h-3 w-3 stroke-[2.5]" />
              ) : (
                <ArrowDown className="h-3 w-3 stroke-[2.5]" />
              )}
              <span>{Math.abs(momChange)}%</span>
              <span className="font-normal text-[#556A58] ml-0.5">
                dari bulan lalu
              </span>
            </span>
          </div>
        </div>

        {/* 3. Semicircle Dynamic Gauge Graphic */}
        <div className="relative flex flex-col items-center justify-center pt-2">
          <svg className="w-48 sm:w-56 h-28 sm:h-32 overflow-visible" viewBox="0 0 180 100">
            {/* Background Semicircle Track */}
            <path
              d="M 25 85 A 65 65 0 0 1 155 85"
              fill="none"
              stroke="#E5EBE5"
              strokeLinecap="round"
              strokeWidth="15"
            />

            {/* Dynamic Colored Foreground Arc */}
            {savingsRate > 0 && (
              <path
                d="M 25 85 A 65 65 0 0 1 155 85"
                fill="none"
                stroke={healthStatus.color}
                strokeLinecap="round"
                strokeWidth="15"
                strokeDasharray={arcTotalLength}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Centered Percentage Inside Arc */}
          <div className="text-center -mt-12 sm:-mt-14 z-10">
            <span className="font-black text-[28px] sm:text-[32px] text-[#161F18] font-sans block leading-none tracking-tight">
              {savingsRate}%
            </span>
            <div className="text-[11.5px] sm:text-[12px] text-[#556358] font-medium leading-tight mt-1">
              <div>dari pemasukan</div>
              <div>disimpan</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Contextual Banner Callout */}
      <div
        onClick={() => navigate('/transactions')}
        className={`mt-4 p-3 rounded-2xl border ${healthStatus.bannerBg} ${healthStatus.bannerBorder} flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-90 transition-opacity`}
        title="Buka Halaman Transaksi"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-full ${healthStatus.iconBg} ${healthStatus.iconColor} flex items-center justify-center shrink-0`}
          >
            <ActionIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <span className="text-[12px] font-bold text-[#231A14] block leading-tight truncate">
              {healthStatus.bannerTitle}
            </span>
            <span className="text-[10.5px] text-[#7B6E66] block leading-tight truncate mt-0.5">
              {healthStatus.bannerSubtitle}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-[#C27D56] shrink-0" />
      </div>
    </div>
  );
}
