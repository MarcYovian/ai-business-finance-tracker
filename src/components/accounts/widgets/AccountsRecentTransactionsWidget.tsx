import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { formatCurrency } from '@/lib/currency';

interface EnrichedTransaction extends Transaction {
  sourceFundName?: string;
  destinationFundName?: string;
}

interface AccountsRecentTransactionsWidgetProps {
  transactions: EnrichedTransaction[];
}

export const AccountsRecentTransactionsWidget: React.FC<AccountsRecentTransactionsWidgetProps> = ({
  transactions,
}) => {
  const navigate = useNavigate();

  const renderTxIcon = (tx: EnrichedTransaction) => {
    if (tx.type === 'transfer') {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#E8F1FC] text-[#2563EB] flex items-center justify-center shrink-0">
          <ArrowRightLeft className="w-4 h-4" />
        </div>
      );
    }
    if (tx.type === 'income') {
      return (
        <div className="w-8 h-8 rounded-xl bg-[#EDF8E8] text-[#529E42] flex items-center justify-center shrink-0">
          <ArrowDownLeft className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-[#FDEFE8] text-[#DE4436] flex items-center justify-center shrink-0">
        <ArrowUpRight className="w-4 h-4" />
      </div>
    );
  };

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs">
      <CardContent className="p-5">
        {/* Header with View All */}
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold text-[#161F18]">Recent Transactions</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-[12px] font-semibold text-[#529E42] hover:text-[#3E7A31] transition-colors"
          >
            View all
          </button>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="py-6 text-center text-[#8B968D] text-xs">
              No recent transactions recorded yet.
            </div>
          ) : (
            transactions.slice(0, 5).map((tx) => {
              const isIncome = tx.type === 'income';
              const accountName =
                tx.type === 'income'
                  ? tx.destinationFundName || 'Destination Account'
                  : tx.sourceFundName || 'Source Account';

              const dateFormatted = tx.transactionDate
                ? new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-';

              return (
                <div key={tx.id} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderTxIcon(tx)}
                    <div className="min-w-0">
                      <span className="font-semibold text-[#161F18] block truncate leading-tight">
                        {tx.description}
                      </span>
                      <span className="text-[11px] text-[#8B968D] block truncate">
                        {accountName} • {dateFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={`font-semibold block ${
                        isIncome ? 'text-[#529E42]' : 'text-[#161F18]'
                      }`}
                    >
                      {isIncome ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
