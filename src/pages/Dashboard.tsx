import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFundSources } from '@/hooks/useFundSources';
import { useBeneficiaries } from '@/hooks/useBeneficiaries';
import {
  DashboardSkeleton,
  CashflowChartWidget,
  MonthlyBudgetWidget,
  BusinessInsightWidget,
  CostAnalysisWidget,
  FinancialHealthWidget,
  FinancialGoalWidget,
  FundSourceCardSlider,
  BeneficiaryBookWidget,
  RecentTransactionsWidget,
  AddBeneficiaryDialog,
} from '@/components/dashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(
    user?.id || ''
  );
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories(
    user?.id || ''
  );
  const { data: fundSources = [], isLoading: isLoadingFunds } = useFundSources(
    user?.id || ''
  );
  const { data: beneficiaries = [], isLoading: isLoadingBeneficiaries } = useBeneficiaries(
    user?.id || ''
  );

  // Active accounts only
  const activeFundSources = useMemo(() => {
    return fundSources.filter((fs) => fs.is_active !== false);
  }, [fundSources]);

  // Aggregated totals
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const savedBalance = Math.max(0, totalIncome - totalExpenses);

  const totalFundBalance = useMemo(() => {
    if (activeFundSources.length > 0) {
      return activeFundSources.reduce((sum, fs) => sum + (fs.balance || 0), 0);
    }
    return savedBalance;
  }, [activeFundSources, savedBalance]);

  if (isLoadingTransactions || isLoadingCategories || isLoadingFunds || isLoadingBeneficiaries) {
    return <DashboardSkeleton />;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-7 space-y-6">
        {/* ASYMMETRICAL 12-COLUMN MASTER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT 8 COLUMNS: SALDO, GRAFIK, BUDGET, ANALISIS BIAYA, KESEHATAN, TARGET */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. BALANCE OVERVIEW & 7-DAY BAR / LINE CHART CARD */}
            <CashflowChartWidget
              transactions={transactions}
              totalFundBalance={totalFundBalance}
            />

            {/* 2. MIDDLE ROW: Monthly Spending Limit & Budget Tip (2 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-6">
                <MonthlyBudgetWidget transactions={transactions} />
              </div>
              <div className="md:col-span-6">
                <BusinessInsightWidget
                  transactions={transactions}
                  categories={categories}
                />
              </div>
            </div>

            {/* 3. BOTTOM ROW: Cost Analysis, Financial Health, Goal Tracker (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <CostAnalysisWidget
                transactions={transactions}
                categories={categories}
              />
              <FinancialHealthWidget
                transactions={transactions}
                totalFundBalance={totalFundBalance}
              />
              <FinancialGoalWidget
                totalFundBalance={totalFundBalance}
                userId={user?.id}
              />
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: KARTU SAYA, BUKU REKENING, RIWAYAT TRANSAKSI */}
          <div className="lg:col-span-4 space-y-5">
            <FundSourceCardSlider
              fundSources={fundSources}
              userName={user?.email?.split('@')[0]}
            />
            <BeneficiaryBookWidget
              beneficiaries={beneficiaries}
              onAddClick={() => setIsAddContactOpen(true)}
            />
            <RecentTransactionsWidget
              transactions={transactions}
            />
          </div>
        </div>
      </div>

      {/* DIALOG TAMBAH KONTAK REKENING / E-WALLET */}
      <AddBeneficiaryDialog
        open={isAddContactOpen}
        onOpenChange={setIsAddContactOpen}
        userId={user?.id}
      />
    </Layout>
  );
}