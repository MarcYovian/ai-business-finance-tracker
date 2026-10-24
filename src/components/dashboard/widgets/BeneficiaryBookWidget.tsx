import { useState } from 'react';
import { Plus, Copy, Check, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Beneficiary } from '@/types/finance';

interface BeneficiaryBookWidgetProps {
  beneficiaries: Beneficiary[];
  onAddClick: () => void;
}

export function BeneficiaryBookWidget({
  beneficiaries,
  onAddClick,
}: BeneficiaryBookWidgetProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAccountNumber = async (accountNum: string, name: string, bank: string) => {
    try {
      await navigator.clipboard.writeText(accountNum);
      setCopiedId(accountNum);
      toast({
        title: 'Berhasil Disalin! 📋',
        description: `Nomor rekening ${bank} a.n. ${name} (${accountNum}) telah disalin ke clipboard.`,
      });
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast({
        title: 'Gagal Menyalin',
        description: 'Silakan salin nomor rekening secara manual.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5EAE3] shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#F2F5F0]">
        <div>
          <h3 className="font-bold text-[14px] text-[#161F18]">Buku Rekening Transfer</h3>
          <span className="text-[11px] text-[#859087]">
            Klik salin untuk nomor rekening / e-wallet
          </span>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="text-[11px] font-semibold text-[#18211A] hover:text-[#8DC53E] flex items-center gap-1 bg-[#F5F7F3] px-2.5 py-1 rounded-lg border border-[#E2E6DF] transition-colors"
        >
          <Plus className="h-3 w-3" /> Tambah
        </button>
      </div>

      {/* Beneficiary contacts list with 1-click copy */}
      <div className="mt-3 space-y-2.5">
        {beneficiaries.length > 0 ? (
          beneficiaries.map((b) => {
            const isCopied = copiedId === b.account_number;
            const isEWallet = b.account_type === 'ewallet';

            return (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E7ECE4] hover:bg-white hover:border-[#8DC53E] transition-all flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isEWallet
                        ? 'bg-[#E2ED7C] text-[#283811]'
                        : 'bg-[#EBF6DC] text-[#4A7C1E]'
                    }`}
                  >
                    {b.bank_name.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[12px] text-[#161F18] leading-tight truncate">
                        {b.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#EAEFE7] text-[#556257] font-semibold uppercase">
                        {b.bank_name}
                      </span>
                    </div>
                    <span className="text-[11px] font-numeric font-medium text-[#68756A] block leading-tight tracking-wide mt-0.5">
                      {b.account_number}
                    </span>
                    {b.notes && (
                      <span className="text-[9.5px] text-[#8A958C] block truncate">
                        {b.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Click Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopyAccountNumber(b.account_number, b.name, b.bank_name)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all ${
                    isCopied
                      ? 'bg-[#EBF6DC] border-[#8DC53E] text-[#4A7C1E]'
                      : 'bg-white border-[#DCE2D8] hover:bg-[#8DC53E] hover:border-[#8DC53E] hover:text-white text-[#172019]'
                  }`}
                  title="Salin nomor rekening"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-[#6A766C]" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-[#869288]">
            <Smartphone className="h-6 w-6 mx-auto text-[#CBD5CA] mb-1" />
            <p className="text-[12px] font-medium text-[#161F18]">
              Belum ada catatan rekening tujuan
            </p>
            <p className="text-[10px] mt-0.5 text-[#869288]">
              Simpan nomor rekening / e-wallet agar bisa langsung disalin
            </p>
            <button
              type="button"
              onClick={onAddClick}
              className="mt-3 px-3 py-1.5 bg-[#18211A] text-white rounded-lg text-[11px] font-semibold hover:bg-[#253228] transition-colors"
            >
              + Tambah Kontak Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
