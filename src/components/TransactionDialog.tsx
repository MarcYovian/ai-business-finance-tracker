import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { useBudgetDetails, useCurrentBudget } from "@/hooks/useBudget";
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
  parseCurrencyWithoutMultiplier,
} from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types/finance";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Progress } from "./ui/progress";

const transactionSchema = z
  .object({
    description: z.string().min(1, "Description is required."),
    amount: z
      .string()
      .refine((val) => /[\d,]+/.test(val) && parseFloat(val) > 0, {
        message: "Amount must be a positive number.",
      }),
    type: z.enum(["income", "expense", "transfer"]),
    transactionDate: z.string().min(1, "Date is required."),
    categoryId: z.string().nullable().optional(),
    sourceFundId: z.string().nullable().optional(),
    destinationFundId: z.string().nullable().optional(),
    fee: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer") {
      if (!data.sourceFundId || data.sourceFundId === "__none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceFundId"],
          message: "Source fund is required for transfers.",
        });
      }
      if (!data.destinationFundId || data.destinationFundId === "__none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationFundId"],
          message: "Destination fund is required for transfers.",
        });
      }
      if (
        data.sourceFundId &&
        data.destinationFundId &&
        data.sourceFundId === data.destinationFundId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationFundId"],
          message: "Destination fund cannot be the same as source fund.",
        });
      }
    } else if (data.type === "income") {
      if (!data.destinationFundId || data.destinationFundId === "__none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationFundId"],
          message: "Destination fund is required for income.",
        });
      }
    } else if (data.type === "expense") {
      if (!data.sourceFundId || data.sourceFundId === "__none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceFundId"],
          message: "Source fund is required for expenses.",
        });
      }
    }
  });

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onDelete?: () => void;
}

