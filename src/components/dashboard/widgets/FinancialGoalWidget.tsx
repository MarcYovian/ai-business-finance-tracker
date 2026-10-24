import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { formatRupiah } from '@/lib/currency';
import { DEFAULT_CASH_RESERVE_TARGET } from '../constants';

interface FinancialGoalWidgetProps {
  totalFundBalance: number;
  targetAmount?: number;
}

export function FinancialGoalWidget({
  totalFundBalance,
  targetAmount = DEFAULT_CASH_RESERVE_TARGET,
}: FinancialGoalWidgetProps) {
  const navigate = useNavigate();

  const progressPercentage = Math.min(
    100,
    Math.round((totalFundBalance / targetAmount) * 100)
  );

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E5EAE3] shadow-sm flex flex-col justify-between h-full">
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
                  className="bg-[#8DC53E] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
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
              className="mt-1 text-[10px] font-bold text-[#18211A] hover:text-[#8DC53E] transition-colors"
            >
              Buka Menu Anggaran &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
