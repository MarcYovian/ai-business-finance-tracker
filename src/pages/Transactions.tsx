import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/currency';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { TransactionDialog } from '@/components/TransactionDialog';
import { toast } from '@/hooks/use-toast';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFundSources } from '@/hooks/useFundSources';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const TransactionLoading = () => (
  <Layout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </Layout>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
    <h3 className="mt-4 text-lg font-medium">No Transactions Found</h3>
    <p className="mt-1 text-sm text-muted-foreground">It looks like there are no transactions matching your filters.</p>
  </div>
);

export default function Transactions() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const { data: transactions = [], isLoading } = useTransactions(user?.id || '');
  const { data: categories = [] } = useCategories(user?.id || '');
  const { data: fundSources = [] } = useFundSources(user?.id || '');
  const deleteTransactionMutation = useDeleteTransaction();

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions;
    if (typeFilter !== 'all') {
      filtered = transactions.filter(t => t.type === typeFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        case 'date-desc':
        default: return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      }
    });
  }, [transactions, typeFilter, sortBy]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransactionMutation.mutateAsync(id);
        toast({ title: 'Transaction deleted' });
      } catch (error) {
        toast({ title: 'Error', description: 'Could not delete transaction.', variant: 'destructive' });
      }
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  const getCategoryName = (categoryId?: string) => categories.find(c => c.id === categoryId)?.name || 'Uncategorized';

  const getFundSourceName = (fundId?: string) => fundSources.find(s => s.id === fundId)?.name || 'N/A';

  const renderTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return <ArrowUp className="h-5 w-5" />;
      case 'expense': return <ArrowDown className="h-5 w-5" />;
      case 'transfer': return <ArrowRightLeft className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return <TransactionLoading />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">A detailed history of all {transactions.length} financial movements.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>History</CardTitle>
              <div className="flex items-center gap-2">
                <ToggleGroup type="single" value={typeFilter} onValueChange={setTypeFilter} defaultValue="all">
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                  <ToggleGroupItem value="income">Income</ToggleGroupItem>
                  <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
                  <ToggleGroupItem value="transfer">Transfer</ToggleGroupItem>
                </ToggleGroup>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAndSortedTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedTransactions.map(t => (
                  <div key={t.id} className="flex items-center gap-4 rounded-lg border p-3 pr-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.type === 'income' ? 'bg-success/10 text-success' : t.type === 'transfer' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                      {renderTransactionIcon(t.type)}
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 items-center">
                      <p className="font-medium truncate col-span-2 sm:col-span-1">{t.description}</p>
                      <div className="text-sm text-muted-foreground">
                        <p>{formatDate(t.transactionDate)}</p>
                        <p className="sm:hidden">{t.type === 'transfer' ? getFundSourceName(t.sourceFundId) : getCategoryName(t.categoryId)}</p>
                      </div>
                      <div className="hidden sm:block text-sm text-muted-foreground">
                        <p>{t.type === 'transfer' ? getFundSourceName(t.sourceFundId) : getCategoryName(t.categoryId)}</p>
                        <p>{t.type === 'transfer' ? getFundSourceName(t.destinationFundId) : getFundSourceName(t.sourceFundId || t.destinationFundId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <p className={`font-semibold text-right ${t.type === 'income' ? 'text-success' : t.type === 'transfer' ? 'text-primary' : 'text-destructive'}`}>
                        {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
                      </p>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} disabled={deleteTransactionMutation.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        transaction={editingTransaction}
      />
    </Layout>
  );
}
