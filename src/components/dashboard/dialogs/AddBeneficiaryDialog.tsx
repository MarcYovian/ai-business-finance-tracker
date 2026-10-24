import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { BANK_OPTIONS } from '../constants';
import { useAddBeneficiary } from '@/hooks/useBeneficiaries';
import { useToast } from '@/hooks/use-toast';

interface AddBeneficiaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function AddBeneficiaryDialog({
  open,
  onOpenChange,
  userId,
}: AddBeneficiaryDialogProps) {
  const { toast } = useToast();
  const addBeneficiaryMutation = useAddBeneficiary();

  const [contactName, setContactName] = useState('');
  const [contactBank, setContactBank] = useState('BCA');
  const [contactAccountNum, setContactAccountNum] = useState('');
  const [contactType, setContactType] = useState<'bank' | 'ewallet'>('bank');
  const [contactNotes, setContactNotes] = useState('');

  const resetForm = () => {
    setContactName('');
    setContactBank('BCA');
    setContactAccountNum('');
    setContactType('bank');
    setContactNotes('');
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactAccountNum.trim() || !userId) {
      toast({
        title: 'Data belum lengkap',
        description: 'Mohon isi nama penerima dan nomor rekening/e-wallet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addBeneficiaryMutation.mutateAsync({
        user_id: userId,
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

      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Gagal Menyimpan',
        description: err.message || 'Terjadi kesalahan saat menyimpan data kontak.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => onOpenChange(false)}
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
  );
}
