'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BudgetRecentTransactionItem } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '@/lib/currency';

interface RecentTransactionsWidgetProps {
  transactions: BudgetRecentTransactionItem[];
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  transactions,
}) => {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  return (
    <div className="bg-white rounded-2xl border border-[#E7EBE4] p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#172019] tracking-tight">
          Recent Transactions
        </h3>
        <button
          onClick={() => navigate('/transactions')}
          className="text-xs font-semibold text-[#529E42] hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-[#F4F6F2]">
        {transactions.length === 0 ? (
          <p className="text-xs text-[#869288] py-4 text-center">
            No transactions found for this month.
          </p>
        ) : (
          transactions.map((tx) => {
            const IconComponent = getCategoryIcon(tx.categoryIcon);

            return (
              <div key={tx.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${tx.categoryColor}18`,
                      color: tx.categoryColor,
                    }}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[13px] text-[#172019] block truncate">
                      {tx.description}
                    </span>
                    <span className="text-[11px] text-[#869288] block truncate mt-0.5">
                      {tx.categoryName} • {tx.formattedDate}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-[13px] text-[#172019]">
                    - {formatCurrency(tx.amount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
