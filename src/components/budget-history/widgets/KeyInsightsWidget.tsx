import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react';
import { BudgetHistoryInsight } from '../types';

interface KeyInsightsWidgetProps {
  insights: BudgetHistoryInsight[];
  onViewDetails?: () => void;
}

export const KeyInsightsWidget: React.FC<KeyInsightsWidgetProps> = ({
  insights,
  onViewDetails,
}) => {
  const getInsightConfig = (type: BudgetHistoryInsight['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: TrendingUp,
          bg: 'bg-[#EDF8E8]',
          color: 'text-[#529E42]',
        };
      case 'warning':
        return {
          icon: TrendingDown,
          bg: 'bg-[#FEF9C3]',
          color: 'text-[#854D0E]',
        };
      case 'danger':
        return {
          icon: AlertCircle,
          bg: 'bg-[#FEE2E2]',
          color: 'text-[#EF4444]',
        };
      default:
        return {
          icon: Sparkles,
          bg: 'bg-[#F4F6F2]',
          color: 'text-[#172019]',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 shadow-2xs space-y-3 sm:space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
          Key Insights
        </h3>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-[10px] sm:text-[11px] font-semibold text-[#529E42] hover:text-[#438335] hover:underline cursor-pointer"
          >
            View details
          </button>
        )}
      </div>

      {/* Insights list */}
      <div className="space-y-2.5 sm:space-y-3">
        {insights.length === 0 ? (
          <p className="text-xs text-[#869288] py-2 text-center">
            No insights available for this period.
          </p>
        ) : (
          insights.map((insight) => {
            const config = getInsightConfig(insight.type);
            const Icon = config.icon;

            return (
              <div key={insight.id} className="flex items-start gap-2.5 sm:gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color} mt-0.5`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#172019] leading-tight">
                    {insight.title}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-[#869288] leading-normal">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
