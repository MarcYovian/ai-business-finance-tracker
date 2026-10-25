import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomDateRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (start: string, end: string) => void;
  initialStart: string;
  initialEnd: string;
}

export function CustomDateRangeDialog({
  open,
  onOpenChange,
  onApply,
  initialStart,
  initialEnd,
}: CustomDateRangeDialogProps) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  useEffect(() => {
    if (open) {
      setStartDate(initialStart);
      setEndDate(initialEnd);
    }
  }, [open, initialStart, initialEnd]);

  const handleApply = () => {
    if (!startDate || !endDate) return;
    if (startDate > endDate) {
      toast({
        title: 'Rentang Tidak Valid',
        description: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.',
        variant: 'destructive',
      });
      return;
    }
    onApply(startDate, endDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#DCE2D8] text-[12px] text-[#172019] focus:outline-none focus:border-[#8DC53E] focus:ring-1 focus:ring-[#8DC53E]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#161F18] block mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#DCE2D8] text-[12px] text-[#172019] focus:outline-none focus:border-[#8DC53E] focus:ring-1 focus:ring-[#8DC53E]"
            />
          </div>
        </div>

        <DialogFooter className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-1.5 rounded-xl border border-[#DCE2D8] text-[12px] font-semibold text-[#68736A] hover:bg-[#F5F6F3] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!startDate || !endDate || startDate > endDate}
            className="px-4 py-1.5 rounded-xl bg-[#18211A] text-white text-[12px] font-semibold hover:bg-[#253228] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Terapkan Filter
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
