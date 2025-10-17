import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useFundSources } from "@/hooks/useFundSources";
import {
  useAddTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/useTransactions";
import {
  formatCurrency,
  formatCurrencyForInput,
  parseCurrency,
  parseCurrencyWithoutMultiplier,
} from "@/lib/currency";
import {
  Category,
  FundSource,
  Transaction,
  TransactionType,
} from "@/types/finance";
import { useEffect, useState } from "react";

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

export const TransactionDialog = ({
  open,
  onClose,
  transaction,
}: TransactionDialogProps) => {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sourceFundId, setSourceFundId] = useState<string | null>(null);
  const [destinationFundId, setDestinationFundId] = useState<string | null>(
    null
  );
  const [fee, setFee] = useState("");

  // Filter transactions based on type
  const { data: allTransactions = [] } = useTransactions(user?.id || "");

  // Filter categories based on transaction type
  const { data: categories = [] } = useCategories(
    user?.id || "",
    type === "transfer" ? undefined : type
  );
  const { data: fundSources = [] } = useFundSources(user?.id || "");

  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount((transaction.amount / 100).toString());
      setType(transaction.type);
      setDate(transaction.transactionDate.split("T")[0]);
      setCategoryId(transaction.categoryId || null);
      setSourceFundId(transaction.sourceFundId || null);
      setDestinationFundId(transaction.destinationFundId || null);

      const feeAmount =
        transaction.type === "transfer"
          ? allTransactions.find(
              (t) => t.parentTransactionId === transaction.id
            )?.amount
          : undefined;
      setFee(feeAmount != null ? (feeAmount / 100).toString() : "");
    } else {
      setDescription("");
      setAmount("");
      setType("expense");
      setDate(new Date().toISOString().split("T")[0]);
      setCategoryId(null);
      setSourceFundId(null);
      setDestinationFundId(null);
      setFee("");
    }
  }, [transaction, open, allTransactions]);

  // Group categories by parent for hierarchical display
  const parentCategories = categories.filter((cat) => !cat.parentId);
  const subCategories = categories.filter((cat) => cat.parentId);
  const getSubCategories = (parentId: string) =>
    subCategories.filter((sub) => sub.parentId === parentId);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setAmount(numericValue);
  };

  const handleFeeChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setFee(numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountValue = parseCurrencyWithoutMultiplier(amount);
    const feeValue = fee ? parseCurrencyWithoutMultiplier(fee) : 0;

    try {
      if (transaction) {
        await updateTransactionMutation.mutateAsync({
          id: transaction.id,
          updates: {
            description,
            amount: amountValue,
            type,
            transactionDate: new Date(date).toISOString(),
            categoryId: categoryId || undefined,
            sourceFundId: sourceFundId || undefined,
            destinationFundId: destinationFundId || undefined,
            fee: feeValue,
          },
        });
        toast({
          title: "Transaction updated",
          description: "Your transaction has been saved.",
        });
      } else {
        await addTransactionMutation.mutateAsync({
          description,
          amount: amountValue,
          type,
          transactionDate: new Date(date).toISOString(),
          userId: user.id,
          categoryId: categoryId || undefined,
          sourceFundId: sourceFundId || undefined,
          destinationFundId: destinationFundId || undefined,
          fee: feeValue,
        });
        toast({
          title: "Transaction created",
          description: "Your transaction has been added.",
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  className="text-right pl-8"
                  value={formatCurrencyForInput(amount || "0")}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as TransactionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
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

          {type !== "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId || "__none"}
                onValueChange={(value) =>
                  setCategoryId(value === "__none" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {parentCategories.map((parent) => (
                    <SelectGroup key={parent.id}>
                      <SelectLabel>{parent.name}</SelectLabel>
                      <SelectItem value={parent.id} className="pl-6">
                        {parent.name}
                      </SelectItem>
                      {getSubCategories(parent.id).map((sub) => (
                        <SelectItem
                          key={sub.id}
                          value={sub.id}
                          className="pl-8"
                        >
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "transfer" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sourceFund">Source Fund</Label>
                <Select
                  value={sourceFundId || "__none"}
                  onValueChange={(value) =>
                    setSourceFundId(value === "__none" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {fundSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} ({formatCurrency(source.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destinationFund">Destination Fund</Label>
                <Select
                  value={destinationFundId || "__none"}
                  onValueChange={(value) =>
                    setDestinationFundId(value === "__none" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {fundSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} ({formatCurrency(source.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="fundSource">
                {type === "income" ? "Destination Fund" : "Source Fund"}
              </Label>
              <Select
                value={
                  (type === "income" ? destinationFundId : sourceFundId) ||
                  "__none"
                }
                onValueChange={(value) => {
                  if (type === "income") {
                    setDestinationFundId(value === "__none" ? null : value);
                  } else {
                    setSourceFundId(value === "__none" ? null : value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={`Select ${
                      type === "income" ? "destination" : "source"
                    } fund`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {fundSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({formatCurrency(source.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="fee">Admin Fee (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <Input
                  id="fee"
                  type="text"
                  inputMode="numeric"
                  className="text-right pl-8"
                  value={formatCurrencyForInput(fee || "0")}
                  onChange={(e) => handleFeeChange(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{transaction ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
