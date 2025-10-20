import {
  BUDGET_STATUS,
  BUDGET_THRESHOLDS,
  QUERY_TYPES,
} from "@/constants/constants";
import { formatCurrency } from "@/lib/currency";
import { QueryResult } from "@/types/ai";
import {
  Budget,
  BudgetDetail,
  Category,
  FundSource,
  Transaction,
} from "@/types/finance";

export class QueryEngine {
  private transactions: Transaction[];
  private categories: Category[];
  private fundSources: FundSource[];
  private budgetDetails?: BudgetDetail[];
  private currentBudget?: Budget | null;

  constructor(
    transactions: Transaction[],
    categories: Category[],
    fundSources: FundSource[],
    budgetDetails?: BudgetDetail[],
    currentBudget?: Budget | null
  ) {
    this.transactions = transactions;
    this.categories = categories;
    this.fundSources = fundSources;
    this.budgetDetails = budgetDetails;
    this.currentBudget = currentBudget;
  }

  // Helper to convert cents to rupiah for display
  private centsToRupiah(cents: number): number {
    return cents / 100;
  }

  // Helper to format currency
  private formatAmount(cents: number): string {
    return formatCurrency(cents);
  }

  // Helper to determine budget status
  private getBudgetStatus(utilization: number): string {
    if (utilization >= 1.0) return BUDGET_STATUS.OVER;
    if (utilization >= BUDGET_THRESHOLDS.DANGER) return BUDGET_STATUS.DANGER;
    if (utilization >= BUDGET_THRESHOLDS.WARNING) return BUDGET_STATUS.WARNING;
    return BUDGET_STATUS.SAFE;
  }

  // Helper to get status emoji
  private getStatusEmoji(status: string): string {
    switch (status) {
      case BUDGET_STATUS.SAFE:
        return "✅";
      case BUDGET_STATUS.WARNING:
        return "⚠️";
      case BUDGET_STATUS.DANGER:
        return "🟠";
      case BUDGET_STATUS.OVER:
        return "🔴";
      default:
        return "ℹ️";
    }
  }

  // Detect query type from user input
  detectQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Budget-related queries
    if (lowerQuery.includes("budget") || lowerQuery.includes("anggaran")) {
      if (
        lowerQuery.includes("overview") ||
        lowerQuery.includes("status") ||
        lowerQuery.includes("ringkasan")
      ) {
        return QUERY_TYPES.BUDGET_OVERVIEW;
      }
      if (
        lowerQuery.includes("over") ||
        lowerQuery.includes("exceed") ||
        lowerQuery.includes("melebihi")
      ) {
        return QUERY_TYPES.OVER_BUDGET_CATEGORIES;
      }
      if (
        lowerQuery.includes("recommendation") ||
        lowerQuery.includes("suggest") ||
        lowerQuery.includes("saran")
      ) {
        return QUERY_TYPES.BUDGET_RECOMMENDATIONS;
      }
      if (
        lowerQuery.includes("vs") ||
        lowerQuery.includes("actual") ||
        lowerQuery.includes("compare")
      ) {
        return QUERY_TYPES.BUDGET_VS_ACTUAL;
      }
      return QUERY_TYPES.BUDGET_OVERVIEW;
    }

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
      case QUERY_TYPES.BUDGET_OVERVIEW:
        return this.getBudgetOverview();
      case QUERY_TYPES.OVER_BUDGET_CATEGORIES:
        return this.getOverBudgetCategories();
      case QUERY_TYPES.BUDGET_RECOMMENDATIONS:
        return this.getBudgetRecommendations();
      case QUERY_TYPES.BUDGET_VS_ACTUAL:
        return this.getBudgetVsActual();
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

