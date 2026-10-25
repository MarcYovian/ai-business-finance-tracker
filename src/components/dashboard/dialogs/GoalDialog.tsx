import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUpsertFinancialGoal, useDeleteFinancialGoal } from '@/hooks/useFinancialGoals';
import { useToast } from '@/hooks/use-toast';
import { FinancialGoal, FinancialGoalCategory, FinancialGoalStatus } from '@/types/finance';
import { formatCurrencyForInput } from '@/lib/currency';
import { Trash2 } from 'lucide-react';

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  goalToEdit?: FinancialGoal | null;
  totalFundBalance?: number;
}

const CATEGORY_OPTIONS: { value: FinancialGoalCategory; label: string; desc: string }[] = [
  {
    value: 'savings',
    label: 'Dana Cadangan / Tabungan',
    desc: 'Bantalan kas likuid operasional & darurat',
  },
  {
    value: 'investment',
    label: 'Investasi & Ekspansi',
    desc: 'Pembelian aset, mesin, alat, atau ekspansi cabang',
  },
  {
    value: 'debt_payoff',
    label: 'Pelunasan Kewajiban / Hutang',
    desc: 'Target melunasi pinjaman modal atau vendor',
  },
  {
    value: 'other',
    label: 'Target Finansial Lainnya',
    desc: 'Tujuan keuangan jangka pendek atau khusus',
  },
];

