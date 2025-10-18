import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Layout } from "@/components/Layout";
import { TransactionDialog } from "@/components/TransactionDialog";
import { TransactionIcon } from "@/components/TransactionIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useFundSources } from "@/hooks/useFundSources";
import { useDeleteTransaction, useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types/finance";
import {
  AlertCircle,
  Calendar,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

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
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
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
    <p className="mt-1 text-sm text-muted-foreground">
      {new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}{" "}
      doesn't have any transactions yet.
    </p>
  </div>
);

interface GroupedTransactions {
  date: string;
  dateFormatted: string;
  dayOfWeek: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
}

export default function Transactions() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("current");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  const { data: transactions = [], isLoading } = useTransactions(
    user?.id || ""
  );
  const { data: categories = [] } = useCategories(user?.id || "");
  const { data: fundSources = [] } = useFundSources(user?.id || "");
  const deleteTransactionMutation = useDeleteTransaction();

  // Get available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      const date = new Date(t.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filter transactions by selected month
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let filtered = transactions;

    if (selectedMonth === "current") {
      // Current month
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      filtered = transactions.filter((t) => {
        const date = new Date(t.transactionDate);
        return date >= currentMonthStart && date <= currentMonthEnd;
      });
    } else if (selectedMonth !== "all") {
      // Specific month
      const [year, month] = selectedMonth.split("-").map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);
      filtered = transactions.filter((t) => {
        const date = new Date(t.transactionDate);
        return date >= monthStart && date <= monthEnd;
      });
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    return filtered;
  }, [transactions, selectedMonth, typeFilter]);

  // Group transactions by date
  const groupedTransactions = useMemo<GroupedTransactions[]>(() => {
    const groups: { [key: string]: GroupedTransactions } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.transactionDate);
      const dateKey = date.toISOString().split("T")[0];

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          dateFormatted: date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          dayOfWeek: date.toLocaleDateString("id-ID", { weekday: "long" }),
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
        };
      }

      groups[dateKey].transactions.push(transaction);

      // Calculate totals
      if (transaction.type === "income") {
        groups[dateKey].totalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        groups[dateKey].totalExpense += transaction.amount;
      }
    });

    // Calculate net amount and sort transactions within each group
    Object.values(groups).forEach((group) => {
      group.netAmount = group.totalIncome - group.totalExpense;
      // Sort by time (most recent first within the same day)
      group.transactions.sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime()
      );
    });

    // Sort groups by date (most recent first)
    return Object.values(groups).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  // Calculate month summary
  const monthSummary = useMemo(() => {
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      transactionCount: filteredTransactions.length,
    };

    filteredTransactions.forEach((t) => {
      if (t.type === "income") {
        summary.totalIncome += t.amount;
      } else if (t.type === "expense") {
        summary.totalExpense += t.amount;
      }
    });

    summary.netAmount = summary.totalIncome - summary.totalExpense;
    return summary;
  }, [filteredTransactions]);

  const handleDelete = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransactionMutation.mutateAsync(transactionToDelete);
      toast({ title: "Transaction deleted" });
      setIsDeleteOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete transaction.",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  const getCategoryName = (categoryId?: string) =>
    categories.find((c) => c.id === categoryId)?.name || "Uncategorized";

  const getFundSourceName = (fundId?: string) =>
    fundSources.find((s) => s.id === fundId)?.name || "N/A";

  if (isLoading) {
    return <TransactionLoading />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">
              Track all your financial movements
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Income
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(monthSummary.totalIncome)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Expense
                  </p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(monthSummary.totalExpense)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Net Amount
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      monthSummary.netAmount >= 0
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {formatCurrency(monthSummary.netAmount)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  {monthSummary.transactionCount} transactions found
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                    {availableMonths.map((month) => {
                      const [year, monthNum] = month.split("-");
                      const date = new Date(
                        parseInt(year),
                        parseInt(monthNum) - 1
                      );
                      const label = date.toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      });
                      return (
                        <SelectItem key={month} value={month}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <ToggleGroup
                  type="single"
                  value={typeFilter}
                  onValueChange={(value) => value && setTypeFilter(value)}
                  className="justify-start"
                >
                  <ToggleGroupItem
                    value="all"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="income"
                    className="data-[state=on]:bg-success data-[state=on]:text-white"
                  >
                    Income
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="expense"
                    className="data-[state=on]:bg-destructive data-[state=on]:text-white"
                  >
                    Expense
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="transfer"
                    className="data-[state=on]:bg-blue-600 data-[state=on]:text-white"
                  >
                    Transfer
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {groupedTransactions.length > 0 ? (
              <div className="space-y-6">
                {groupedTransactions.map((group) => (
                  <div key={group.date} className="space-y-3">
                    {/* Date Header with Summary */}
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <h3 className="font-semibold text-base">
                          {group.dateFormatted}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {group.dayOfWeek}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-success">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">
                            {formatCurrency(group.totalIncome)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-destructive">
                          <TrendingDown className="h-4 w-4" />
                          <span className="font-medium">
                            {formatCurrency(group.totalExpense)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-2">
                      {group.transactions.map((t) => (
                        <Card
                          key={t.id}
                          className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                          onClick={() => handleCardClick(t)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              <div className="flex-shrink-0">
                                <TransactionIcon type={t.type} />
                              </div>

                              {/* Main Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {t.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {t.type === "transfer"
                                          ? `${getFundSourceName(
                                              t.sourceFundId
                                            )} → ${getFundSourceName(
                                              t.destinationFundId
                                            )}`
                                          : getCategoryName(t.categoryId)}
                                      </Badge>
                                      {t.type !== "transfer" && (
                                        <span className="text-xs text-muted-foreground">
                                          •{" "}
                                          {getFundSourceName(
                                            t.type === "income"
                                              ? t.destinationFundId
                                              : t.sourceFundId
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Amount */}
                                  <div className="flex-shrink-0">
                                    <p
                                      className={cn(
                                        "font-bold text-lg whitespace-nowrap",
                                        t.type === "income" && "text-success",
                                        t.type === "expense" &&
                                          "text-destructive",
                                        t.type === "transfer" && "text-primary"
                                      )}
                                    >
                                      {t.type === "income" && "+"}
                                      {t.type === "expense" && "-"}
                                      {formatCurrency(t.amount)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
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
        onDelete={
          editingTransaction
            ? () => handleDelete(editingTransaction.id)
            : undefined
        }
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isPending={deleteTransactionMutation.isPending}
      />
    </Layout>
  );
}