  private getBudgetOverview(): QueryResult {
    if (!this.budgetDetails || !this.budgetDetails.length) {
      return {
        type: QUERY_TYPES.BUDGET_OVERVIEW,
        data: { noBudget: true },
        summary:
          "📊 Belum ada budget yang ditetapkan untuk bulan ini.\n\n💡 Tip: Anda bisa membuat budget berdasarkan pola pengeluaran historis Anda!",
      };
    }

    const summary = this.budgetDetails.map((detail) => {
      const spent = detail.spent / 100;
      const budget = detail.amount / 100;
      const remaining = budget - spent;
      const utilization = spent / budget;
      const status = this.getBudgetStatus(utilization);
      const emoji = this.getStatusEmoji(status);

      return {
        category: detail.category_name,
        budget: budget,
        spent: spent,
        remaining: remaining,
        utilization: (utilization * 100).toFixed(1),
        status: status,
        emoji: emoji,
      };
    });

    const totalBudget = summary.reduce((sum, s) => sum + s.budget, 0);
    const totalSpent = summary.reduce((sum, s) => sum + s.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallUtilization = (totalSpent / totalBudget) * 100;
    const overallStatus = this.getBudgetStatus(totalSpent / totalBudget);

    // Count statuses
    const statusCounts = {
      safe: summary.filter((s) => s.status === BUDGET_STATUS.SAFE).length,
      warning: summary.filter((s) => s.status === BUDGET_STATUS.WARNING).length,
      danger: summary.filter((s) => s.status === BUDGET_STATUS.DANGER).length,
      over: summary.filter((s) => s.status === BUDGET_STATUS.OVER).length,
    };

    let statusSummary = "";
    if (statusCounts.over > 0) {
      statusSummary = `\n\n🔴 Peringatan: ${statusCounts.over} kategori melebihi budget!`;
    } else if (statusCounts.danger > 0) {
      statusSummary = `\n\n🟠 Perhatian: ${statusCounts.danger} kategori hampir habis (>95%)`;
    } else if (statusCounts.warning > 0) {
      statusSummary = `\n\n⚠️ ${statusCounts.warning} kategori perlu diperhatikan (>80%)`;
    } else {
      statusSummary = "\n\n✅ Semua kategori dalam kondisi aman!";
    }

    return {
      type: QUERY_TYPES.BUDGET_OVERVIEW,
      data: {
        categories: summary,
        totalBudget,
        totalSpent,
        totalRemaining,
        overallUtilization: overallUtilization.toFixed(1),
        overallStatus,
        statusCounts,
      },
      summary: `📊 **Status Budget Bulan Ini**\n\n${summary
        .map(
          (s) =>
            `${s.emoji} **${s.category}**\n   ${this.formatAmount(
              s.spent * 100
            )} / ${this.formatAmount(s.budget * 100)} (${
              s.utilization
            }%)\n   Sisa: ${this.formatAmount(s.remaining * 100)}`
        )
        .join("\n\n")}\n\n━━━━━━━━━━━━━━━━━━━━\n**TOTAL**\n${this.formatAmount(
        totalSpent * 100
      )} / ${this.formatAmount(
        totalBudget * 100
      )} (${overallUtilization.toFixed(1)}%)\nSisa: ${this.formatAmount(
        totalRemaining * 100
      )}${statusSummary}`,
      visualizationData: summary,
    };
  }

  private getOverBudgetCategories(): QueryResult {
    if (!this.budgetDetails || !this.budgetDetails.length) {
      return {
        type: QUERY_TYPES.OVER_BUDGET_CATEGORIES,
        data: { noBudget: true },
        summary: "Belum ada budget yang ditetapkan untuk bulan ini.",
      };
    }

    const overBudget = this.budgetDetails
      .filter((detail) => detail.spent > detail.amount)
      .map((detail) => ({
        category: detail.category_name,
        budget: detail.amount / 100,
        spent: detail.spent / 100,
        excess: (detail.spent - detail.amount) / 100,
        percentage: ((detail.spent / detail.amount) * 100).toFixed(1),
      }))
      .sort((a, b) => b.excess - a.excess);

    if (overBudget.length === 0) {
      return {
        type: QUERY_TYPES.OVER_BUDGET_CATEGORIES,
        data: { categories: [] },
        summary:
          "🎉 **Selamat!**\n\nTidak ada kategori yang melebihi budget. Anda berhasil mengelola keuangan dengan baik bulan ini!\n\n💡 Tip: Pertahankan kebiasaan baik ini dan terus pantau pengeluaran Anda secara berkala.",
      };
    }

    const totalExcess = overBudget.reduce((sum, c) => sum + c.excess, 0);

    return {
      type: QUERY_TYPES.OVER_BUDGET_CATEGORIES,
      data: { categories: overBudget, totalExcess },
      summary: `🔴 **Kategori Over Budget**\n\n${
        overBudget.length
      } kategori melebihi budget:\n\n${overBudget
        .map(
          (c, i) =>
            `${i + 1}. **${c.category}**\n   Budget: ${this.formatAmount(
              c.budget * 100
            )}\n   Pengeluaran: ${this.formatAmount(c.spent * 100)} (${
              c.percentage
            }%)\n   Kelebihan: ${this.formatAmount(c.excess * 100)}`
        )
        .join(
          "\n\n"
        )}\n\n━━━━━━━━━━━━━━━━━━━━\n**Total Kelebihan:** ${this.formatAmount(
        totalExcess * 100
      )}\n\n💡 **Saran:** Kurangi pengeluaran di kategori ini bulan depan atau tingkatkan budget sesuai kebutuhan riil Anda.`,
      visualizationData: overBudget,
    };
  }

  private getBudgetRecommendations(): QueryResult {
    if (!this.transactions.length) {
      return {
        type: QUERY_TYPES.BUDGET_RECOMMENDATIONS,
        data: { noData: true },
        summary:
          "Belum ada data transaksi untuk memberikan rekomendasi budget.\n\nMulai catat transaksi Anda terlebih dahulu!",
      };
    }

    // Analyze last 3 months of expenses
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const expensesByCategory = this.transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.categoryId &&
          new Date(t.transactionDate) >= threeMonthsAgo
      )
      .reduce((acc, t) => {
        const category = this.categories.find((c) => c.id === t.categoryId);
        if (category) {
          if (!acc[category.name]) {
            acc[category.name] = { total: 0, count: 0, months: new Set() };
          }
          acc[category.name].total += t.amount;
          acc[category.name].count += 1;
          const month = new Date(t.transactionDate).getMonth();
          acc[category.name].months.add(month);
        }
        return acc;
      }, {} as Record<string, { total: number; count: number; months: Set<number> }>);

    const recommendations = Object.entries(expensesByCategory)
      .map(([name, data]) => {
        const monthCount = data.months.size || 1;
        const avgMonthly = data.total / monthCount;
        // Add 10% buffer for safety
        const recommended = Math.ceil((avgMonthly * 1.1) / 100) * 100;

        return {
          category: name,
          average: this.centsToRupiah(avgMonthly),
          recommended: this.centsToRupiah(recommended),
          recommendedCents: recommended,
          transactionCount: data.count,
          monthsAnalyzed: monthCount,
        };
      })
      .sort((a, b) => b.recommendedCents - a.recommendedCents);

    const totalRecommended = recommendations.reduce(
      (sum, r) => sum + r.recommendedCents,
      0
    );

    return {
      type: QUERY_TYPES.BUDGET_RECOMMENDATIONS,
      data: {
        recommendations,
        totalRecommended: this.centsToRupiah(totalRecommended),
        totalRecommendedCents: totalRecommended,
        analysisMonths: 3,
      },
      summary: `💡 **Rekomendasi Budget (berdasarkan 3 bulan terakhir)**\n\n${recommendations
        .map(
          (r, i) =>
            `${i + 1}. **${r.category}**\n   Rata-rata: ${this.formatAmount(
              r.average * 100
            )}/bulan\n   Direkomendasikan: ${this.formatAmount(
              r.recommendedCents
            )}\n   (${r.transactionCount} transaksi dalam ${
              r.monthsAnalyzed
            } bulan)`
        )
        .join(
          "\n\n"
        )}\n\n━━━━━━━━━━━━━━━━━━━━\n**Total Budget Direkomendasikan:** ${this.formatAmount(
        totalRecommended
      )}\n\n📝 Budget ini sudah termasuk buffer 10% untuk mengantisipasi pengeluaran tak terduga.`,
      visualizationData: recommendations,
    };
  }

