import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FundSource } from '@/types/finance';
import { parseCurrency } from '@/lib/currency';
import { toast } from '@/hooks/use-toast';
import { useCreateTransfer } from '@/hooks/useTransactions';

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  fundSources: FundSource[];
}

export const TransferDialog = ({ open, onClose, fundSources }: TransferDialogProps) => {
  const { user } = useAuth();
  const [fromFundId, setFromFundId] = useState<string | null>(null);
  const [toFundId, setToFundId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');

  const createTransferMutation = useCreateTransfer();

  useEffect(() => {
    if (!open) {
      setFromFundId(null);
      setToFundId(null);
      setAmount('');
      setFee('');
    }
  }, [open]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fromFundId || !toFundId || !amount) return;

    if (fromFundId === toFundId) {
      toast({ title: 'Invalid Transfer', description: 'Source and destination cannot be the same.', variant: 'destructive' });
      return;
    }

    const amountInCents = parseCurrency(amount);
    const feeInCents = fee ? parseCurrency(fee) : 0;

    try {
      await createTransferMutation.mutateAsync({
        fromFundId,
        toFundId,
        amount: amountInCents,
        fee: feeInCents
      });
      toast({ title: 'Transfer Successful', description: 'Funds have been moved.' });
      onClose();
    } catch (error: any) {
      toast({ title: 'Transfer Failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Between Fund Sources</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromFundId || ''} onValueChange={setFromFundId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source fund" />
              </SelectTrigger>
              <SelectContent>
                {fundSources.map(fs => (
                  <SelectItem key={fs.id} value={fs.id}>{fs.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Select value={toFundId || ''} onValueChange={setToFundId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination fund" />
              </SelectTrigger>
              <SelectContent>
                {fundSources.map(fs => (
                  <SelectItem key={fs.id} value={fs.id}>{fs.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="fee">Admin Fee (Optional)</Label>
            <Input
              id="fee"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Transfer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};