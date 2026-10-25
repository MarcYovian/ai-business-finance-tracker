import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { STATUS_CONFIG } from '../constants';

interface TotalBudgetUsageWidgetProps {
  averageUsagePercentage: number;
  timeRangeLabel: string;
  onTrackCount: number;
  nearLimitCount: number;
  overBudgetCount: number;
}

export const TotalBudgetUsageWidget: React.FC<TotalBudgetUsageWidgetProps> = ({
  averageUsagePercentage,
  timeRangeLabel,
  onTrackCount,
  nearLimitCount,
  overBudgetCount,
}) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const slices = React.useMemo(() => {
    return [
      {
        name: 'On track',
        count: onTrackCount,
        color: STATUS_CONFIG.on_track.dotColor,
        sub: '<=80% of budget',
      },
      {
        name: 'Near limit',
        count: nearLimitCount,
        color: STATUS_CONFIG.near_limit.dotColor,
        sub: '81-100% of budget',
      },
      {
        name: 'Over budget',
        count: overBudgetCount,
        color: STATUS_CONFIG.over_budget.dotColor,
        sub: '>100% of budget',
      },
    ].filter((s) => s.count > 0);
  }, [onTrackCount, nearLimitCount, overBudgetCount]);

  const chartData = slices.length > 0 ? slices : [{ name: 'On track', count: 1, color: '#529E42', sub: '' }];

  const activeSlice = activeIndex !== null && chartData[activeIndex] ? chartData[activeIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 shadow-2xs space-y-4">
      <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
        Total Budget Usage
      </h3>

      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-4 sm:gap-6">
        {/* Donut Chart with Center Text */}
        <div className="relative w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 50, outline: 'none' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl border border-[#E2E6DF] text-xs pointer-events-none min-w-[130px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#172019]">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#6D776F]">
                        <span>Count:</span>
                        <span className="font-bold text-[#172019]">
                          {item.count} {item.count === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={2}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => {
                  const isHovered = activeIndex === index;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: 'center center',
                        filter: isHovered
                          ? 'brightness(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.15))'
                          : 'none',
                      }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Summary Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            {activeSlice ? (
              <>
                <span
                  className="text-[11px] font-bold truncate max-w-[90px] block leading-tight"
                  style={{ color: activeSlice.color }}
                >
                  {activeSlice.name}
                </span>
                <span className="text-[14px] font-extrabold text-[#172019] leading-tight mt-0.5">
                  {activeSlice.count} {activeSlice.count === 1 ? 'month' : 'months'}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl sm:text-2xl font-extrabold text-[#172019] leading-tight">
                  {averageUsagePercentage}%
                </span>
                <span className="text-[10px] font-bold text-[#6D776F] leading-tight mt-0.5">
                  Avg. Usage
                </span>
                <span className="text-[9px] text-[#869288] leading-tight mt-0.5 truncate max-w-[100px]">
                  {timeRangeLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend List on Right / Below */}
        <div className="flex-1 w-full space-y-1 min-w-0">
          {/* On track */}
          <div
            className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-[#F9FAF8] transition-colors cursor-pointer"
            onMouseEnter={() => {
              const idx = chartData.findIndex((c) => c.name === 'On track');
              if (idx !== -1) setActiveIndex(idx);
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_CONFIG.on_track.dotColor }}
              />
              <span className="text-[#556057] font-medium truncate">
                On track
              </span>
            </div>
            <span className="font-bold text-[#172019] shrink-0 ml-2">
              {onTrackCount} {onTrackCount === 1 ? 'month' : 'months'}
            </span>
          </div>

          {/* Near limit */}
          <div
            className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-[#F9FAF8] transition-colors cursor-pointer"
            onMouseEnter={() => {
              const idx = chartData.findIndex((c) => c.name === 'Near limit');
              if (idx !== -1) setActiveIndex(idx);
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_CONFIG.near_limit.dotColor }}
              />
              <span className="text-[#556057] font-medium truncate">
                Near limit
              </span>
            </div>
            <span className="font-bold text-[#172019] shrink-0 ml-2">
              {nearLimitCount} {nearLimitCount === 1 ? 'month' : 'months'}
            </span>
          </div>

          {/* Over budget */}
          <div
            className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-[#F9FAF8] transition-colors cursor-pointer"
            onMouseEnter={() => {
              const idx = chartData.findIndex((c) => c.name === 'Over budget');
              if (idx !== -1) setActiveIndex(idx);
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_CONFIG.over_budget.dotColor }}
              />
              <span className="text-[#556057] font-medium truncate">
                Over budget
              </span>
            </div>
            <span className="font-bold text-[#172019] shrink-0 ml-2">
              {overBudgetCount} {overBudgetCount === 1 ? 'month' : 'months'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
