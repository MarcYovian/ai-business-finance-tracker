import { QUERY_TYPES } from "@/constants/constants";
import { formatCurrency } from "@/lib/currency";
import { QueryResult } from "@/types/ai";
import { Category, FundSource, Transaction } from "@/types/finance";

export class QueryEngine {
  private transactions: Transaction[];
  private categories: Category[];
  private fundSources: FundSource[];

  constructor(
    transactions: Transaction[],
    categories: Category[],
    fundSources: FundSource[]
  ) {
    this.transactions = transactions;
    this.categories = categories;
    this.fundSources = fundSources;
  }

  // Helper to convert cents to rupiah for display
  private centsToRupiah(cents: number): number {
    return cents / 100;
  }

  // Helper to format currency
  private formatAmount(cents: number): string {
    return formatCurrency(cents);
  }

  // Detect query type from user input
  detectQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes("total expense") ||
      lowerQuery.includes("pengeluaran") ||
      lowerQuery.includes("spending")
    ) {
      if (lowerQuery.includes("month") || lowerQuery.includes("bulan")) {
        return QUERY_TYPES.TOTAL_EXPENSES_MONTH;
      }
    }

    if (
      lowerQuery.includes("total income") ||
      lowerQuery.includes("pemasukan") ||
      lowerQuery.includes("pendapatan")
    ) {
      if (lowerQuery.includes("month") || lowerQuery.includes("bulan")) {
        return QUERY_TYPES.TOTAL_INCOME_MONTH;
      }
    }

    if (
      lowerQuery.includes("biggest") ||
      lowerQuery.includes("terbesar") ||
      lowerQuery.includes("most") ||
      lowerQuery.includes("top category")
    ) {
      return QUERY_TYPES.TOP_EXPENSE_CATEGORY;
    }

    if (
      lowerQuery.includes("balance") ||
      lowerQuery.includes("saldo") ||
      lowerQuery.includes("fund")
    ) {
      return QUERY_TYPES.BALANCE_BY_FUND;
    }

    if (
      lowerQuery.includes("recent") ||
      lowerQuery.includes("last") ||
      lowerQuery.includes("terakhir") ||
      lowerQuery.includes("latest")
    ) {
      return QUERY_TYPES.RECENT_TRANSACTIONS;
    }

    if (
      lowerQuery.includes("compare") ||
      lowerQuery.includes("comparison") ||
      lowerQuery.includes("bandingkan") ||
      lowerQuery.includes("vs")
    ) {
      return QUERY_TYPES.MONTHLY_COMPARISON;
    }

    if (
      lowerQuery.includes("breakdown") ||
      lowerQuery.includes("rincian") ||
      lowerQuery.includes("by category")
    ) {
      return QUERY_TYPES.CATEGORY_BREAKDOWN;
    }

    if (
      lowerQuery.includes("trend") ||
      lowerQuery.includes("tren") ||
      lowerQuery.includes("pattern")
    ) {
      return QUERY_TYPES.SPENDING_TREND;
    }

    return QUERY_TYPES.TOTAL_EXPENSES_MONTH; // default
  }

  executeQuery(queryType: string): QueryResult {
    switch (queryType) {
      case QUERY_TYPES.TOTAL_EXPENSES_MONTH:
        return this.getTotalExpensesThisMonth();
      case QUERY_TYPES.TOTAL_INCOME_MONTH:
        return this.getTotalIncomeThisMonth();
      case QUERY_TYPES.TOP_EXPENSE_CATEGORY:
        return this.getTopExpenseCategory();
      case QUERY_TYPES.BALANCE_BY_FUND:
        return this.getBalanceByFund();
      case QUERY_TYPES.RECENT_TRANSACTIONS:
        return this.getRecentTransactions();
      case QUERY_TYPES.MONTHLY_COMPARISON:
        return this.getMonthlyComparison();
      case QUERY_TYPES.CATEGORY_BREAKDOWN:
        return this.getCategoryBreakdown();
      case QUERY_TYPES.SPENDING_TREND:
        return this.getSpendingTrend();
      default:
        return this.getTotalExpensesThisMonth();
    }
  }

  private getTotalExpensesThisMonth(): QueryResult {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const expensesCents = this.transactions
      .filter(
        (t) => t.type === "expense" && new Date(t.transactionDate) >= thisMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      type: QUERY_TYPES.TOTAL_EXPENSES_MONTH,
      data: {
        total: this.centsToRupiah(expensesCents),
        totalCents: expensesCents,
        month: now.toLocaleString("id-ID", { month: "long", year: "numeric" }),
      },
      summary: `Total pengeluaran bulan ini: Rp ${this.formatAmount(
        expensesCents
      )}`,
    };
  }

  private getTotalIncomeThisMonth(): QueryResult {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const incomeCents = this.transactions
      .filter(
        (t) => t.type === "income" && new Date(t.transactionDate) >= thisMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      type: QUERY_TYPES.TOTAL_INCOME_MONTH,
      data: {
        total: this.centsToRupiah(incomeCents),
        totalCents: incomeCents,
        month: now.toLocaleString("id-ID", { month: "long", year: "numeric" }),
      },
      summary: `Total pemasukan bulan ini: Rp ${this.formatAmount(
        incomeCents
      )}`,
    };
  }

  private getTopExpenseCategory(): QueryResult {
    const expenseByCategoryCents = this.transactions
      .filter((t) => t.type === "expense" && t.categoryId)
      .reduce((acc, t) => {
        const category = this.categories.find((c) => c.id === t.categoryId);
        if (category) {
          acc[category.name] = (acc[category.name] || 0) + t.amount;
        }
        return acc;
      }, {} as Record<string, number>);

    const sorted = Object.entries(expenseByCategoryCents).sort(
      (a, b) => b[1] - a[1]
    );
    const topCategory = sorted[0];

    if (!topCategory) {
      return {
        type: QUERY_TYPES.TOP_EXPENSE_CATEGORY,
        data: { category: null, amount: 0 },
        summary: "Belum ada data pengeluaran berdasarkan kategori.",
      };
    }

    const totalCents = Object.values(expenseByCategoryCents).reduce(
      (a, b) => a + b,
      0
    );
    const percentage =
      sorted.length > 1
        ? ((topCategory[1] / totalCents) * 100).toFixed(1)
        : "100";

    return {
      type: QUERY_TYPES.TOP_EXPENSE_CATEGORY,
      data: {
        category: topCategory[0],
        amount: this.centsToRupiah(topCategory[1]),
        amountCents: topCategory[1],
        percentage,
        allCategories: sorted.map(([name, cents]) => ({
          name,
          amount: this.centsToRupiah(cents),
          amountCents: cents,
        })),
      },
      summary: `Kategori pengeluaran terbesar: ${
        topCategory[0]
      } dengan total ${this.formatAmount(topCategory[1])} (${percentage}%)`,
      visualizationData: sorted.slice(0, 5).map(([name, cents]) => ({
        name,
        amount: this.centsToRupiah(cents),
        amountCents: cents,
      })),
    };
  }

  private getBalanceByFund(): QueryResult {
    const balances = this.fundSources.map((fund) => ({
      name: fund.name,
      balance: this.centsToRupiah(fund.balance),
      balanceCents: fund.balance,
    }));

    const totalBalanceCents = balances.reduce(
      (sum, f) => sum + f.balanceCents,
      0
    );

    return {
      type: QUERY_TYPES.BALANCE_BY_FUND,
      data: {
        balances,
        total: this.centsToRupiah(totalBalanceCents),
        totalCents: totalBalanceCents,
      },
      summary: `Total saldo: ${this.formatAmount(totalBalanceCents)}\n${balances
        .map((b) => `- ${b.name}: ${this.formatAmount(b.balanceCents)}`)
        .join("\n")}`,
      visualizationData: balances,
    };
  }

  private getRecentTransactions(limit: number = 5): QueryResult {
    const recent = this.transactions
      .sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime()
      )
      .slice(0, limit)
      .map((t) => {
        const category = this.categories.find((c) => c.id === t.categoryId);
        return {
          date: new Date(t.transactionDate).toLocaleDateString("id-ID"),
          description: t.description,
          amount: this.centsToRupiah(t.amount),
          amountCents: t.amount,
          amountFormatted: this.formatAmount(t.amount),
          type: t.type,
          category: category?.name || "-",
        };
      });

    return {
      type: QUERY_TYPES.RECENT_TRANSACTIONS,
      data: { transactions: recent },
      summary: `${limit} transaksi terakhir:\n${recent
        .map(
          (t, i) =>
            `${i + 1}. ${t.date} - ${t.description} (${t.type}): ${
              t.amountFormatted
            }`
        )
        .join("\n")}`,
    };
  }

  private getMonthlyComparison(): QueryResult {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpensesCents = this.transactions
      .filter(
        (t) => t.type === "expense" && new Date(t.transactionDate) >= thisMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpensesCents = this.transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.transactionDate) >= lastMonth &&
          new Date(t.transactionDate) <= lastMonthEnd
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const differenceCents = thisMonthExpensesCents - lastMonthExpensesCents;
    const percentageChange =
      lastMonthExpensesCents > 0
        ? ((differenceCents / lastMonthExpensesCents) * 100).toFixed(1)
        : "0";

    const trend =
      differenceCents > 0
        ? "meningkat"
        : differenceCents < 0
        ? "menurun"
        : "sama";

    return {
      type: QUERY_TYPES.MONTHLY_COMPARISON,
      data: {
        thisMonth: this.centsToRupiah(thisMonthExpensesCents),
        thisMonthCents: thisMonthExpensesCents,
        lastMonth: this.centsToRupiah(lastMonthExpensesCents),
        lastMonthCents: lastMonthExpensesCents,
        difference: this.centsToRupiah(Math.abs(differenceCents)),
        differenceCents: Math.abs(differenceCents),
        percentageChange,
        trend,
      },
      summary: `Perbandingan pengeluaran:\n- Bulan ini: ${this.formatAmount(
        thisMonthExpensesCents
      )}\n- Bulan lalu: ${this.formatAmount(
        lastMonthExpensesCents
      )}\n- Perbedaan: ${this.formatAmount(
        Math.abs(differenceCents)
      )} (${trend} ${Math.abs(parseFloat(percentageChange))}%)`,
      visualizationData: [
        {
          month: "Bulan Lalu",
          amount: this.centsToRupiah(lastMonthExpensesCents),
          amountCents: lastMonthExpensesCents,
        },
        {
          month: "Bulan Ini",
          amount: this.centsToRupiah(thisMonthExpensesCents),
          amountCents: thisMonthExpensesCents,
        },
      ],
    };
  }

  private getCategoryBreakdown(): QueryResult {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const expenseByCategoryCents = this.transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.categoryId &&
          new Date(t.transactionDate) >= thisMonth
      )
      .reduce((acc, t) => {
        const category = this.categories.find((c) => c.id === t.categoryId);
        if (category) {
          if (!acc[category.name]) {
            acc[category.name] = { total: 0, count: 0 };
          }
          acc[category.name].total += t.amount;
          acc[category.name].count += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

    const sorted = Object.entries(expenseByCategoryCents)
      .map(([name, data]) => ({
        category: name,
        total: this.centsToRupiah(data.total),
        totalCents: data.total,
        count: data.count,
        average: this.centsToRupiah(data.total / data.count),
        averageCents: data.total / data.count,
      }))
      .sort((a, b) => b.totalCents - a.totalCents);

    const totalExpensesCents = sorted.reduce(
      (sum, item) => sum + item.totalCents,
      0
    );

    return {
      type: QUERY_TYPES.CATEGORY_BREAKDOWN,
      data: {
        breakdown: sorted,
        total: this.centsToRupiah(totalExpensesCents),
        totalCents: totalExpensesCents,
      },
      summary: `Rincian pengeluaran bulan ini:\n${sorted
        .map(
          (item) =>
            `- ${item.category}: ${this.formatAmount(item.totalCents)} (${
              item.count
            } transaksi)`
        )
        .join("\n")}\n\nTotal: ${this.formatAmount(totalExpensesCents)}`,
      visualizationData: sorted,
    };
  }

  private getSpendingTrend(): QueryResult {
    const last6Months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1
      );

      const monthExpensesCents = this.transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            new Date(t.transactionDate) >= monthDate &&
            new Date(t.transactionDate) < nextMonthDate
        )
        .reduce((sum, t) => sum + t.amount, 0);

      last6Months.push({
        month: monthDate.toLocaleString("id-ID", {
          month: "short",
          year: "numeric",
        }),
        amount: this.centsToRupiah(monthExpensesCents),
        amountCents: monthExpensesCents,
      });
    }

    const averageCents =
      last6Months.reduce((sum, m) => sum + m.amountCents, 0) / 6;
    const currentMonthCents = last6Months[5].amount;
    const trend =
      currentMonthCents > averageCents
        ? "di atas"
        : currentMonthCents < averageCents
        ? "di bawah"
        : "sesuai";

    return {
      type: QUERY_TYPES.SPENDING_TREND,
      data: {
        months: last6Months,
        average: this.centsToRupiah(averageCents),
        averageCents,
        currentMonth: this.centsToRupiah(currentMonthCents),
        currentMonthCents,
        trend,
      },
      summary: `Tren pengeluaran 6 bulan terakhir:\n${last6Months
        .map((m) => `- ${m.month}: ${this.formatAmount(m.amountCents)}`)
        .join("\n")}\n\nRata-rata: ${this.formatAmount(
        averageCents
      )}\nBulan ini ${trend} rata-rata.`,
      visualizationData: last6Months,
    };
  }
}
