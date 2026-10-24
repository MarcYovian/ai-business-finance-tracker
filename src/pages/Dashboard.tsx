import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah, formatDate } from '@/lib/currency';
import { generateInsights } from '@/lib/insights';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFundSources } from '@/hooks/useFundSources';
import { useBeneficiaries, useAddBeneficiary } from '@/hooks/useBeneficiaries';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  BarChart2,
  LineChart,
  Calendar as CalendarIcon,
  PlusCircle,
  Send,
  ArrowDownToLine,
  History,
  MoreHorizontal,
  Landmark,
  Wallet,
  Coins,
  ShieldCheck,
  Plus,
  Edit2,
  Receipt,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';

const CATEGORY_COLORS = [
  '#F5A87B', // Peach
  '#F7D063', // Yellow
  '#E2ED7C', // Soft Lime
  '#9CD447', // Lime Accent
  '#8DC53E', // Forest Lime
  '#4E8B74', // Teal Green
  '#D9E1D6', // Neutral Grey
];

const BANK_OPTIONS = [
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'BSI',
  'CIMB Niaga',
  'Permata',
  'GoPay',
  'OVO',
  'DANA',
  'ShopeePay',
  'Lainnya',
];

const CARD_THEMES: Record<
  string,
  { bg: string; text: string; subText: string; ringColor: string; chipBg: string; chipBorder: string }
> = {
  lime: {
    bg: 'bg-[#8DC53E]',
    text: 'text-[#18280D]',
    subText: 'text-[#2A4413]',
    ringColor: 'border-white/20',
    chipBg: 'bg-[#9FD84C]',
    chipBorder: 'border-[#6FA527]/50',
  },
  dark: {
    bg: 'bg-[#18211A]',
    text: 'text-white',
    subText: 'text-[#8E9B90]',
    ringColor: 'border-white/10',
    chipBg: 'bg-[#E2ED7C]',
    chipBorder: 'border-[#E2ED7C]/60',
  },
  blue: {
    bg: 'bg-[#1E3A8A]',
    text: 'text-white',
    subText: 'text-[#93C5FD]',
    ringColor: 'border-white/20',
    chipBg: 'bg-[#60A5FA]',
    chipBorder: 'border-[#3B82F6]/60',
  },
  peach: {
    bg: 'bg-[#F5A87B]',
    text: 'text-[#301605]',
    subText: 'text-[#5E2B0C]',
    ringColor: 'border-white/25',
    chipBg: 'bg-[#F7C0A0]',
    chipBorder: 'border-[#D97D45]/50',
  },
};

type PeriodType = '7d' | '30d' | '1y' | 'custom';

const PERIOD_LABELS: Record<PeriodType, string> = {
  '7d': '7 Hari Terakhir',
  '30d': '30 Hari Terakhir',
  '1y': 'Tahun Ini (12 Bulan)',
  custom: 'Rentang Kustom',
};

interface ChartDataPoint {
  id: string;
  label: string;
  fullDate: string;
  income: number;
  expense: number;
  savings: number;
}

