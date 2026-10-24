import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Target,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { formatRupiah } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { GoalDialog } from '../dialogs/GoalDialog';
import { FinancialGoal, FinancialGoalCategory } from '@/types/finance';

interface FinancialGoalWidgetProps {
  totalFundBalance: number;
  userId?: string;
}

export function FinancialGoalWidget({
  totalFundBalance,
  userId: propUserId,
}: FinancialGoalWidgetProps) {
  const { user } = useAuth();
  const effectiveUserId = propUserId || user?.id;

  const { data: goals, isLoading } = useFinancialGoals(effectiveUserId);

  const [activeGoalIndex, setActiveGoalIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Active goals list
  const activeGoals = useMemo(() => {
    return (goals || []).filter((g) => g.status === 'active');
  }, [goals]);

  // Safe current goal index
  const safeIndex = activeGoals.length > 0
    ? Math.min(activeGoalIndex, activeGoals.length - 1)
    : 0;
  const currentGoal = activeGoals[safeIndex] || null;

  // Calculate current amount and progress
  const { currentProgress, progressPercentage, remaining } = useMemo(() => {
    if (!currentGoal) {
      return { currentProgress: 0, progressPercentage: 0, remaining: 0 };
    }

    // For savings/dana cadangan, automatically track against total liquid business cash balance
    const current =
      currentGoal.category === 'savings'
        ? Math.max(totalFundBalance, currentGoal.current_amount || 0)
        : currentGoal.current_amount || 0;

    const target = currentGoal.target_amount > 0 ? currentGoal.target_amount : 1;
    const pct = Math.min(100, Math.round((current / target) * 100));
    const rem = Math.max(0, currentGoal.target_amount - current);

    return {
      currentProgress: current,
      progressPercentage: pct,
      remaining: rem,
    };
  }, [currentGoal, totalFundBalance]);

  const handlePrevGoal = () => {
    setActiveGoalIndex((prev) => (prev > 0 ? prev - 1 : activeGoals.length - 1));
  };

  const handleNextGoal = () => {
    setActiveGoalIndex((prev) => (prev < activeGoals.length - 1 ? prev + 1 : 0));
  };

  const handleOpenAddDialog = () => {
    setEditingGoal(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };

  // Helper to render category icon
  const getCategoryMeta = (cat: FinancialGoalCategory) => {
    switch (cat) {
      case 'savings':
        return {
          icon: <ShieldCheck className="h-3.5 w-3.5 text-[#4A7C1E]" />,
          label: 'Dana Cadangan',
          bg: 'bg-[#F4F7F1]',
        };
      case 'investment':
        return {
          icon: <TrendingUp className="h-3.5 w-3.5 text-blue-600" />,
          label: 'Investasi',
          bg: 'bg-blue-50',
        };
      case 'debt_payoff':
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />,
          label: 'Pelunasan Hutang',
          bg: 'bg-amber-50',
        };
      default:
        return {
          icon: <Target className="h-3.5 w-3.5 text-purple-600" />,
          label: 'Sasaran Finansial',
          bg: 'bg-purple-50',
        };
    }
  };

  const currentMeta = currentGoal ? getCategoryMeta(currentGoal.category) : null;

  return (
    <>
      <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full overflow-hidden">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F2F5F0]">
            <h4 className="font-bold text-[13px] text-[#161F18] truncate">
              Target Keuangan
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeGoals.length > 1 && (
                <div className="flex items-center text-[10px] text-[#7B867D] bg-[#F4F7F1] px-1 py-0.5 rounded">
                  <button
                    type="button"
                    onClick={handlePrevGoal}
                    aria-label="Target sebelumnya"
                    className="hover:text-[#18211A] p-0.5"
                  >
                    <ChevronLeft className="w-2.5 h-2.5" />
                  </button>
                  <span className="font-numeric px-0.5">
                    {safeIndex + 1}/{activeGoals.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextGoal}
                    aria-label="Target berikutnya"
                    className="hover:text-[#18211A] p-0.5"
                  >
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleOpenAddDialog}
                className="text-[10px] font-semibold text-[#18211A] hover:text-[#8DC53E] flex items-center gap-0.5 transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            /* Loading Skeleton */
            <div className="mt-3 space-y-2 animate-pulse">
              <div className="h-4 bg-[#F2F5F0] rounded w-3/4" />
              <div className="h-6 bg-[#F2F5F0] rounded w-1/2" />
              <div className="h-2 bg-[#F2F5F0] rounded-full w-full" />
              <div className="h-3 bg-[#F2F5F0] rounded w-2/3" />
            </div>
          ) : currentGoal ? (
            /* Goal Details Card */
            <div className="mt-2.5 space-y-2.5">
              {/* Goal Title & Category Row */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded ${currentMeta?.bg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    {currentMeta?.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[12px] text-[#18211A] block truncate" title={currentGoal.name}>
                      {currentGoal.name}
                    </span>
                    <span className="text-[9.5px] text-[#8E9A90] block truncate">
                      {currentMeta?.label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEditDialog(currentGoal)}
                  className="p-1 text-[#8E9A90] hover:text-[#18211A] hover:bg-[#F4F7F1] rounded transition-colors shrink-0"
                  title="Ubah Target"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>

              {/* Progress & Amount */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between text-[11px] gap-1">
                  <span className="text-[18px] font-extrabold text-[#161F18] font-numeric tracking-tight truncate">
                    {formatRupiah(currentProgress)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 font-numeric ${
                      progressPercentage >= 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#F2F7EB] text-[#4A7C1E]'
                    }`}
                  >
                    {progressPercentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#EBF0E6] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-[#8DC53E]'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                {/* Subtext info: Target & Remaining */}
                <div className="flex items-center justify-between text-[9px] text-[#8E9A90] pt-0.5 min-w-0">
                  <span className="truncate">
                    Target: {formatRupiah(currentGoal.target_amount)}
                  </span>
                  <span className="font-medium shrink-0 text-[#68736A]">
                    {progressPercentage >= 100 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Tercapai
                      </span>
                    ) : (
                      `Sisa ${formatRupiah(remaining)}`
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="py-4 text-center">
              <div className="w-9 h-9 rounded-full bg-[#F4F7F1] flex items-center justify-center mx-auto text-[#8DC53E] mb-2">
                <Target className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold text-[#18211A]">
                Belum Ada Target Finansial
              </p>
              <p className="text-[9.5px] text-[#8E9A90] mt-0.5 max-w-[190px] mx-auto">
                Pasang target dana cadangan kas atau sasaran ekspansi bisnis.
              </p>
              <button
                type="button"
                onClick={handleOpenAddDialog}
                className="mt-2.5 px-3 py-1 text-[10px] font-bold text-white bg-[#8DC53E] hover:bg-[#7CB333] rounded-lg shadow-sm transition-colors"
              >
                + Pasang Target Pertama
              </button>
            </div>
          )}
        </div>

        {/* Footer info / action */}
        {currentGoal && (
          <div className="pt-2 mt-2 border-t border-[#F2F5F0] flex items-center justify-between text-[9.5px] text-[#8E9A90]">
            <span className="truncate">
              {currentGoal.category === 'savings'
                ? 'Otomatis mengikuti saldo kas'
                : `Deadline: ${new Date(currentGoal.target_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}`}
            </span>
            <button
              type="button"
              onClick={() => handleOpenEditDialog(currentGoal)}
              className="text-[#18211A] font-bold hover:text-[#8DC53E] transition-colors shrink-0 ml-1"
            >
              Ubah &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Goal Dialog Modal */}
      <GoalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userId={effectiveUserId}
        goalToEdit={editingGoal}
        totalFundBalance={totalFundBalance}
      />
    </>
  );
}
