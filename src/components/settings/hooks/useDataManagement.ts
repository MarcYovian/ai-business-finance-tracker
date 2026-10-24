import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DataUsageStats } from '../types';

export const useDataManagement = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ['data_management_stats', userId],
    queryFn: async (): Promise<DataUsageStats> => {
      if (!userId) {
        return {
          transactionsCount: 0,
          accountsCount: 0,
          categoriesCount: 0,
          budgetsCount: 0,
        };
      }

      const [txRes, accountsRes, catRes, budgetsRes] = await Promise.all([
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('fund_sources').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      return {
        transactionsCount: txRes.count || 0,
        accountsCount: accountsRes.count || 0,
        categoriesCount: catRes.count || 0,
        budgetsCount: budgetsRes.count || 0,
      };
    },
    enabled: !!userId,
  });

  const exportData = async (format: 'json' | 'csv' = 'json') => {
    if (!userId) throw new Error('User is not logged in');

    const [txRes, accountsRes, catRes, budgetsRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId),
      supabase.from('fund_sources').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('budgets').select('*').eq('user_id', userId),
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      userId,
      accounts: accountsRes.data || [],
      categories: catRes.data || [],
      budgets: budgetsRes.data || [],
      transactions: txRes.data || [],
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Export transactions as CSV
      const transactions = txRes.data || [];
      if (transactions.length === 0) {
        throw new Error('No transactions found to export.');
      }

      const headers = ['id', 'date', 'description', 'amount', 'type', 'notes', 'status'];
      const rows = transactions.map((t) => [
        t.id,
        t.transaction_date,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        (t.amount / 100).toFixed(2),
        t.type,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        t.status || 'completed',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const importTransactionsCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error('User not authenticated');

      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error('CSV file is empty or missing headers.');

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('keterangan') || h.includes('title'));
      const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('nominal') || h.includes('jumlah'));
      const typeIdx = headers.findIndex((h) => h.includes('type') || h.includes('jenis') || h.includes('tipe'));
      const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('tanggal'));

      if (descIdx === -1 || amountIdx === -1) {
        throw new Error('CSV must contain at least Description and Amount columns.');
      }

      const importedRows = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
        const desc = row[descIdx];
        const rawAmount = parseFloat(row[amountIdx]?.replace(/[^\d.-]/g, '') || '0');
        if (!desc || isNaN(rawAmount) || rawAmount === 0) continue;

        let type = 'expense';
        if (typeIdx !== -1 && row[typeIdx]) {
          const t = row[typeIdx].toLowerCase();
          if (t.includes('in') || t.includes('masuk')) type = 'income';
          else if (t.includes('trans')) type = 'transfer';
        }

        let txDate = new Date().toISOString();
        if (dateIdx !== -1 && row[dateIdx]) {
          const parsed = new Date(row[dateIdx]);
          if (!isNaN(parsed.getTime())) txDate = parsed.toISOString();
        }

        importedRows.push({
          user_id: userId,
          description: desc,
          amount: Math.round(Math.abs(rawAmount) * 100),
          type,
          transaction_date: txDate,
          status: 'completed',
        });
      }

      if (importedRows.length === 0) {
        throw new Error('No valid transactions could be parsed from the CSV.');
      }

      const { data, error } = await supabase.from('transactions').insert(importedRows).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['data_management_stats', userId] });
    },
  });

  const resetDataMutation = useMutation({
    mutationFn: async ({
      resetTransactions = true,
      resetBudgets = true,
      resetGoals = false,
      resetBalances = true,
    }: {
      resetTransactions?: boolean;
      resetBudgets?: boolean;
      resetGoals?: boolean;
      resetBalances?: boolean;
    }) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('reset_user_financial_data', {
        p_user_id: userId,
        p_reset_transactions: resetTransactions,
        p_reset_budgets: resetBudgets,
        p_reset_goals: resetGoals,
        p_reset_accounts_balance: resetBalances,
      });

      if (error) {
        console.error('Error resetting financial data:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fund_sources'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['data_management_stats', userId] });
    },
  });

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    exportData,
    importCsv: importTransactionsCsvMutation.mutateAsync,
    isImportingCsv: importTransactionsCsvMutation.isPending,
    resetData: resetDataMutation.mutateAsync,
    isResettingData: resetDataMutation.isPending,
  };
};
