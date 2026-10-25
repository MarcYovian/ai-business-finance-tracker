import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Landmark,
  Smartphone,
  Banknote,
  CreditCard,
  MoreHorizontal,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';
import { AccountWithAnalytics, AccountTabFilter } from '../types';
import { ACCOUNT_TYPE_LABELS } from '../constants';
import { formatCurrency } from '@/lib/currency';
import { FundType } from '@/types/finance';

interface YourAccountsTableWidgetProps {
  accounts: AccountWithAnalytics[];
  onEdit: (account: AccountWithAnalytics) => void;
  onTransfer: (account: AccountWithAnalytics) => void;
  onToggleStatus: (account: AccountWithAnalytics) => void;
  onDelete: (account: AccountWithAnalytics) => void;
}

export const YourAccountsTableWidget: React.FC<YourAccountsTableWidgetProps> = ({
  accounts,
  onEdit,
  onTransfer,
  onToggleStatus,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<AccountTabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: accounts.length,
      bank: accounts.filter((a) => a.type === 'bank').length,
      wallet: accounts.filter((a) => a.type === 'wallet').length,
      cash: accounts.filter((a) => a.type === 'cash').length,
      credit_card: accounts.filter((a) => a.type === 'credit_card').length,
    };
  }, [accounts]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (activeTab !== 'all' && a.type !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = a.name.toLowerCase().includes(query);
        const matchNumber = a.account_number?.toLowerCase().includes(query);
        return matchName || matchNumber;
      }
      return true;
    });
  }, [accounts, activeTab, searchQuery]);

  const renderAccountIcon = (type: FundType) => {
    switch (type) {
      case 'bank':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#E8F1FC] text-[#2563EB] flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
        );
      case 'wallet':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
        );
      case 'cash':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
            <Banknote className="w-4 h-4" />
          </div>
        );
      case 'credit_card':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
        );
    }
  };

  const renderTypeBadge = (type: FundType) => {
    switch (type) {
      case 'bank':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#E8F1FC] text-[#2563EB]">
            Bank
          </span>
        );
      case 'wallet':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3E8FF] text-[#9333EA]">
            E-wallet
          </span>
        );
      case 'cash':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
            Cash
          </span>
        );
      case 'credit_card':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FFFBEB] text-[#D97706]">
            Credit Card
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
            Other
          </span>
        );
    }
  };

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs overflow-hidden">
      <CardContent className="p-0">
        {/* Header with Title, Filter Tabs, and Search */}
        <div className="p-4 sm:p-5 border-b border-[#EDF1EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[#161F18]">Your Accounts</h2>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter Tabs matching mockup Image 3 - Scrollable on mobile */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100%-36px)] sm:max-w-none">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-[#EAF3DE] text-[#4E7934] font-semibold'
                    : 'text-[#6D776F] hover:text-[#161F18]'
                }`}
              >
                All ({tabCounts.all})
              </button>
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                  activeTab === 'bank'
                    ? 'bg-[#EAF3DE] text-[#4E7934] font-semibold'
                    : 'text-[#6D776F] hover:text-[#161F18]'
                }`}
              >
                Bank ({tabCounts.bank})
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                  activeTab === 'wallet'
                    ? 'bg-[#EAF3DE] text-[#4E7934] font-semibold'
                    : 'text-[#6D776F] hover:text-[#161F18]'
                }`}
              >
                E-wallet ({tabCounts.wallet})
              </button>
              <button
                onClick={() => setActiveTab('cash')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                  activeTab === 'cash'
                    ? 'bg-[#EAF3DE] text-[#4E7934] font-semibold'
                    : 'text-[#6D776F] hover:text-[#161F18]'
                }`}
              >
                Cash ({tabCounts.cash})
              </button>
              <button
                onClick={() => setActiveTab('credit_card')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                  activeTab === 'credit_card'
                    ? 'bg-[#EAF3DE] text-[#4E7934] font-semibold'
                    : 'text-[#6D776F] hover:text-[#161F18]'
                }`}
              >
                Credit Card ({tabCounts.credit_card})
              </button>
            </div>

            {/* Search Input toggle */}
            <div className="flex items-center ml-1 shrink-0">
              {showSearchInput ? (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-32 sm:w-36 text-xs pl-7 pr-2 rounded-lg border-[#E2E8F0]"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery) setShowSearchInput(false);
                    }}
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#8B968D]" />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearchInput(true)}
                  className="h-7 w-7 text-[#6D776F] hover:text-[#161F18] rounded-lg"
                >
                  <Search className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-[#EDF1EB] bg-[#FAFAF8] text-[11px] font-semibold text-[#8B968D]">
                <th className="py-2.5 px-4">Account</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Balance</th>
                <th className="py-2.5 px-3">Last Transaction</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1EB] text-[12px]">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8B968D] text-xs">
                    No accounts found for this filter.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const percentChange = account.percentChange ?? 0;
                  const isPositiveChange = percentChange >= 0;
                  const isInactive = account.is_active === false;

                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-[#F9FAF8] transition-colors group"
                    >
                      {/* Account Column */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {renderAccountIcon(account.type)}
                          <div className="min-w-0">
                            <span className="font-semibold text-[#161F18] block leading-tight truncate">
                              {account.name}
                            </span>
                            <span className="text-[11px] text-[#8B968D] block truncate">
                              {account.account_number ||
                                (account.type === 'cash'
                                  ? 'Physical cash'
                                  : ACCOUNT_TYPE_LABELS[account.type])}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type Column */}
                      <td className="py-2.5 px-3">{renderTypeBadge(account.type)}</td>

                      {/* Balance & Trend Column */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <span
                              className={`font-semibold block leading-tight ${
                                account.balance < 0 ? 'text-[#DE4436]' : 'text-[#161F18]'
                              }`}
                            >
                              {formatCurrency(account.balance)}
                            </span>
                            <div className="flex items-center gap-0.5 text-[10px] mt-0.5">
                              {percentChange === 0 ? (
                                <span className="text-[#8B968D]">- 0.0%</span>
                              ) : isPositiveChange ? (
                                <>
                                  <ArrowUpRight className="w-2.5 h-2.5 text-[#529E42]" />
                                  <span className="text-[#529E42] font-medium">
                                    {Math.abs(percentChange)}%
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="w-2.5 h-2.5 text-[#DE4436]" />
                                  <span className="text-[#DE4436] font-medium">
                                    {Math.abs(percentChange)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Mini Sparkline in row */}
                          <div className="w-12 h-4 hidden sm:block">
                            <svg viewBox="0 0 48 16" className="w-full h-full overflow-visible">
                              <path
                                d={
                                  isPositiveChange
                                    ? 'M 2 12 Q 14 14, 24 8 T 46 3'
                                    : 'M 2 3 Q 14 5, 24 10 T 46 13'
                                }
                                fill="none"
                                stroke={
                                  percentChange === 0
                                    ? '#94A3B8'
                                    : isPositiveChange
                                    ? '#529E42'
                                    : '#DE4436'
                                }
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </td>

                      {/* Last Transaction Column */}
                      <td className="py-2.5 px-3">
                        {account.lastTransaction ? (
                          <div>
                            <span className="font-medium text-[#161F18] block leading-tight truncate max-w-[140px]">
                              {account.lastTransaction.description}
                            </span>
                            <span className="text-[10px] text-[#8B968D]">
                              {new Date(account.lastTransaction.date).toLocaleDateString(
                                'id-ID',
                                { day: 'numeric', month: 'short', year: 'numeric' }
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8B968D] italic">No transaction</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-2.5 px-3">
                        {isInactive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                            Inactive
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF3DE] text-[#4E7934]">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-2.5 px-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-[#8B968D] hover:text-[#161F18] rounded-lg"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem
                              onClick={() => onEdit(account)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit Account</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onTransfer(account)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                              <span>Transfer Funds</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onToggleStatus(account)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              {isInactive ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Set as Active</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Set as Inactive</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(account)}
                              className="cursor-pointer gap-2 text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