export function GoalDialog({
  open,
  onOpenChange,
  userId,
  goalToEdit,
  totalFundBalance = 0,
}: GoalDialogProps) {
  const { toast } = useToast();
  const upsertMutation = useUpsertFinancialGoal();
  const deleteMutation = useDeleteFinancialGoal();

  const [name, setName] = useState('Dana Cadangan Kas');
  const [category, setCategory] = useState<FinancialGoalCategory>('savings');
  const [targetAmountInput, setTargetAmountInput] = useState('10.000.000');
  const [currentAmountInput, setCurrentAmountInput] = useState('0');
  const [useLiveFundBalance, setUseLiveFundBalance] = useState(true);
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FinancialGoalStatus>('active');
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize or reset form when dialog opens or goalToEdit changes
  useEffect(() => {
    if (open) {
      if (goalToEdit) {
        setName(goalToEdit.name);
        setCategory(goalToEdit.category);
        setTargetAmountInput(formatCurrencyForInput(goalToEdit.target_amount));
        setCurrentAmountInput(formatCurrencyForInput(goalToEdit.current_amount));
        setTargetDate(goalToEdit.target_date);
        setDescription(goalToEdit.description || '');
        setStatus(goalToEdit.status);
        setUseLiveFundBalance(goalToEdit.category === 'savings');
      } else {
        // Defaults for new goal
        setName('Dana Cadangan Kas');
        setCategory('savings');
        setTargetAmountInput('10.000.000');
        setCurrentAmountInput(formatCurrencyForInput(totalFundBalance));
        setUseLiveFundBalance(true);
        setDescription('Bantalan kas minimum untuk ketahanan operasional bisnis');
        setStatus('active');

        // Default deadline: 1 year from now
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setTargetDate(nextYear.toISOString().split('T')[0]);
      }
      setIsDeleting(false);
    }
  }, [open, goalToEdit, totalFundBalance]);

  const handleAmountChange = (val: string, setter: (v: string) => void) => {
    const numericOnly = val.replace(/[^\d]/g, '');
    setter(formatCurrencyForInput(numericOnly || '0'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: 'Sesi Tidak Ditemukan',
        description: 'Silakan login kembali untuk menyimpan target.',
        variant: 'destructive',
      });
      return;
    }

    const cleanTargetAmount = Number(targetAmountInput.replace(/[^\d]/g, '')) || 0;
    if (cleanTargetAmount <= 0) {
      toast({
        title: 'Target Nominal Belum Valid',
        description: 'Target nominal harus lebih besar dari 0.',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Nama Target Wajib Diisi',
        description: 'Mohon berikan nama tujuan finansial Anda.',
        variant: 'destructive',
      });
      return;
    }

    if (!targetDate) {
      toast({
        title: 'Target Tanggal Wajib Diisi',
        description: 'Tentukan batas waktu pencapaian target.',
        variant: 'destructive',
      });
      return;
    }

    const cleanCurrentAmount =
      category === 'savings' && useLiveFundBalance
        ? totalFundBalance
        : Number(currentAmountInput.replace(/[^\d]/g, '')) || 0;

    try {
      await upsertMutation.mutateAsync({
        id: goalToEdit?.id,
        user_id: userId,
        name: name.trim(),
        category,
        target_amount: cleanTargetAmount,
        current_amount: cleanCurrentAmount,
        target_date: targetDate,
        status,
        description: description.trim() || null,
        priority: category === 'savings' ? 10 : 0,
      });

      toast({
        title: goalToEdit ? 'Target Berhasil Diperbarui ✅' : 'Target Berhasil Dipasang 🎯',
        description: `Target "${name}" sebesar Rp ${targetAmountInput} telah disimpan.`,
      });

      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Gagal Menyimpan Target',
        description: err.message || 'Terjadi kesalahan saat menyimpan ke database.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!goalToEdit?.id) return;

    try {
      setIsDeleting(true);
      await deleteMutation.mutateAsync(goalToEdit.id);
      toast({
        title: 'Target Dihapus',
        description: `Target "${goalToEdit.name}" telah dihapus.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Gagal Menghapus Target',
        description: err.message || 'Terjadi kesalahan saat menghapus target.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-[#161F18]">
            {goalToEdit ? 'Ubah Target Keuangan' : 'Pasang Target Keuangan'}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-[#78857B]">
            Tetapkan sasaran tabungan, dana darurat, atau ekspansi bisnis dengan target nominal & waktu yang jelas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3.5 pt-2">
          {/* Nama Target */}
          <div>
            <label className="text-[11px] font-bold text-[#161F18] block mb-1">
              Nama Sasaran / Target
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dana Cadangan Kas 3 Bulan"
              className="w-full px-3 py-2 text-[12px] rounded-lg border border-[#E5EAE3] focus:outline-none focus:border-[#8DC53E] bg-[#FAFCF8] text-[#161F18]"
            />
          </div>

          {/* Kategori Target */}
          <div>
            <label className="text-[11px] font-bold text-[#161F18] block mb-1">
              Kategori Sasaran
            </label>
            <select
              value={category}
              onChange={(e) => {
                const newCat = e.target.value as FinancialGoalCategory;
                setCategory(newCat);
                if (newCat === 'savings') {
                  setUseLiveFundBalance(true);
                }
              }}
              className="w-full px-3 py-2 text-[12px] rounded-lg border border-[#E5EAE3] focus:outline-none focus:border-[#8DC53E] bg-[#FAFCF8] text-[#161F18]"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Nominal (Rp) */}
          <div>
            <label className="text-[11px] font-bold text-[#161F18] block mb-1">
              Target Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#78857B]">
                Rp
              </span>
              <input
                type="text"
                required
                value={targetAmountInput}
                onChange={(e) => handleAmountChange(e.target.value, setTargetAmountInput)}
                className="w-full pl-9 pr-3 py-2 text-[12px] font-numeric font-bold rounded-lg border border-[#E5EAE3] focus:outline-none focus:border-[#8DC53E] bg-[#FAFCF8] text-[#161F18]"
              />
            </div>
          </div>

          {/* Nominal Saat Ini */}
          {category === 'savings' ? (
            <div className="bg-[#F8FAF6] p-2.5 rounded-lg border border-[#EBF0E6] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#18211A]">
                  Ikuti Saldo Kas Bisnis Saat Ini
                </span>
                <input
                  type="checkbox"
                  checked={useLiveFundBalance}
                  onChange={(e) => setUseLiveFundBalance(e.target.checked)}
                  className="rounded text-[#8DC53E] focus:ring-[#8DC53E]"
                />
              </div>
              <p className="text-[10px] text-[#7B867D]">
                {useLiveFundBalance
                  ? `Progres dihitung otomatis dari total kas bisnis (${formatCurrencyForInput(totalFundBalance)}).`
                  : 'Anda dapat menentukan saldo awal khusus di bawah ini.'}
              </p>
              {!useLiveFundBalance && (
                <div className="pt-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#78857B]">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={currentAmountInput}
                      onChange={(e) => handleAmountChange(e.target.value, setCurrentAmountInput)}
                      className="w-full pl-9 pr-3 py-1.5 text-[12px] font-numeric font-bold rounded-lg border border-[#E5EAE3] focus:outline-none focus:border-[#8DC53E] bg-white text-[#161F18]"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                Terkumpul Saat Ini (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#78857B]">
                  Rp
                </span>
                <input
                  type="text"
                  value={currentAmountInput}
                  onChange={(e) => handleAmountChange(e.target.value, setCurrentAmountInput)}
                  className="w-full pl-9 pr-3 py-2 text-[12px] font-numeric font-bold rounded-lg border border-[#E5EAE3] focus:outline-none focus:border-[#8DC53E] bg-[#FAFCF8] text-[#161F18]"
                />
              </div>
            </div>
          )}

          {/* Target Tanggal */}
          <div>
            <label className="text-[11px] font-bold text-[#161F18] block mb-1">
              Target Batas Waktu (Deadline)
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-[12px] rounded-lg border border-[#E5EAE3] focus:outline-none focus:border-[#8DC53E] bg-[#FAFCF8] text-[#161F18]"
            />
          </div>

          {/* Status (jika edit) */}
          {goalToEdit && (
            <div>
              <label className="text-[11px] font-bold text-[#161F18] block mb-1">
                Status Target
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FinancialGoalStatus)}
                className="w-full px-3 py-2 text-[12px] rounded-lg border border-[#E5EAE3] focus:outline-none focus:border-[#8DC53E] bg-[#FAFCF8] text-[#161F18]"
              >
                <option value="active">Sedang Berjalan (Aktif)</option>
                <option value="completed">Tercapai (Selesai)</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          )}

          {/* Catatan / Keterangan */}
          <div>
            <label className="text-[11px] font-bold text-[#161F18] block mb-1">
              Keterangan / Catatan (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan tambahan target keuangan..."
              className="w-full px-3 py-1.5 text-[12px] rounded-lg border border-[#E5EAE3] focus:outline-none focus:border-[#8DC53E] bg-[#FAFCF8] text-[#161F18] resize-none"
            />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between gap-2 border-t border-[#F2F5F0]">
            {goalToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || deleteMutation.isPending}
                className="text-[12px] font-semibold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3 py-1.5 text-[12px] font-medium text-[#78857B] hover:text-[#161F18] rounded-lg hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={upsertMutation.isPending}
                className="px-4 py-1.5 text-[12px] font-bold text-white bg-[#8DC53E] hover:bg-[#7CB333] rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {upsertMutation.isPending ? 'Menyimpan...' : 'Simpan Target'}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
