'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Wallet, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/currency';
import { Transaction } from '@/types/finance';

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
}

export function RecentTransactionsWidget({
  transactions,
}: RecentTransactionsWidgetProps) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .filter((t) => !isNaN(new Date(t.transactionDate).getTime()))
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 7);
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5EAE3] shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#F2F5F0]">
        <h3 className="font-bold text-[14px] text-[#161F18]">Riwayat Transaksi</h3>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="text-[11px] font-semibold text-[#18211A] hover:text-[#8DC53E] transition-colors"
        >
          Lihat Semua
        </button>
      </div>

      {/* Transaction list */}
      <div className="divide-y divide-[#F2F5F0]">
        {recentTransactions.length > 0 ? (
          recentTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';

            return (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between hover:bg-[#F9FAF8] px-1 rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate('/transactions')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-[#EBF6DC] text-[#4A7C1E]'
                        : isTransfer
                        ? 'bg-[#F4F7F1] text-[#172019]'
                        : 'bg-[#FFF2EE] text-[#F5A87B]'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : isTransfer ? (
                      <Wallet className="h-4 w-4" />
                    ) : (
                      <Receipt className="h-4 w-4" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-[12px] text-[#161F18] block leading-tight truncate">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-[#869288] leading-tight block">
                      {formatDate(tx.transactionDate)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`text-[12px] font-bold font-numeric block ${
                      isIncome ? 'text-[#4A7C1E]' : 'text-[#161F18]'
                    }`}
                  >
                    {isIncome ? '+ ' : '- '}
                    {formatCurrency(tx.amount)}
                  </span>
                  <span className="text-[9.5px] text-[#869288] block">
                    Selesai
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-[#869288]">
            <Receipt className="h-8 w-8 mx-auto text-[#CBD5CA] mb-2" />
            <p className="text-[12px] font-medium text-[#161F18]">Belum ada transaksi</p>
            <p className="text-[10px] mt-0.5">Mulai catat transaksi pertama Anda</p>
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="mt-3 px-3 py-1.5 bg-[#18211A] text-white rounded-lg text-[11px] font-semibold hover:bg-[#253228] transition-colors"
            >
              + Tambah Transaksi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