  private getBudgetVsActual(): QueryResult {
    if (!this.budgetDetails || !this.budgetDetails.length) {
      return {
        type: QUERY_TYPES.BUDGET_VS_ACTUAL,
        data: { noBudget: true },
        summary: "Belum ada budget yang ditetapkan untuk bulan ini.",
      };
    }

    const comparison = this.budgetDetails.map((detail) => {
      const budget = detail.amount / 100;
      const actual = detail.spent / 100;
      const difference = actual - budget;
      const variance = budget > 0 ? (difference / budget) * 100 : 0;
      const status =
        actual > budget ? "over" : actual > budget * 0.8 ? "warning" : "safe";

      return {
        category: detail.category_name,
        budget,
        actual,
        difference: Math.abs(difference),
        variance: variance.toFixed(1),
        status,
        emoji: this.getStatusEmoji(status),
      };
    });

    const totalBudget = comparison.reduce((sum, c) => sum + c.budget, 0);
    const totalActual = comparison.reduce((sum, c) => sum + c.actual, 0);
    const totalDifference = totalActual - totalBudget;
    const totalVariance =
      totalBudget > 0
        ? ((totalDifference / totalBudget) * 100).toFixed(1)
        : "0";

    const overCount = comparison.filter((c) => c.status === "over").length;
    const underCount = comparison.filter((c) => c.status === "safe").length;

    return {
      type: QUERY_TYPES.BUDGET_VS_ACTUAL,
      data: {
        comparison,
        totalBudget,
        totalActual,
        totalDifference: Math.abs(totalDifference),
        totalVariance,
        overCount,
        underCount,
      },
      summary: `📊 **Budget vs Pengeluaran Aktual**\n\n${comparison
        .map(
          (c) =>
            `${c.emoji} **${c.category}**\n   Budget: ${this.formatAmount(
              c.budget * 100
            )}\n   Aktual: ${this.formatAmount(
              c.actual * 100
            )}\n   Selisih: ${this.formatAmount(c.difference * 100)} (${
              c.variance > 0 ? "+" : ""
            }${c.variance}%)`
        )
        .join(
          "\n\n"
        )}\n\n━━━━━━━━━━━━━━━━━━━━\n**TOTAL**\nBudget: ${this.formatAmount(
        totalBudget * 100
      )}\nAktual: ${this.formatAmount(
        totalActual * 100
      )}\nSelisih: ${this.formatAmount(Math.abs(totalDifference) * 100)} (${
        totalVariance > 0 ? "+" : ""
      }${totalVariance}%)\n\n📈 **Ringkasan:**\n- ${underCount} kategori di bawah budget\n- ${overCount} kategori melebihi budget`,
      visualizationData: comparison,
    };
  }
}