export const TransactionDialog = ({
  open,
  onClose,
  transaction,
  onDelete,
}: TransactionDialogProps) => {
  const { user } = useAuth();
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: "0",
      type: "expense",
      transactionDate: new Date().toISOString().split("T")[0],
      categoryId: null,
      sourceFundId: null,
      destinationFundId: null,
      fee: "0",
    },
  });

  const type = form.watch("type");
  const selectedCategoryId = form.watch("categoryId");
  const amountString = form.watch("amount");
  const transactionDate = form.watch("transactionDate");

  const { data: allTransactions = [] } = useTransactions(user?.id || "");
  const { data: categories = [] } = useCategories(
    user?.id || "",
    type === "transfer" ? undefined : type
  );
  const { data: fundSources = [] } = useFundSources(user?.id || "");

  // Get budget for the transaction month
  const selectedDate = transactionDate ? new Date(transactionDate) : new Date();
  const { data: currentBudget } = useCurrentBudget(selectedDate);
  const { data: budgetDetails = [] } = useBudgetDetails(currentBudget?.id);

  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();

  useEffect(() => {
    if (open) {
      if (transaction) {
        const feeAmount =
          transaction.type === "transfer"
            ? allTransactions.find(
                (t) => t.parentTransactionId === transaction.id
              )?.amount
            : undefined;

        form.reset({
          description: transaction.description,
          amount: (transaction.amount / 100).toString(),
          type: transaction.type,
          transactionDate: transaction.transactionDate.split("T")[0],
          categoryId: transaction.categoryId || null,
          sourceFundId: transaction.sourceFundId || null,
          destinationFundId: transaction.destinationFundId || null,
          fee: feeAmount != null ? (feeAmount / 100).toString() : "0",
        });
      } else {
        form.reset({
          description: "",
          amount: "0",
          type: "expense",
          transactionDate: new Date().toISOString().split("T")[0],
          categoryId: null,
          sourceFundId: null,
          destinationFundId: null,
          fee: "0",
        });
      }
    }
  }, [transaction, open, allTransactions, form]);

  // Calculate budget impact
  const budgetImpact = useMemo(() => {
    if (
      type !== "expense" ||
      !selectedCategoryId ||
      selectedCategoryId === "__none"
    ) {
      return null;
    }

    const budgetItem = budgetDetails.find(
      (item) => item.category_id === selectedCategoryId
    );

    if (!budgetItem) {
      return null;
    }

    const currentAmount = parseCurrencyWithoutMultiplier(amountString || "0");
    const currentAmountInCents = currentAmount * 100;

    // If editing, subtract the original amount from spent
    const originalSpent =
      transaction?.categoryId === selectedCategoryId
        ? budgetItem.spent - transaction.amount
        : budgetItem.spent;

    const newSpent = originalSpent + currentAmountInCents;
    const budgeted = budgetItem.amount;
    const remaining = budgeted - newSpent;
    const progress = budgeted > 0 ? (newSpent / budgeted) * 100 : 0;

    const isOverBudget = newSpent > budgeted;
    const isNearLimit = progress > 80 && progress <= 100;
    const isWellWithinBudget = progress <= 80;

    return {
      categoryName: budgetItem.category_name,
      budgeted,
      currentSpent: originalSpent,
      newSpent,
      remaining,
      progress: Math.min(progress, 100),
      isOverBudget,
      isNearLimit,
      isWellWithinBudget,
      overBudgetAmount: isOverBudget ? Math.abs(remaining) : 0,
    };
  }, [type, selectedCategoryId, amountString, budgetDetails, transaction]);

  const parentCategories = categories.filter((cat) => !cat.parentId);
  const subCategories = categories.filter((cat) => cat.parentId);
  const getSubCategories = (parentId: string) =>
    subCategories.filter((sub) => sub.parentId === parentId);

  const handleSubmit = async (data: TransactionFormData) => {
    if (!user) return;

    const amountValue = parseCurrencyWithoutMultiplier(data.amount);
    const feeValue = data.fee ? parseCurrencyWithoutMultiplier(data.fee) : 0;

    try {
      if (transaction) {
        await updateTransactionMutation.mutateAsync({
          id: transaction.id,
          updates: {
            ...data,
            amount: amountValue,
            transactionDate: new Date(data.transactionDate).toISOString(),
            categoryId: data.categoryId || undefined,
            sourceFundId: data.sourceFundId || undefined,
            destinationFundId: data.destinationFundId || undefined,
            fee: feeValue,
          },
        });
        toast({
          title: "Transaction updated",
          description: "Your transaction has been saved.",
        });
      } else {
        await addTransactionMutation.mutateAsync({
          description: data.description,
          type: data.type,
          amount: amountValue,
          transactionDate: new Date(data.transactionDate).toISOString(),
          userId: user.id,
          categoryId: data.categoryId || undefined,
          sourceFundId: data.sourceFundId || undefined,
          destinationFundId: data.destinationFundId || undefined,
          fee: feeValue,
        });
        toast({
          title: "Transaction created",
          description: "Your transaction has been added.",
        });
      }
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Coffee with client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          Rp
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          className="text-right pl-8"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            field.onChange(formatCurrencyForInput(value));
                          }}
                          value={formatCurrencyForInput(field.value || "0")}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type !== "transfer" && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "__none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Budget Impact Visualization */}
            {budgetImpact && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Budget Impact</span>
                  <span className="text-muted-foreground">
                    {budgetImpact.categoryName}
                  </span>
                </div>

                {/* Over Budget Warning */}
                {budgetImpact.isOverBudget && (
                  <Alert variant="destructive" className="border-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      <strong>Over Budget!</strong> This expense will exceed
                      your budget by{" "}
                      <strong>
                        {formatCurrency(budgetImpact.overBudgetAmount)}
                      </strong>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Near Limit Warning */}
                {budgetImpact.isNearLimit && !budgetImpact.isOverBudget && (
                  <Alert className="border-yellow-500 border-2 bg-yellow-50 dark:bg-yellow-950">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="ml-2 text-yellow-800 dark:text-yellow-200">
                      <strong>Near Budget Limit!</strong> You're approaching
                      your budget limit.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Well Within Budget */}
                {budgetImpact.isWellWithinBudget && (
                  <Alert className="border-green-500 border-2 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="ml-2 text-green-800 dark:text-green-200">
                      Within budget limits
                    </AlertDescription>
                  </Alert>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress
                    value={budgetImpact.progress}
                    className="h-3"
                    indicatorClassName={cn(
                      budgetImpact.isOverBudget && "bg-destructive",
                      budgetImpact.isNearLimit && "bg-yellow-500",
                      budgetImpact.isWellWithinBudget && "bg-primary"
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      <span>
                        Spent: {formatCurrency(budgetImpact.newSpent)}
                      </span>
                    </div>
                    <span>
                      Budgeted: {formatCurrency(budgetImpact.budgeted)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        budgetImpact.remaining < 0
                          ? "text-destructive"
                          : "text-success"
                      )}
                    >
                      {budgetImpact.remaining >= 0
                        ? "Remaining: "
                        : "Over by: "}
                      {formatCurrency(Math.abs(budgetImpact.remaining))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {type === "transfer" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sourceFundId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Fund</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "__none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {fundSources.map((source) => (
                            <SelectItem key={source.id} value={source.id}>
                              {source.name} ({formatCurrency(source.balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinationFundId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Fund</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "__none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {fundSources.map((source) => (
                            <SelectItem key={source.id} value={source.id}>
                              {source.name} ({formatCurrency(source.balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name={type === "income" ? "destinationFundId" : "sourceFundId"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {type === "income" ? "Destination Fund" : "Source Fund"}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "__none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={`Select ${
                              type === "income" ? "destination" : "source"
                            } fund`}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {fundSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name} ({formatCurrency(source.balance)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === "transfer" && (
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Fee (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          Rp
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          className="text-right pl-8"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            field.onChange(formatCurrencyForInput(value));
                          }}
                          value={formatCurrencyForInput(field.value || "0")}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              {transaction && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="sm:mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    addTransactionMutation.isPending ||
                    updateTransactionMutation.isPending
                  }
                  className="flex-1 sm:flex-none"
                >
                  {transaction ? "Update" : "Create"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