const DashboardLoading = () => (
  <Layout>
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <Skeleton className="h-[280px] w-full rounded-2xl bg-white/70" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-[140px] w-full rounded-2xl bg-white/70" />
            <Skeleton className="h-[140px] w-full rounded-2xl bg-white/70" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Skeleton className="h-[240px] w-full rounded-2xl bg-white/70" />
            <Skeleton className="h-[240px] w-full rounded-2xl bg-white/70" />
            <Skeleton className="h-[240px] w-full rounded-2xl bg-white/70" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-5">
          <Skeleton className="h-[360px] w-full rounded-2xl bg-white/70" />
          <Skeleton className="h-[420px] w-full rounded-2xl bg-white/70" />
        </div>
      </div>
    </div>
  </Layout>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(
    user?.id || ''
  );
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(
    user?.id || ''
  );
  const { data: fundSources = [], isLoading: isLoadingFunds } = useFundSources(
    user?.id || ''
  );
  const { data: beneficiaries = [], isLoading: isLoadingBeneficiaries } = useBeneficiaries(
    user?.id || ''
  );

  const addBeneficiaryMutation = useAddBeneficiary();

  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [chartViewMode, setChartViewMode] = useState<'bar' | 'line'>('bar');
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Period filtering state for diagram
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7d');
  const [isCustomRangeModalOpen, setIsCustomRangeModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const [customStartDate, setCustomStartDate] = useState(thirtyDaysAgoStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [activeCustomRange, setActiveCustomRange] = useState<{ start: string; end: string } | null>(null);

  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) return;
    if (customStartDate > customEndDate) {
      toast({
        title: 'Rentang Tidak Valid',
        description: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.',
        variant: 'destructive',
      });
      return;
    }
    setActiveCustomRange({ start: customStartDate, end: customEndDate });
    setSelectedPeriod('custom');
    setHoveredDayIndex(null);
    setSelectedDayIndex(null);
    setIsCustomRangeModalOpen(false);
  };

  // Modal dialog state for adding beneficiary
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactBank, setContactBank] = useState('BCA');
  const [contactAccountNum, setContactAccountNum] = useState('');
  const [contactType, setContactType] = useState<'bank' | 'ewallet'>('bank');
  const [contactNotes, setContactNotes] = useState('');

  // Active accounts only
  const activeFundSources = useMemo(() => {
    return fundSources.filter((fs) => fs.is_active !== false);
  }, [fundSources]);

  // Current selected card in slider
  const currentCard = activeFundSources[activeCardIndex] || activeFundSources[0];
  const nextCardIndex = (activeCardIndex + 1) % (activeFundSources.length || 1);
  const nextCard = activeFundSources[nextCardIndex];

  // Aggregated totals
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const savedBalance = Math.max(0, totalIncome - totalExpenses);

  const totalFundBalance = useMemo(() => {
    if (activeFundSources.length > 0) {
      return activeFundSources.reduce((sum, fs) => sum + (fs.balance || 0), 0);
    }
    return savedBalance;
  }, [activeFundSources, savedBalance]);

  // Local rule-based insights
  const insights = useMemo(() => {
    return generateInsights(transactions, categories);
  }, [transactions, categories]);

  // Recent transactions sorted by date
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .filter((t) => !isNaN(new Date(t.transactionDate).getTime()))
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 7);
  }, [transactions]);

  // Dynamic activity data according to selected period (7d, 30d, 1y, custom)
  const chartActivityData = useMemo<ChartDataPoint[]>(() => {
    if (selectedPeriod === '7d') {
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const days: ChartDataPoint[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = dayNames[d.getDay()];

        const dayTx = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          return t.transactionDate.split('T')[0] === dateStr;
        });

        const income = dayTx
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = dayTx
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expense);

        days.push({
          id: dateStr,
          label: dayLabel,
          fullDate: d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          income,
          expense,
          savings,
        });
      }

      return days;
    }

    if (selectedPeriod === '30d') {
      // 5 buckets of 6 days each covering the past 30 days
      const buckets: ChartDataPoint[] = [];
      const now = new Date();

      for (let b = 4; b >= 0; b--) {
        const endOffset = b * 6;
        const startOffset = (b + 1) * 6 - 1;

        const startDate = new Date();
        startDate.setDate(now.getDate() - startOffset);
        const startStr = startDate.toISOString().split('T')[0];

        const endDate = new Date();
        endDate.setDate(now.getDate() - endOffset);
        const endStr = endDate.toISOString().split('T')[0];

        const bucketTx = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          const dStr = t.transactionDate.split('T')[0];
          return dStr >= startStr && dStr <= endStr;
        });

        const income = bucketTx
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = bucketTx
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expense);
        const bucketIndex = 5 - b;

        const formatShort = (d: Date) =>
          d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        buckets.push({
          id: `bucket-${b}`,
          label: `Mgg ${bucketIndex}`,
          fullDate: `${formatShort(startDate)} - ${formatShort(endDate)}`,
          income,
          expense,
          savings,
        });
      }

      return buckets;
    }

    if (selectedPeriod === '1y') {
      // 12 months of the current year
      const year = new Date().getFullYear();
      const monthShort = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];
      const monthFull = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];

      const months: ChartDataPoint[] = [];

      for (let m = 0; m < 12; m++) {
        const monthPrefix = `${year}-${String(m + 1).padStart(2, '0')}`;

        const monthTx = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          return t.transactionDate.startsWith(monthPrefix);
        });

        const income = monthTx
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthTx
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expense);

        months.push({
          id: `month-${m}`,
          label: monthShort[m],
          fullDate: `${monthFull[m]} ${year}`,
          income,
          expense,
          savings,
        });
      }

      return months;
    }

    if (selectedPeriod === 'custom') {
      const range = activeCustomRange || {
        start: thirtyDaysAgoStr,
        end: todayStr,
      };

      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Sub-case A: 14 days or fewer -> daily resolution
      if (diffDays <= 14) {
        const days: ChartDataPoint[] = [];
        for (let i = 0; i < diffDays; i++) {
          const cur = new Date(startDate);
          cur.setDate(startDate.getDate() + i);
          const dateStr = cur.toISOString().split('T')[0];

          const dayTx = transactions.filter((t) => {
            if (!t.transactionDate) return false;
            return t.transactionDate.split('T')[0] === dateStr;
          });

          const income = dayTx
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const expense = dayTx
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const savings = Math.max(0, income - expense);

          days.push({
            id: dateStr,
            label: `${cur.getDate()}/${cur.getMonth() + 1}`,
            fullDate: cur.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            income,
            expense,
            savings,
          });
        }
        return days;
      }

      // Sub-case B: More than 14 days -> 5 evenly spaced buckets
      const bucketCount = 5;
      const bucketDays = Math.ceil(diffDays / bucketCount);
      const buckets: ChartDataPoint[] = [];

      for (let b = 0; b < bucketCount; b++) {
        const bStart = new Date(startDate);
        bStart.setDate(startDate.getDate() + b * bucketDays);

        const bEnd = new Date(startDate);
        bEnd.setDate(startDate.getDate() + Math.min((b + 1) * bucketDays - 1, diffDays - 1));

        const bStartStr = bStart.toISOString().split('T')[0];
        const bEndStr = bEnd.toISOString().split('T')[0];

        const bucketTx = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          const dStr = t.transactionDate.split('T')[0];
          return dStr >= bStartStr && dStr <= bEndStr;
        });

        const income = bucketTx
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = bucketTx
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expense);

        const formatShort = (d: Date) =>
          d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        buckets.push({
          id: `custom-b-${b}`,
          label: `P${b + 1}`,
          fullDate: `${formatShort(bStart)} - ${formatShort(bEnd)}`,
          income,
          expense,
          savings,
        });
      }

      return buckets;
    }

    return [];
  }, [selectedPeriod, activeCustomRange, transactions, thirtyDaysAgoStr, todayStr]);

  // Categories breakdown strictly from actual user transactions
  const categoryAnalysis = useMemo(() => {
    const parentCats = categories.filter((c) => !c.parentId);
    const subCats = categories.filter((c) => c.parentId);

    const breakdown = parentCats.map((parent, idx) => {
      const parentSubIds = subCats
        .filter((s) => s.parentId === parent.id)
        .map((s) => s.id);
      const relevantCategoryIds = [parent.id, ...parentSubIds];

      const categoryExpenses = transactions
        .filter((t) => t.type === 'expense' && relevantCategoryIds.includes(t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        id: parent.id,
        name: parent.name,
        amount: categoryExpenses,
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

  // Real savings rate from actual income & expense
  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    const rate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
    return Math.max(0, Math.min(100, rate));
  }, [totalIncome, totalExpenses]);

  // Monthly budget limit (Rp 5.000.000)
  const monthlyBudgetLimit = 5000000;
  const budgetUsedPercentage = Math.min(
    100,
    Math.round((totalExpenses / monthlyBudgetLimit) * 100)
  );

  // Dynamic layout calculation for SVG (viewBox 540x180)
  const getBarLayout = (idx: number, total: number) => {
    const leftMargin = 32;
    const rightMargin = 20;
    const usableWidth = 540 - leftMargin - rightMargin;
    const safeTotal = Math.max(1, total);
    const step = usableWidth / safeTotal;
    const centerX = leftMargin + (idx + 0.5) * step;
    const barWidth = Math.min(32, Math.max(12, Math.round(step * 0.52)));
    const xPos = centerX - barWidth / 2;
    return { xPos, centerX, barWidth, step };
  };

  const activeTooltipIndex = hoveredDayIndex !== null ? hoveredDayIndex : selectedDayIndex;
  const activeTooltipDay =
    activeTooltipIndex !== null && activeTooltipIndex < chartActivityData.length
      ? chartActivityData[activeTooltipIndex]
      : null;
  const activeLayout =
    activeTooltipIndex !== null && activeTooltipIndex < chartActivityData.length
      ? getBarLayout(activeTooltipIndex, chartActivityData.length)
      : null;
  const tooltipLeftPercent = activeLayout
    ? Math.max(18, Math.min(82, (activeLayout.centerX / 540) * 100))
    : 50;

  // Maximum value across current chart points to scale bar & line chart smoothly
  const maxChartVal = useMemo(() => {
    const highest = Math.max(
      ...chartActivityData.map((d) => Math.max(d.income, d.expense, d.savings)),
      0
    );
    return Math.max(highest, 1000000); // Minimum 1 million scale
  }, [chartActivityData]);

  // Precomputed points for smooth SVG Line Chart
  const lineChartPoints = useMemo(() => {
    return chartActivityData.map((point, idx) => {
      const layout = getBarLayout(idx, chartActivityData.length);
      const yIncome = 150 - Math.min(125, (point.income / maxChartVal) * 120);
      const yExpense = 150 - Math.min(125, (point.expense / maxChartVal) * 120);
      const ySavings = 150 - Math.min(125, (point.savings / maxChartVal) * 120);
      return { x: layout.centerX, yIncome, yExpense, ySavings, point, step: layout.step };
    });
  }, [chartActivityData, maxChartVal]);

  // Aggregated totals for the selected period
  const periodSummary = useMemo(() => {
    const income = chartActivityData.reduce((sum, d) => sum + d.income, 0);
    const expense = chartActivityData.reduce((sum, d) => sum + d.expense, 0);
    const savings = Math.max(0, income - expense);
    return { income, expense, savings };
  }, [chartActivityData]);

  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const generateAreaPath = (pts: { x: number; y: number }[], baseY: number = 150) => {
    if (pts.length < 2) return '';
    const linePart = generateSmoothPath(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${linePart} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  };

  // Copy to clipboard handler
  const handleCopyAccountNumber = async (accountNum: string, name: string, bank: string) => {
    try {
      await navigator.clipboard.writeText(accountNum);
      setCopiedId(accountNum);
      toast({
        title: 'Berhasil Disalin! 📋',
        description: `Nomor rekening ${bank} a.n. ${name} (${accountNum}) telah disalin ke clipboard.`,
      });
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast({
        title: 'Gagal Menyalin',
        description: 'Silakan salin nomor rekening secara manual.',
        variant: 'destructive',
      });
    }
  };

  // Submit new beneficiary contact
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactAccountNum.trim() || !user?.id) {
      toast({
        title: 'Data belum lengkap',
        description: 'Mohon isi nama penerima dan nomor rekening/e-wallet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addBeneficiaryMutation.mutateAsync({
        user_id: user.id,
        name: contactName.trim(),
        bank_name: contactBank,
        account_number: contactAccountNum.trim(),
        account_type: contactType,
        notes: contactNotes.trim() || null,
      });

      toast({
        title: 'Kontak Tersimpan ✅',
        description: `Nomor ${contactBank} a.n. ${contactName} berhasil ditambahkan ke daftar transfer.`,
      });

      setIsAddContactOpen(false);
      setContactName('');
      setContactAccountNum('');
      setContactNotes('');
    } catch (err: any) {
      toast({
        title: 'Gagal Menyimpan',
        description: err.message || 'Terjadi kesalahan saat menyimpan data kontak.',
        variant: 'destructive',
      });
    }
  };

  const currentTheme = CARD_THEMES[currentCard?.color_theme || 'lime'] || CARD_THEMES.lime;

  if (isLoadingTransactions || isLoadingCategories || isLoadingFunds || isLoadingBeneficiaries) {
    return <DashboardLoading />;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-7 space-y-6">
        {/* ASYMMETRICAL 12-COLUMN MASTER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT 8 COLUMNS: SALDO, GRAFIK, BUDGET, ANALISIS BIAYA, KESEHATAN, TARGET */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. BALANCE OVERVIEW & 7-DAY BAR / LINE CHART CARD */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE3] shadow-sm">
              {/* Header section with Balance and View controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F2F5F0] gap-3">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-[#161F18] font-sans">
                      {formatRupiah(totalFundBalance)}
                    </span>
                    <span className="text-[12px] text-[#838E85] font-normal">
                      (Total Saldo Aktif)
                    </span>
                  </div>
                  <p className="text-[12px] text-[#838E85]">
                    Total saldo dari seluruh rekening &amp; dompet Anda
                  </p>
                </div>

                {/* Right controls: Legend & view toggles */}
                <div className="flex items-center gap-3">
                  <div className="items-center gap-3 text-[11px] text-[#717C73] font-medium hidden sm:flex">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-[#E2ED7C]" /> Tabungan
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-[#8DC53E]" /> Pemasukan
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-[#F5A87B]" /> Pengeluaran
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg border border-[#E1E5DF] text-[11px] font-semibold text-[#18211A] flex items-center gap-1.5 bg-[#F9FAF8] hover:bg-[#F0F3ED] transition-colors"
                        >
                          <CalendarIcon className="h-3 w-3 text-[#737E75]" />
                          <span>
                            {selectedPeriod === 'custom' && activeCustomRange
                              ? `${formatDate(activeCustomRange.start)} - ${formatDate(activeCustomRange.end)}`
                              : PERIOD_LABELS[selectedPeriod]}
                          </span>
                          <ChevronDown className="h-3 w-3 text-[#737E75]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-white border border-[#E5EAE3] shadow-lg rounded-xl p-1 z-50"
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPeriod('7d');
                            setHoveredDayIndex(null);
                            setSelectedDayIndex(null);
                          }}
                          className={`text-xs px-2.5 py-2 rounded-lg cursor-pointer ${
                            selectedPeriod === '7d'
                              ? 'bg-[#F2F6ED] font-bold text-[#18211A]'
                              : 'text-[#445046]'
                          }`}
                        >
                          7 Hari Terakhir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPeriod('30d');
                            setHoveredDayIndex(null);
                            setSelectedDayIndex(null);
                          }}
                          className={`text-xs px-2.5 py-2 rounded-lg cursor-pointer ${
                            selectedPeriod === '30d'
                              ? 'bg-[#F2F6ED] font-bold text-[#18211A]'
                              : 'text-[#445046]'
                          }`}
                        >
                          30 Hari Terakhir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPeriod('1y');
                            setHoveredDayIndex(null);
                            setSelectedDayIndex(null);
                          }}
                          className={`text-xs px-2.5 py-2 rounded-lg cursor-pointer ${
                            selectedPeriod === '1y'
                              ? 'bg-[#F2F6ED] font-bold text-[#18211A]'
                              : 'text-[#445046]'
                          }`}
                        >
                          Tahun Ini (12 Bulan)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 border-t border-[#F0F3ED]" />
                        <DropdownMenuItem
                          onClick={() => {
                            setIsCustomRangeModalOpen(true);
                          }}
                          className={`text-xs px-2.5 py-2 rounded-lg cursor-pointer flex items-center justify-between ${
                            selectedPeriod === 'custom'
                              ? 'bg-[#F2F6ED] font-bold text-[#18211A]'
                              : 'text-[#445046]'
                          }`}
                        >
                          <span>Rentang Kustom...</span>
                          <CalendarIcon className="h-3 w-3 text-[#737E75]" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('bar')}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                        chartViewMode === 'bar'
                          ? 'bg-[#18211A] text-white border-[#18211A]'
                          : 'border-[#E1E5DF] bg-white text-[#737E75] hover:bg-[#F5F6F3]'
                      }`}
                      title="Grafik Batang"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('line')}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                        chartViewMode === 'line'
                          ? 'bg-[#18211A] text-white border-[#18211A]'
                          : 'border-[#E1E5DF] bg-white text-[#737E75] hover:bg-[#F5F6F3]'
                      }`}
                      title="Grafik Garis"
                    >
                      <LineChart className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart & Summary Horizontal Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-center">
                {/* 7-Day Chart Viewport (8 cols) */}
                <div
                  className="md:col-span-8 relative pt-2 pb-1 overflow-x-auto"
                  onMouseLeave={() => setHoveredDayIndex(null)}
                >
                  <div className="min-w-[420px] relative">
                    {/* Floating Tooltip Card: ONLY renders on hover or click */}
                    {activeTooltipDay && activeTooltipIndex !== null && activeLayout && (
                      <div
                        className="absolute top-0 z-30 pointer-events-none transition-all duration-150 ease-out transform -translate-x-1/2 bg-white rounded-xl p-3 border border-[#E3E8DF] w-48 shadow-lg"
                        style={{
                          left: `${tooltipLeftPercent}%`,
                          boxShadow:
                            '0 12px 28px -4px rgba(24, 33, 26, 0.16), 0 4px 10px rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#F0F4ED]">
                          <span className="text-[10px] font-bold text-[#18211A] leading-tight truncate pr-1">
                            {activeTooltipDay.fullDate}
                          </span>
                          <span className="text-[9px] font-semibold text-[#869288] uppercase tracking-wider shrink-0">
                            {activeTooltipDay.label}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[#5D695F]">
                              <span className="w-2 h-2 rounded-full bg-[#E2ED7C] shrink-0" />
                              Tabungan
                            </span>
                            <span className="font-semibold text-[#18211A] font-numeric">
                              +{formatRupiah(activeTooltipDay.savings)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[#5D695F]">
                              <span className="w-2 h-2 rounded-full bg-[#8DC53E] shrink-0" />
                              Pemasukan
                            </span>
                            <span className="font-semibold text-[#18211A] font-numeric">
                              +{formatRupiah(activeTooltipDay.income)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[#5D695F]">
                              <span className="w-2 h-2 rounded-full bg-[#F5A87B] shrink-0" />
                              Pengeluaran
                            </span>
                            <span className="font-semibold text-[#18211A] font-numeric">
                              -{formatRupiah(activeTooltipDay.expense)}
                            </span>
                          </div>
                        </div>

                        {/* Downward indicator arrow */}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-[#E3E8DF] rotate-45" />
                      </div>
                    )}

                    <svg className="w-full h-44 overflow-visible" viewBox="0 0 540 180">
                      <defs>
                        <linearGradient id="chartIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8DC53E" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#8DC53E" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="chartExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F5A87B" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#F5A87B" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal guide lines */}
                      <line stroke="#F1F4EE" strokeDasharray="3 3" x1="25" x2="520" y1="20" y2="20" />
                      <line stroke="#F1F4EE" strokeDasharray="3 3" x1="25" x2="520" y1="65" y2="65" />
                      <line stroke="#F1F4EE" strokeDasharray="3 3" x1="25" x2="520" y1="110" y2="110" />
                      <line stroke="#E6EAE3" strokeWidth="1" x1="25" x2="520" y1="150" y2="150" />

                      {chartViewMode === 'bar' ? (
                        /* 1. BAR CHART VIEW */
                        chartActivityData.map((day, idx) => {
                          const layout = getBarLayout(idx, chartActivityData.length);
                          const isHighlighted = idx === activeTooltipIndex;
                          const hasActivity = day.income > 0 || day.expense > 0;
                          const incomeHeight =
                            day.income > 0 ? Math.max(16, (day.income / maxChartVal) * 110) : 0;
                          const expenseHeight =
                            day.expense > 0 ? Math.max(14, (day.expense / maxChartVal) * 110) : 0;

                          return (
                            <g
                              key={day.id || `${day.label}-${idx}`}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredDayIndex(idx)}
                              onMouseLeave={() => setHoveredDayIndex(null)}
                              onClick={() =>
                                setSelectedDayIndex((prev) => (prev === idx ? null : idx))
                              }
                            >
                              {/* Background hover / selection column */}
                              {isHighlighted && (
                                <rect
                                  x={layout.centerX - Math.max(layout.barWidth / 2 + 5, 18)}
                                  y={15}
                                  width={Math.max(layout.barWidth + 10, 36)}
                                  height="140"
                                  rx="8"
                                  fill="#F5F8F2"
                                  stroke="#E4EAE0"
                                  strokeWidth="0.8"
                                />
                              )}

                              {hasActivity ? (
                                <>
                                  {/* Income bar */}
                                  <rect
                                    fill={isHighlighted ? '#7EB534' : '#8DC53E'}
                                    height={incomeHeight}
                                    rx="4"
                                    width={layout.barWidth}
                                    x={layout.xPos}
                                    y={150 - incomeHeight}
                                  />
                                  {/* Expense bar */}
                                  {expenseHeight > 0 && (
                                    <rect
                                      fill={isHighlighted ? '#E89868' : '#F5A87B'}
                                      height={Math.min(expenseHeight, 35)}
                                      rx="4"
                                      width={layout.barWidth}
                                      x={layout.xPos}
                                      y={150 - Math.min(expenseHeight, 35)}
                                    />
                                  )}
                                </>
                              ) : (
                                /* Default subtle placeholder bar matching ACRU */
                                <rect
                                  fill={isHighlighted ? '#DDE4D8' : '#EFF2ED'}
                                  height={isHighlighted ? 42 : 30}
                                  rx="6"
                                  width={layout.barWidth}
                                  x={layout.xPos}
                                  y={isHighlighted ? 108 : 120}
                                  className="transition-all duration-150"
                                />
                              )}

                              <text
                                fill={isHighlighted ? '#172019' : '#889389'}
                                fontFamily="Plus Jakarta Sans"
                                fontSize={chartActivityData.length > 10 ? '9' : '10'}
                                fontWeight={isHighlighted ? '700' : '500'}
                                textAnchor="middle"
                                x={layout.centerX}
                                y="168"
                              >
                                {day.label}
                              </text>
                            </g>
                          );
                        })
                      ) : (
                        /* 2. LINE CHART VIEW */
                        <g>
                          {/* Income smooth area & curve */}
                          <path
                            d={generateAreaPath(lineChartPoints.map((p) => ({ x: p.x, y: p.yIncome })))}
                            fill="url(#chartIncomeGrad)"
                          />
                          <path
                            d={generateSmoothPath(
                              lineChartPoints.map((p) => ({ x: p.x, y: p.yIncome }))
                            )}
                            fill="none"
                            stroke="#8DC53E"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />

                          {/* Expense smooth area & curve */}
                          <path
                            d={generateAreaPath(
                              lineChartPoints.map((p) => ({ x: p.x, y: p.yExpense }))
                            )}
                            fill="url(#chartExpenseGrad)"
                          />
                          <path
                            d={generateSmoothPath(
                              lineChartPoints.map((p) => ({ x: p.x, y: p.yExpense }))
                            )}
                            fill="none"
                            stroke="#F5A87B"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />

                          {/* Savings dashed guide line */}
                          <path
                            d={generateSmoothPath(
                              lineChartPoints.map((p) => ({ x: p.x, y: p.ySavings }))
                            )}
                            fill="none"
                            stroke="#CCD85E"
                            strokeWidth="1.8"
                            strokeDasharray="4 3"
                          />

                          {/* Interactive data points */}
                          {lineChartPoints.map((p, idx) => {
                            const isHighlighted = idx === activeTooltipIndex;
                            const hitWidth = Math.max(28, p.step || 36);

                            return (
                              <g
                                key={p.point.id || `${p.point.label}-${idx}`}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredDayIndex(idx)}
                                onMouseLeave={() => setHoveredDayIndex(null)}
                                onClick={() =>
                                  setSelectedDayIndex((prev) => (prev === idx ? null : idx))
                                }
                              >
                                {/* Wide invisible hit area */}
                                <rect
                                  x={p.x - hitWidth / 2}
                                  y={15}
                                  width={hitWidth}
                                  height="145"
                                  fill="transparent"
                                />

                                {/* Vertical guide line on active day */}
                                {isHighlighted && (
                                  <line
                                    x1={p.x}
                                    x2={p.x}
                                    y1={20}
                                    y2={150}
                                    stroke="#8DC53E"
                                    strokeDasharray="3 3"
                                    strokeWidth="1.5"
                                  />
                                )}

                                {/* Income node circle */}
                                <circle
                                  cx={p.x}
                                  cy={p.yIncome}
                                  r={isHighlighted ? 5.5 : 4}
                                  fill="#8DC53E"
                                  stroke="#FFFFFF"
                                  strokeWidth="2"
                                />

                                {/* Expense node circle */}
                                <circle
                                  cx={p.x}
                                  cy={p.yExpense}
                                  r={isHighlighted ? 5.5 : 4}
                                  fill="#F5A87B"
                                  stroke="#FFFFFF"
                                  strokeWidth="2"
                                />

                                <text
                                  fill={isHighlighted ? '#172019' : '#889389'}
                                  fontFamily="Plus Jakarta Sans"
                                  fontSize={chartActivityData.length > 10 ? '9' : '10'}
                                  fontWeight={isHighlighted ? '700' : '500'}
                                  textAnchor="middle"
                                  x={p.x}
                                  y="168"
                                >
                                  {p.point.label}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      )}
                    </svg>
                  </div>
                </div>

                {/* Right Stacked Summary (4 cols) */}
                <div className="md:col-span-4 space-y-4 border-l border-[#F0F3ED] pl-4 sm:pl-5">
                  <div>
                    <span className="text-[11px] text-[#818C83] uppercase tracking-wider block font-semibold">
                      Total Pemasukan
                    </span>
                    <span className="text-[19px] sm:text-[20px] font-bold text-[#161F18] font-sans block">
                      {formatRupiah(periodSummary.income)}
                    </span>
                    <span className="text-[10px] text-[#869288] font-medium flex items-center gap-0.5 mt-0.5">
                      {selectedPeriod === 'custom' && activeCustomRange
                        ? `${formatDate(activeCustomRange.start)} - ${formatDate(activeCustomRange.end)}`
                        : PERIOD_LABELS[selectedPeriod]}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#818C83] uppercase tracking-wider block font-semibold">
                      Total Pengeluaran
                    </span>
                    <span className="text-[19px] sm:text-[20px] font-bold text-[#161F18] font-sans block">
                      {formatRupiah(periodSummary.expense)}
                    </span>
                    <span className="text-[10px] text-[#869288] font-medium flex items-center gap-0.5 mt-0.5">
                      {selectedPeriod === 'custom' && activeCustomRange
                        ? `${formatDate(activeCustomRange.start)} - ${formatDate(activeCustomRange.end)}`
                        : PERIOD_LABELS[selectedPeriod]}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#818C83] uppercase tracking-wider block font-semibold">
                      Saldo Tersimpan
                    </span>
                    <span className="text-[19px] sm:text-[20px] font-bold text-[#161F18] font-sans block">
                      {formatRupiah(periodSummary.savings)}
                    </span>
                    <span className="text-[10px] text-[#4A7C1E] font-medium flex items-center gap-0.5 mt-0.5">
                      <ArrowUpRight className="h-3 w-3" /> Pemasukan - Pengeluaran
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MIDDLE ROW: Monthly Spending Limit & Budget Tip (2 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Monthly Spending Limit Card (6 cols) */}
              <div className="md:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EAE3] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[14px] text-[#161F18]">
                      Batas Pengeluaran Bulanan
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigate('/budget')}
                      className="text-[#98A39A] hover:text-[#172019]"
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
                      Plafon: {formatRupiah(monthlyBudgetLimit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Budget Tip / Insights Card (6 cols) */}
              <div className="md:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EAE3] shadow-sm flex items-center justify-between gap-3">
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
            </div>

            {/* 3. BOTTOM ROW: Cost Analysis, Financial Health, Goal Tracker (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card A: Cost Analysis */}
              <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between">
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

              {/* Card B: Financial Health (Gauge Semicircle) */}
              <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between">
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

              {/* Card C: Goal Tracker */}
              <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#F2F5F0]">
                    <h4 className="font-bold text-[13px] text-[#161F18]">
                      Target Keuangan
                    </h4>
                    <button
                      type="button"
                      onClick={() => navigate('/budget')}
                      className="text-[10px] font-semibold text-[#18211A] hover:text-[#8DC53E] flex items-center gap-0.5"
                    >
                      + Tambah
                    </button>
                  </div>

                  {/* Goal Group: Dana Cadangan */}
                  <div className="mt-2.5 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded bg-[#F4F7F1] flex items-center justify-center text-[#4A7C1E] shrink-0 mt-0.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#18211A]">
                            Dana Cadangan Kas
                          </span>
                          <span className="text-[10px] font-numeric text-[#7B867D]">
                            {formatRupiah(totalFundBalance)}
                          </span>
                        </div>
                        <div className="w-full bg-[#EBF0E6] h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-[#8DC53E] h-full rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((totalFundBalance / 10000000) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-[#8E9A90] mt-0.5 block">
                          Target kas minimum bisnis
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F2F5F0] text-center">
                      <p className="text-[10px] text-[#8E9A90]">
                        Kelola alokasi pos anggaran di menu Anggaran
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/budget')}
                        className="mt-1 text-[10px] font-bold text-[#18211A] hover:text-[#8DC53E]"
                      >
                        Buka Menu Anggaran &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: KARTU SAYA (SLIDER CAROUSEL), CATATAN REKENING TRANSFER, RIWAYAT TRANSAKSI */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. KARTU SAYA & AKUN DANA (INTERACTIVE CARD SLIDER) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE3] shadow-sm">
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h3 className="font-bold text-[14px] text-[#161F18]">Rekening &amp; Dompet</h3>
                  <span className="text-[11px] text-[#859087]">
                    {activeFundSources.length} akun aktif
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCardIndex((prev) =>
                        prev === 0 ? activeFundSources.length - 1 : prev - 1
                      )
                    }
                    disabled={activeFundSources.length <= 1}
                    className="w-6 h-6 rounded-lg border border-[#E2E6DF] flex items-center justify-center text-[#68736A] hover:bg-[#F5F6F3] disabled:opacity-30"
                    title="Kartu sebelumnya"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCardIndex((prev) => (prev + 1) % activeFundSources.length)
                    }
                    disabled={activeFundSources.length <= 1}
                    className="w-6 h-6 rounded-lg border border-[#E2E6DF] flex items-center justify-center text-[#68736A] hover:bg-[#F5F6F3] disabled:opacity-30"
                    title="Kartu berikutnya"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/transactions')}
                    className="text-[11px] font-semibold text-[#18211A] hover:text-[#8DC53E] ml-1 flex items-center gap-0.5"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {/* DUAL CARD CAROUSEL SLIDER MATCHING ACRU */}
              {currentCard ? (
                <div>
                  <div className="relative overflow-hidden py-1">
                    <div className="flex gap-2.5 items-center">
                      {/* Active Main Card */}
                      <div
                        className={`w-[84%] ${currentTheme.bg} ${currentTheme.text} p-4 rounded-2xl shrink-0 shadow-sm relative overflow-hidden flex flex-col justify-between h-40 transition-all duration-300`}
                      >
                        {/* Background subtle curved rings */}
                        <div
                          className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full border ${currentTheme.ringColor} pointer-events-none`}
                        />
                        <div
                          className={`absolute -right-2 -bottom-2 w-40 h-40 rounded-full border ${currentTheme.ringColor} pointer-events-none`}
                        />

                        {/* Top: Card Type & Bank/Brand Name */}
                        <div className="flex items-center justify-between relative z-10">
                          <span
                            className={`text-[9.5px] uppercase font-bold tracking-wider ${currentTheme.subText}`}
                          >
                            {currentCard.type === 'cash'
                              ? 'Kas Tunai'
                              : currentCard.type === 'wallet'
                              ? 'E-Wallet'
                              : 'Kartu Rekening'}
                          </span>
                          <span className="text-[13px] font-extrabold italic tracking-wider font-sans">
                            {currentCard.name.toUpperCase()}
                          </span>
                        </div>

                        {/* Middle: Chip & Saldo */}
                        <div className="relative z-10 flex items-center justify-between my-1">
                          {currentCard.type !== 'cash' ? (
                            <div
                              className={`w-6 h-5 rounded ${currentTheme.chipBg} border ${currentTheme.chipBorder} flex items-center justify-center`}
                            >
                              <div className="w-3.5 h-3 border border-black/20 rounded-xs" />
                            </div>
                          ) : (
                            <div className="w-6 h-5 flex items-center justify-center">
                              <Coins className="h-4 w-4 opacity-75" />
                            </div>
                          )}
                          <span className="font-extrabold text-[17px] font-sans tracking-tight">
                            {formatRupiah(currentCard.balance)}
                          </span>
                        </div>

                        {/* Bottom: Masked Number & Holder Name */}
                        <div className="relative z-10">
                          <div className="font-numeric tracking-widest text-[13px] font-bold">
                            {currentCard.account_number && currentCard.account_number !== '-'
                              ? `•••• •••• ${currentCard.account_number.slice(-4)}`
                              : 'KAS OPERASIONAL'}
                          </div>
                          <div
                            className={`flex items-center justify-between text-[10px] font-medium ${currentTheme.subText} mt-1`}
                          >
                            <span className="uppercase truncate max-w-[130px]">
                              {currentCard.account_holder_name ||
                                user?.email?.split('@')[0] ||
                                'Arya Danuarta'}
                            </span>
                            {currentCard.card_expiry && (
                              <span className="font-numeric font-bold">
                                {currentCard.card_expiry}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Peeking Next Card on Right */}
                      {nextCard && nextCard.id !== currentCard.id && (
                        <div
                          onClick={() => setActiveCardIndex(nextCardIndex)}
                          className="w-[18%] bg-[#E8EDE5] p-3 rounded-2xl shrink-0 opacity-60 flex flex-col justify-between h-40 border border-[#DCE2D9] cursor-pointer hover:opacity-90 transition-opacity"
                          title="Klik untuk melihat kartu ini"
                        >
                          <span className="text-[8.5px] uppercase font-bold text-[#6D776E] truncate">
                            {nextCard.name}
                          </span>
                          <div className="font-numeric text-[8.5px] tracking-wider text-[#6D776E]">
                            •••• {nextCard.account_number ? nextCard.account_number.slice(-4) : '4321'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Indicator Dots for Card Slider */}
                  {activeFundSources.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      {activeFundSources.map((fs, idx) => (
                        <button
                          key={fs.id}
                          type="button"
                          onClick={() => setActiveCardIndex(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === activeCardIndex
                              ? 'w-5 bg-[#8DC53E]'
                              : 'w-1.5 bg-[#DCE2D8] hover:bg-[#8DC53E]/50'
                          }`}
                          title={fs.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-[#869288]">
                  <Wallet className="h-6 w-6 mx-auto text-[#CBD5CA] mb-1" />
                  <p className="text-[12px] font-medium text-[#161F18]">Belum ada akun terdaftar</p>
                  <button
                    type="button"
                    onClick={() => navigate('/transactions')}
                    className="mt-2 text-[11px] font-semibold text-[#8DC53E]"
                  >
                    + Tambah Rekening Pertama
                  </button>
                </div>
              )}

              {/* Quick Action Icon Buttons Row: Top up, Kirim, Minta, Riwayat, Lainnya */}
              <div className="grid grid-cols-5 gap-2 pt-4 border-t border-[#F2F5F0] mt-3">
                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F6F8F4] group-hover:bg-[#E9F2DC] text-[#172019] flex items-center justify-center border border-[#E3E8E0] transition-colors">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-[#69746B] font-medium">Top up</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F6F8F4] group-hover:bg-[#E9F2DC] text-[#172019] flex items-center justify-center border border-[#E3E8E0] transition-colors">
                    <Send className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-[#69746B] font-medium">Kirim</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F6F8F4] group-hover:bg-[#E9F2DC] text-[#172019] flex items-center justify-center border border-[#E3E8E0] transition-colors">
                    <ArrowDownToLine className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-[#69746B] font-medium">Minta</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F6F8F4] group-hover:bg-[#E9F2DC] text-[#172019] flex items-center justify-center border border-[#E3E8E0] transition-colors">
                    <History className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-[#69746B] font-medium">Riwayat</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F6F8F4] group-hover:bg-[#E9F2DC] text-[#172019] flex items-center justify-center border border-[#E3E8E0] transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-[#69746B] font-medium">Lainnya</span>
                </button>
              </div>
            </div>

            {/* 2. BUKU REKENING & KONTAK TRANSFER (DENGAN FITUR 1-KLIK COPY KE CLIPBOARD) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE3] shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#F2F5F0]">
                <div>
                  <h3 className="font-bold text-[14px] text-[#161F18]">Buku Rekening Transfer</h3>
                  <span className="text-[11px] text-[#859087]">
                    Klik salin untuk nomor rekening / e-wallet
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(true)}
                  className="text-[11px] font-semibold text-[#18211A] hover:text-[#8DC53E] flex items-center gap-1 bg-[#F5F7F3] px-2.5 py-1 rounded-lg border border-[#E2E6DF] transition-colors"
                >
                  <Plus className="h-3 w-3" /> Tambah
                </button>
              </div>

              {/* Beneficiary contacts list with 1-click copy */}
              <div className="mt-3 space-y-2.5">
                {beneficiaries.length > 0 ? (
                  beneficiaries.map((b) => {
                    const isCopied = copiedId === b.account_number;
                    const isEWallet = b.account_type === 'ewallet';

                    return (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E7ECE4] hover:bg-white hover:border-[#8DC53E] transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                              isEWallet
                                ? 'bg-[#E2ED7C] text-[#283811]'
                                : 'bg-[#EBF6DC] text-[#4A7C1E]'
                            }`}
                          >
                            {b.bank_name.slice(0, 3).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[12px] text-[#161F18] leading-tight truncate">
                                {b.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#EAEFE7] text-[#556257] font-semibold uppercase">
                                {b.bank_name}
                              </span>
                            </div>
                            <span className="text-[11px] font-numeric font-medium text-[#68756A] block leading-tight tracking-wide mt-0.5">
                              {b.account_number}
                            </span>
                            {b.notes && (
                              <span className="text-[9.5px] text-[#8A958C] block truncate">
                                {b.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 1-Click Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopyAccountNumber(b.account_number, b.name, b.bank_name)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all ${
                            isCopied
                              ? 'bg-[#EBF6DC] border-[#8DC53E] text-[#4A7C1E]'
                              : 'bg-white border-[#DCE2D8] hover:bg-[#8DC53E] hover:border-[#8DC53E] hover:text-white text-[#172019]'
                          }`}
                          title="Salin nomor rekening"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-[#6A766C]" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-[#869288]">
                    <Smartphone className="h-6 w-6 mx-auto text-[#CBD5CA] mb-1" />
                    <p className="text-[12px] font-medium text-[#161F18]">
                      Belum ada catatan rekening tujuan
                    </p>
                    <p className="text-[10px] mt-0.5 text-[#869288]">
                      Simpan nomor rekening / e-wallet agar bisa langsung disalin
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddContactOpen(true)}
                      className="mt-3 px-3 py-1.5 bg-[#18211A] text-white rounded-lg text-[11px] font-semibold hover:bg-[#253228] transition-colors"
                    >
                      + Tambah Kontak Pertama
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. RIWAYAT TRANSAKSI TERKINI */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAE3] shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#F2F5F0]">
                <h3 className="font-bold text-[14px] text-[#161F18]">Riwayat Transaksi</h3>
                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="text-[11px] font-semibold text-[#18211A] hover:text-[#8DC53E] transition-colors"
                >
                  Lihat Semua
                </button>
              </div>

              {/* Transaction list */}
              <div className="divide-y divide-[#F2F5F0]">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <div
                        key={tx.id}
                        className="py-2.5 flex items-center justify-between hover:bg-[#F9FAF8] px-1 rounded-lg transition-colors cursor-pointer"
                        onClick={() => navigate('/transactions')}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-[#EBF6DC] text-[#4A7C1E]'
                                : isTransfer
                                ? 'bg-[#F4F7F1] text-[#172019]'
                                : 'bg-[#FFF2EE] text-[#F5A87B]'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : isTransfer ? (
                              <Wallet className="h-4 w-4" />
                            ) : (
                              <Receipt className="h-4 w-4" />
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-[12px] text-[#161F18] block leading-tight truncate">
                              {tx.description}
                            </span>
                            <span className="text-[10px] text-[#869288] leading-tight block">
                              {formatDate(tx.transactionDate)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span
                            className={`text-[12px] font-bold font-numeric block ${
                              isIncome ? 'text-[#4A7C1E]' : 'text-[#161F18]'
                            }`}
                          >
                            {isIncome ? '+ ' : '- '}
                            {formatRupiah(tx.amount)}
                          </span>
                          <span className="text-[9.5px] text-[#869288] block">
                            Selesai
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-[#869288]">
                    <Receipt className="h-8 w-8 mx-auto text-[#CBD5CA] mb-2" />
                    <p className="text-[12px] font-medium text-[#161F18]">Belum ada transaksi</p>
                    <p className="text-[10px] mt-0.5">Mulai catat transaksi pertama Anda</p>
                    <button
                      type="button"
                      onClick={() => navigate('/transactions')}
                      className="mt-3 px-3 py-1.5 bg-[#18211A] text-white rounded-lg text-[11px] font-semibold hover:bg-[#253228] transition-colors"
                    >
                      + Tambah Transaksi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG TAMBAH KONTAK REKENING / E-WALLET */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-[#161F18]">
              Tambah Rekening / Kontak Transfer
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#78857B]">
              Simpan nomor rekening bank atau e-wallet agar mudah disalin saat ingin transfer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveContact} className="space-y-3.5 pt-2">
            <div>
              <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                Nama Penerima / Pemilik Rekening
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contoh: Budi Santoso, Vendor Kopi"
                className="w-full h-9 px-3 rounded-xl border border-[#DCE2D8] text-[13px] text-[#172019] placeholder:text-[#9AA59C] focus:outline-none focus:border-[#8DC53E] focus:ring-1 focus:ring-[#8DC53E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                  Bank / E-Wallet
                </label>
                <select
                  value={contactBank}
                  onChange={(e) => {
                    const val = e.target.value;
                    setContactBank(val);
                    if (['GoPay', 'OVO', 'DANA', 'ShopeePay'].includes(val)) {
                      setContactType('ewallet');
                    } else {
                      setContactType('bank');
                    }
                  }}
                  className="w-full h-9 px-2 rounded-xl border border-[#DCE2D8] text-[12px] text-[#172019] focus:outline-none focus:border-[#8DC53E] bg-white"
                >
                  {BANK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                  Tipe Akun
                </label>
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value as 'bank' | 'ewallet')}
                  className="w-full h-9 px-2 rounded-xl border border-[#DCE2D8] text-[12px] text-[#172019] focus:outline-none focus:border-[#8DC53E] bg-white"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="ewallet">E-Wallet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                Nomor Rekening / Nomor HP
              </label>
              <input
                type="text"
                required
                value={contactAccountNum}
                onChange={(e) => setContactAccountNum(e.target.value)}
                placeholder="Contoh: 1234567890 atau 08123456789"
                className="w-full h-9 px-3 rounded-xl border border-[#DCE2D8] text-[13px] font-numeric text-[#172019] placeholder:text-[#9AA59C] focus:outline-none focus:border-[#8DC53E] focus:ring-1 focus:ring-[#8DC53E]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                placeholder="Contoh: Pembayaran Bahan Baku, Sewa Kantor"
                className="w-full h-9 px-3 rounded-xl border border-[#DCE2D8] text-[12px] text-[#172019] placeholder:text-[#9AA59C] focus:outline-none focus:border-[#8DC53E]"
              />
            </div>

            <DialogFooter className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddContactOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-[#DCE2D8] text-[12px] font-semibold text-[#68736A] hover:bg-[#F5F6F3]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={addBeneficiaryMutation.isPending}
                className="px-4 py-1.5 rounded-xl bg-[#18211A] text-white text-[12px] font-semibold hover:bg-[#253228] transition-colors disabled:opacity-50"
              >
                {addBeneficiaryMutation.isPending ? 'Menyimpan...' : 'Simpan Kontak'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Date Range Selection Modal */}
      <Dialog open={isCustomRangeModalOpen} onOpenChange={setIsCustomRangeModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-2xl border border-[#E5EAE3] p-5 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-[#161F18] flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#8DC53E]" />
              Pilih Rentang Tanggal
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#78857B]">
              Tentukan periode tanggal untuk melihat analisis diagram pemasukan &amp; pengeluaran.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={customStartDate}
                max={customEndDate || undefined}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#DCE2D8] text-[12px] text-[#172019] focus:outline-none focus:border-[#8DC53E] focus:ring-1 focus:ring-[#8DC53E]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={customEndDate}
                min={customStartDate || undefined}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#DCE2D8] text-[12px] text-[#172019] focus:outline-none focus:border-[#8DC53E] focus:ring-1 focus:ring-[#8DC53E]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCustomRangeModalOpen(false)}
              className="px-3.5 py-1.5 rounded-xl border border-[#DCE2D8] text-[12px] font-semibold text-[#68736A] hover:bg-[#F5F6F3] transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApplyCustomRange}
              disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
              className="px-4 py-1.5 rounded-xl bg-[#18211A] text-white text-[12px] font-semibold hover:bg-[#253228] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Terapkan Filter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}