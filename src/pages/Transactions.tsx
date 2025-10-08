import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/currency';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TransactionDialog } from '@/components/TransactionDialog';
import { toast } from '@/hooks/use-toast';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFundSources } from '@/hooks/useFundSources';
import { useDeleteTransaction } from '@/hooks/useTransactions';

export default function Transactions() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading } = useTransactions(user?.id || '');
  const { data: categories = [] } = useCategories(user?.id || '');
  const { data: fundSources = [] } = useFundSources(user?.id || '');
  const deleteTransactionMutation = useDeleteTransaction();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransactionMutation.mutateAsync(id);
        toast({ title: 'Transaction deleted', description: 'The transaction has been removed.' });
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
    // No need to manually reload data - TanStack Query handles this automatically
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const getFundSourceName = (sourceFundId?: string, destinationFundId?: string) => {
    // For transfer transactions, we need to show both source and destination
    if (sourceFundId && destinationFundId) {
      const source = fundSources.find(s => s.id === sourceFundId);
      const destination = fundSources.find(s => s.id === destinationFundId);
      return `${source?.name || 'N/A'} → ${destination?.name || 'N/A'}`;
    }
    
    // For income/expense, use the appropriate fund ID
    const fundId = sourceFundId || destinationFundId;
    const source = fundSources.find(s => s.id === fundId);
    return source?.name || 'N/A';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Manage your income and expenses</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{transaction.description}</p>
                          <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                            <span>{formatDate(transaction.transactionDate)}</span>
                            <span>•</span>
                            <span>
                              {transaction.type === 'transfer' 
                                ? transaction.type.toUpperCase() 
                                : transaction.type === 'income' 
                                  ? 'Income' 
                                  : transaction.type === 'expense' 
                                    ? 'Expense'
                                    : transaction.type}
                            </span>
                            <span>•</span>
                            <span>{getCategoryName(transaction.categoryId)}</span>
                            <span>•</span>
                            <span>{getFundSourceName(transaction.sourceFundId, transaction.destinationFundId)}</span>
                          </div>
                        </div>
                        <div className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-success' : transaction.type === 'transfer' ? 'text-primary' : 'text-destructive'}`}>
                          {transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deleteTransactionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>No transactions yet. Add your first transaction to get started!</p>
              </div>
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
