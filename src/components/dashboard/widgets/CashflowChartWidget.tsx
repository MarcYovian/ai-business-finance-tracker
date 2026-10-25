import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  BarChart2,
  LineChart,
  ArrowUpRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/currency';
import { Transaction } from '@/types/finance';
import { PeriodType } from '../types';
import { PERIOD_LABELS } from '../constants';
import { useCashflowChartData } from '../hooks/useCashflowChartData';
import { CustomDateRangeDialog } from '../dialogs/CustomDateRangeDialog';

interface CashflowChartWidgetProps {
  transactions: Transaction[];
  totalFundBalance: number;
}

export function CashflowChartWidget({
  transactions,
  totalFundBalance,
}: CashflowChartWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7d');
  const [chartViewMode, setChartViewMode] = useState<'bar' | 'line'>('bar');
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Custom range dialog state
  const [isCustomRangeModalOpen, setIsCustomRangeModalOpen] = useState(false);
  const [activeCustomRange, setActiveCustomRange] = useState<{ start: string; end: string } | null>(null);

  const {
    chartActivityData,
    periodSummary,
    maxChartVal,
    todayStr,
    thirtyDaysAgoStr,
  } = useCashflowChartData({
    transactions,
    selectedPeriod,
    activeCustomRange,
  });

  const handleApplyCustomRange = (start: string, end: string) => {
    setActiveCustomRange({ start, end });
    setSelectedPeriod('custom');
    setHoveredDayIndex(null);
    setSelectedDayIndex(null);
  };

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

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5EAE3] shadow-sm">
      {/* Header section with Balance and View controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F2F5F0] gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-[#161F18] font-sans">
              {formatCurrency(totalFundBalance)}
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
        {/* Chart Viewport (8 cols) */}
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
                      +{formatCurrency(activeTooltipDay.savings)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#5D695F]">
                      <span className="w-2 h-2 rounded-full bg-[#8DC53E] shrink-0" />
                      Pemasukan
                    </span>
                    <span className="font-semibold text-[#18211A] font-numeric">
                      +{formatCurrency(activeTooltipDay.income)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#5D695F]">
                      <span className="w-2 h-2 rounded-full bg-[#F5A87B] shrink-0" />
                      Pengeluaran
                    </span>
                    <span className="font-semibold text-[#18211A] font-numeric">
                      -{formatCurrency(activeTooltipDay.expense)}
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
              {formatCurrency(periodSummary.income)}
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
              {formatCurrency(periodSummary.expense)}
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
              {formatCurrency(periodSummary.savings)}
            </span>
            <span className="text-[10px] text-[#4A7C1E] font-medium flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="h-3 w-3" /> Pemasukan - Pengeluaran
            </span>
          </div>
        </div>
      </div>

      {/* Custom Date Range Selection Modal */}
      <CustomDateRangeDialog
        open={isCustomRangeModalOpen}
        onOpenChange={setIsCustomRangeModalOpen}
        initialStart={activeCustomRange?.start || thirtyDaysAgoStr}
        initialEnd={activeCustomRange?.end || todayStr}
        onApply={handleApplyCustomRange}
      />
    </div>
  );
}
