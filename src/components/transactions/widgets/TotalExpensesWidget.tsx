import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

interface TotalExpensesWidgetProps {
  totalAmount: number; // in cents
  momPercent: number;
  sparklineData?: number[];
}

export function TotalExpensesWidget({
  totalAmount,
  momPercent,
  sparklineData = [10, 15, 28, 22, 40, 35, 60, 45],
}: TotalExpensesWidgetProps) {
  // Generate smooth SVG curve matching reference design
  const svgPath = React.useMemo(() => {
    if (!sparklineData || sparklineData.length < 2) return 'M 2 24 Q 20 8, 38 20 T 68 8';
    const width = 72;
    const height = 28;
    const padding = 3;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y };
    });

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      path += ` C ${mx},${p0.y} ${mx},${p1.y} ${p1.x},${p1.y}`;
    }
    return path;
  }, [sparklineData]);

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs hover:shadow-sm transition-shadow">
      <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          {/* Coral / Red Down Arrow Box */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FDEEED] text-[#E04D3D] flex items-center justify-center shrink-0">
            <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <span className="text-[11px] sm:text-[12px] font-medium text-[#737E75] block leading-tight">
              Total Expenses
            </span>
            <div className="text-lg sm:text-xl md:text-[22px] font-bold text-[#161F18] leading-tight my-0.5 truncate">
              {formatCurrency(totalAmount)}
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#E04D3D] truncate">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              <span>{Math.abs(momPercent)}%</span>
              <span className="text-[#8B968D] font-normal ml-0.5 hidden xs:inline">from last month</span>
            </div>
          </div>
        </div>

        {/* Coral Sparkline Curve */}
        <div className="w-14 sm:w-20 h-7 sm:h-8 shrink-0 flex items-center justify-end">
          <svg viewBox="0 0 76 32" className="w-full h-full overflow-visible">
            <path
              d={svgPath}
              fill="none"
              stroke="#E04D3D"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
