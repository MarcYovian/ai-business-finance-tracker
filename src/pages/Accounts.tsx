import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import {
  useFundSources,
  useAddFundSource,
  useUpdateFundSource,
  useDeleteFundSource,
} from '@/hooks/useFundSources';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TransferDialog } from '@/components/TransferDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AccountsSkeleton,
  useAccountsAnalytics,
  TotalBalanceWidget,
  MonthlyExpensesWidget,
  MonthlyIncomeWidget,
  ActiveAccountsWidget,
  YourAccountsTableWidget,
  BalanceDistributionWidget,
  AccountsRecentTransactionsWidget,
  SpendingByAccountWidget,
  MonthlyBalanceTrendWidget,
  AccountFormDialog,
  AccountWithAnalytics,
} from '@/components/accounts';
import { FundSource, FundType } from '@/types/finance';

export default function Accounts() {
  const { user } = useAuth();

  // Queries
  const { data: fundSources = [], isLoading: isLoadingFunds } = useFundSources(user?.id || '');
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(
    user?.id || ''
  );

  // Mutations
  const addFundSourceMutation = useAddFundSource();
  const updateFundSourceMutation = useUpdateFundSource();
  const deleteFundSourceMutation = useDeleteFundSource();

  // Dialog states
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FundSource | null>(null);

  // Delete dialog state
  const [accountToDelete, setAccountToDelete] = useState<AccountWithAnalytics | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Chart trend filter
  const [trendMonths, setTrendMonths] = useState(6);

  // Analytics computation
  const analytics = useAccountsAnalytics({
    fundSources,
    transactions,
    trendMonths,
  });

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setIsAccountFormOpen(true);
  };

  const handleOpenEditAccount = (account: AccountWithAnalytics) => {
    setEditingAccount(account);
    setIsAccountFormOpen(true);
  };

  const handleAccountFormSubmit = async (data: {
    name: string;
    balance: number;
    type: FundType;
    account_number?: string;
    account_holder_name?: string;
    is_active: boolean;
  }) => {
    if (!user) return;

    if (editingAccount) {
      await updateFundSourceMutation.mutateAsync({
        id: editingAccount.id,
        updates: {
          name: data.name,
          balance: data.balance,
          type: data.type,
          account_number: data.account_number ?? null,
          account_holder_name: data.account_holder_name ?? null,
          is_active: data.is_active,
        },
      });
      toast({
        title: 'Account Updated',
        description: `${data.name} has been updated successfully.`,
      });
    } else {
      await addFundSourceMutation.mutateAsync({
        name: data.name,
        balance: data.balance,
        userId: user.id,
        extra: {
          type: data.type,
          account_number: data.account_number ?? null,
          account_holder_name: data.account_holder_name ?? null,
          is_active: data.is_active,
        },
      });
      toast({
        title: 'Account Created',
        description: `${data.name} has been created successfully.`,
      });
    }
  };

  const handleToggleStatus = async (account: AccountWithAnalytics) => {
    const nextStatus = account.is_active === false;
    try {
      await updateFundSourceMutation.mutateAsync({
        id: account.id,
        updates: { is_active: nextStatus },
      });
      toast({
        title: nextStatus ? 'Account Activated' : 'Account Deactivated',
        description: `${account.name} is now ${nextStatus ? 'active' : 'inactive'}.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update account status.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      setIsDeleting(true);
      await deleteFundSourceMutation.mutateAsync(accountToDelete.id);
      toast({
        title: 'Account Deleted',
        description: `${accountToDelete.name} has been removed.`,
      });
      setAccountToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error?.message || 'Could not delete account. It may have existing transactions.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingFunds || isLoadingTransactions) {
    return (
      <Layout>
        <AccountsSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-3.5 sm:p-6 lg:p-7 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#161F18]">
              Accounts
            </h1>
            <p className="text-xs sm:text-[13px] text-[#737E75] mt-0.5">
              Manage all your accounts, wallets, and cards in one place.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsTransferOpen(true)}
              className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs font-semibold border-[#EDF1EB] bg-white text-[#161F18] hover:bg-[#F6F7F5] gap-1.5 sm:gap-2 shadow-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </Button>

            <Button
              onClick={handleOpenAddAccount}
              className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs font-semibold bg-[#529E42] hover:bg-[#3E7A31] text-white gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </Button>
          </div>
        </div>

        {/* 4 TOP SUMMARY METRICS (CARDS 1 - 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <TotalBalanceWidget
            totalBalance={analytics.totalBalance}
            percentageChange={analytics.balanceChangePercent}
          />
          <MonthlyExpensesWidget
            totalExpenses={analytics.expenseThisMonth}
            percentageChange={analytics.expenseChangePercent}
          />
          <MonthlyIncomeWidget
            totalIncome={analytics.incomeThisMonth}
            percentageChange={analytics.incomeChangePercent}
          />
          <ActiveAccountsWidget
            activeCount={analytics.activeAccountsCount}
            inactiveCount={analytics.inactiveAccountsCount}
          />
        </div>

        {/* ASYMMETRICAL 12-COLUMN MASTER GRID (MATCHING REFERENCE DESIGN IMAGE 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* LEFT 8 COLUMNS: YOUR ACCOUNTS (TABLE) + 2 BOTTOM CHARTS */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-5 w-full min-w-0">
            {/* 5. YOUR ACCOUNTS TABLE */}
            <YourAccountsTableWidget
              accounts={analytics.accountsWithDetails}
              onEdit={handleOpenEditAccount}
              onTransfer={() => setIsTransferOpen(true)}
              onToggleStatus={handleToggleStatus}
              onDelete={(acc) => setAccountToDelete(acc)}
            />

            {/* 8 & 9. BOTTOM 2 WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* 8. SPENDING BY ACCOUNT */}
              <SpendingByAccountWidget spendingData={analytics.spendingByAccount} />

              {/* 9. MONTHLY BALANCE TREND */}
              <MonthlyBalanceTrendWidget
                trendData={analytics.monthlyBalanceTrend}
                selectedMonths={trendMonths}
                onSelectMonths={setTrendMonths}
              />
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: BALANCE DISTRIBUTION & RECENT TRANSACTIONS */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-5 w-full min-w-0">
            {/* 6. BALANCE DISTRIBUTION */}
            <BalanceDistributionWidget
              distribution={analytics.balanceDistribution}
              totalBalance={analytics.totalBalance}
            />

            {/* 7. RECENT TRANSACTIONS */}
            <AccountsRecentTransactionsWidget transactions={analytics.recentTransactions} />
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      {/* Add / Edit Account Dialog */}
      <AccountFormDialog
        open={isAccountFormOpen}
        onOpenChange={setIsAccountFormOpen}
        account={editingAccount}
        onSubmit={handleAccountFormSubmit}
      />

      {/* Transfer Dialog */}
      <TransferDialog
        open={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        fundSources={fundSources}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{accountToDelete?.name}&quot;? If this account
              has linked transactions, the deletion may be prevented to protect your ledger
              history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setAccountToDelete(null)}
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="rounded-xl"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
