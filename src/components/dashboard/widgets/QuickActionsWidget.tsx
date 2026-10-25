import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Send,
  ArrowDownToLine,
  History,
  MoreHorizontal,
} from 'lucide-react';

export function QuickActionsWidget() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Top up',
      icon: PlusCircle,
      onClick: () => navigate('/transactions'),
    },
    {
      label: 'Kirim',
      icon: Send,
      onClick: () => navigate('/transactions'),
    },
    {
      label: 'Minta',
      icon: ArrowDownToLine,
      onClick: () => navigate('/transactions'),
    },
    {
      label: 'Riwayat',
      icon: History,
      onClick: () => navigate('/transactions'),
    },
    {
      label: 'Lainnya',
      icon: MoreHorizontal,
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 pt-4 border-t border-[#F2F5F0] mt-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.label}
            type="button"
            onClick={act.onClick}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F6F8F4] group-hover:bg-[#E9F2DC] text-[#172019] flex items-center justify-center border border-[#E3E8E0] transition-colors">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-[#69746B] font-medium">
              {act.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
