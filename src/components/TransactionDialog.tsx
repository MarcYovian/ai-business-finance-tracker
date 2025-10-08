import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { transactionStorage, categoryStorage, fundSourceStorage } from '@/lib/storage';
import { Transaction, TransactionType } from '@/types/finance';
import { parseCurrency } from '@/lib/currency';
import { toast } from '@/hooks/use-toast';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

export const TransactionDialog = ({ open, onClose, transaction }: TransactionDialogProps) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fundSourceId, setFundSourceId] = useState('');

  const categories = user ? categoryStorage.getAll(user.id) : [];
  const fundSources = user ? fundSourceStorage.getAll(user.id) : [];

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount((transaction.amount / 100).toString());
      setType(transaction.type);
      setDate(transaction.transactionDate.split('T')[0]);
      setCategoryId(transaction.categoryId || '');
      setFundSourceId(transaction.fundSourceId || '');
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setFundSourceId('');
    }
  }, [transaction, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountInCents = parseCurrency(amount);
    
    if (transaction) {
      transactionStorage.update(transaction.id, {
        description,
        amount: amountInCents,
        type,
        transactionDate: new Date(date).toISOString(),
        categoryId: categoryId || undefined,
        fundSourceId: fundSourceId || undefined,
      });
      toast({ title: 'Transaction updated', description: 'Your transaction has been saved.' });
    } else {
      transactionStorage.create({
        description,
        amount: amountInCents,
        type,
        transactionDate: new Date(date).toISOString(),
        userId: user.id,
        categoryId: categoryId || undefined,
        fundSourceId: fundSourceId || undefined,
      });
      toast({ title: 'Transaction created', description: 'Your transaction has been added.' });
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Coffee with client"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fundSource">Fund Source</Label>
            <Select value={fundSourceId} onValueChange={setFundSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select fund source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {fundSources.map(source => (
                  <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {transaction ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
