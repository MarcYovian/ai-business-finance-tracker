import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/currency';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { TransactionDialog } from '@/components/TransactionDialog';
import { toast } from '@/hooks/use-toast';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFundSources } from '@/hooks/useFundSources';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TransactionIcon } from '@/components/TransactionIcon';

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
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>View and manage your financial activity.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <ToggleGroup
                  type="single"
                  defaultValue="all"
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as Transaction['type'] | 'all')}
                  className="w-full sm:w-auto"
                >
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                  <ToggleGroupItem value="income">Income</ToggleGroupItem>
                  <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
                  <ToggleGroupItem value="transfer">Transfer</ToggleGroupItem>
                </ToggleGroup>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
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
                  <div key={t.id} className="flex items-center gap-4 p-2 -m-2 rounded-lg hover:bg-muted">
                    {/* Icon Section */}
                    <div className="flex-shrink-0">
                      <TransactionIcon type={t.type} />
                    </div>

                    {/* Main Content Section */}
                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex-grow space-y-0.5">
                        <p className="font-medium leading-tight">{t.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(t.transactionDate)}</p>
                        <p className="text-sm text-muted-foreground sm:hidden">
                          {t.type === 'transfer' ? getFundSourceName(t.sourceFundId) : getCategoryName(t.categoryId)}
                        </p>
                      </div>

                      {/* Amount and Actions Section */}
                      <div className="flex items-center gap-2 sm:ml-auto mt-2 sm:mt-0">
                        <p className={`font-semibold text-sm sm:text-base ${
                          t.type === 'income' ? 'text-success' : t.type === 'transfer' ? 'text-primary' : 'text-destructive'
                        }`}>
                          {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
                        </p>
                        <div className="flex">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t.id)} disabled={deleteTransactionMutation.isPending}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
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
