import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Wallet, Coins } from 'lucide-react';
import { formatRupiah } from '@/lib/currency';
import { FundSource } from '@/types/finance';
import { CARD_THEMES } from '../constants';
import { QuickActionsWidget } from './QuickActionsWidget';

interface FundSourceCardSliderProps {
  fundSources: FundSource[];
  userName?: string;
}

export function FundSourceCardSlider({
  fundSources,
  userName = 'Arya Danuarta',
}: FundSourceCardSliderProps) {
  const navigate = useNavigate();
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);

  const activeFundSources = useMemo(() => {
    return fundSources.filter((fs) => fs.is_active !== false);
  }, [fundSources]);

  // Current selected card in slider
  const currentCard = activeFundSources[activeCardIndex] || activeFundSources[0];
  const nextCardIndex = (activeCardIndex + 1) % (activeFundSources.length || 1);
  const nextCard = activeFundSources[nextCardIndex];

  const currentTheme = CARD_THEMES[currentCard?.color_theme || 'lime'] || CARD_THEMES.lime;

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5EAE3] shadow-sm">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h3 className="font-bold text-[14px] text-[#161F18]">Rekening &amp; Dompet</h3>
          <span className="text-[11px] text-[#859087]">
            {activeFundSources.length} akun aktif
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setActiveCardIndex((prev) =>
                prev === 0 ? activeFundSources.length - 1 : prev - 1
              )
            }
            disabled={activeFundSources.length <= 1}
            className="w-6 h-6 rounded-lg border border-[#E2E6DF] flex items-center justify-center text-[#68736A] hover:bg-[#F5F6F3] disabled:opacity-30 transition-colors"
            title="Kartu sebelumnya"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveCardIndex((prev) => (prev + 1) % activeFundSources.length)
            }
            disabled={activeFundSources.length <= 1}
            className="w-6 h-6 rounded-lg border border-[#E2E6DF] flex items-center justify-center text-[#68736A] hover:bg-[#F5F6F3] disabled:opacity-30 transition-colors"
            title="Kartu berikutnya"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="text-[11px] font-semibold text-[#18211A] hover:text-[#8DC53E] ml-1 flex items-center gap-0.5 transition-colors"
          >
            + Tambah
          </button>
        </div>
      </div>

      {/* DUAL CARD CAROUSEL SLIDER MATCHING ACRU */}
      {currentCard ? (
        <div>
          <div className="relative overflow-hidden py-1">
            <div className="flex gap-2.5 items-center">
              {/* Active Main Card */}
              <div
                className={`w-[84%] ${currentTheme.bg} ${currentTheme.text} p-4 rounded-2xl shrink-0 shadow-sm relative overflow-hidden flex flex-col justify-between h-40 transition-all duration-300`}
              >
                {/* Background subtle curved rings */}
                <div
                  className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full border ${currentTheme.ringColor} pointer-events-none`}
                />
                <div
                  className={`absolute -right-2 -bottom-2 w-40 h-40 rounded-full border ${currentTheme.ringColor} pointer-events-none`}
                />

                {/* Top: Card Type & Bank/Brand Name */}
                <div className="flex items-center justify-between relative z-10">
                  <span
                    className={`text-[9.5px] uppercase font-bold tracking-wider ${currentTheme.subText}`}
                  >
                    {currentCard.type === 'cash'
                      ? 'Kas Tunai'
                      : currentCard.type === 'wallet'
                      ? 'E-Wallet'
                      : 'Kartu Rekening'}
                  </span>
                  <span className="text-[13px] font-extrabold italic tracking-wider font-sans">
                    {currentCard.name.toUpperCase()}
                  </span>
                </div>

                {/* Middle: Chip & Saldo */}
                <div className="relative z-10 flex items-center justify-between my-1">
                  {currentCard.type !== 'cash' ? (
                    <div
                      className={`w-6 h-5 rounded ${currentTheme.chipBg} border ${currentTheme.chipBorder} flex items-center justify-center`}
                    >
                      <div className="w-3.5 h-3 border border-black/20 rounded-xs" />
                    </div>
                  ) : (
                    <div className="w-6 h-5 flex items-center justify-center">
                      <Coins className="h-4 w-4 opacity-75" />
                    </div>
                  )}
                  <span className="font-extrabold text-[17px] font-sans tracking-tight">
                    {formatRupiah(currentCard.balance)}
                  </span>
                </div>

                {/* Bottom: Masked Number & Holder Name */}
                <div className="relative z-10">
                  <div className="font-numeric tracking-widest text-[13px] font-bold">
                    {currentCard.account_number && currentCard.account_number !== '-'
                      ? `•••• •••• ${currentCard.account_number.slice(-4)}`
                      : 'KAS OPERASIONAL'}
                  </div>
                  <div
                    className={`flex items-center justify-between text-[10px] font-medium ${currentTheme.subText} mt-1`}
                  >
                    <span className="uppercase truncate max-w-[130px]">
                      {currentCard.account_holder_name || userName}
                    </span>
                    {currentCard.card_expiry && (
                      <span className="font-numeric font-bold">
                        {currentCard.card_expiry}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Peeking Next Card on Right */}
              {nextCard && nextCard.id !== currentCard.id && (
                <div
                  onClick={() => setActiveCardIndex(nextCardIndex)}
                  className="w-[18%] bg-[#E8EDE5] p-3 rounded-2xl shrink-0 opacity-60 flex flex-col justify-between h-40 border border-[#DCE2D9] cursor-pointer hover:opacity-90 transition-opacity"
                  title="Klik untuk melihat kartu ini"
                >
                  <span className="text-[8.5px] uppercase font-bold text-[#6D776E] truncate">
                    {nextCard.name}
                  </span>
                  <div className="font-numeric text-[8.5px] tracking-wider text-[#6D776E]">
                    •••• {nextCard.account_number ? nextCard.account_number.slice(-4) : '4321'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Indicator Dots for Card Slider */}
          {activeFundSources.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {activeFundSources.map((fs, idx) => (
                <button
                  key={fs.id}
                  type="button"
                  onClick={() => setActiveCardIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeCardIndex
                      ? 'w-5 bg-[#8DC53E]'
                      : 'w-1.5 bg-[#DCE2D8] hover:bg-[#8DC53E]/50'
                  }`}
                  title={fs.name}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center text-[#869288]">
          <Wallet className="h-6 w-6 mx-auto text-[#CBD5CA] mb-1" />
          <p className="text-[12px] font-medium text-[#161F18]">Belum ada akun terdaftar</p>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="mt-2 text-[11px] font-semibold text-[#8DC53E]"
          >
            + Tambah Rekening Pertama
          </button>
        </div>
      )}

      {/* Quick Action Icon Buttons */}
      <QuickActionsWidget />
    </div>
  );
}
