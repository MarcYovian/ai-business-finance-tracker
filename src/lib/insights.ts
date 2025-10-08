import { Transaction, Category } from '@/types/finance';

interface FinancialInsight {
  title: string;
  description: string;
  type: 'expense' | 'income' | 'trend' | 'comparison';
}

export const generateInsights = (
  transactions: Transaction[],
  categories: Category[]
): FinancialInsight[] => {
  const insights: FinancialInsight[] = [];
  
  if (transactions.length === 0) {
    return [
      {
        title: "Get Started",
        description: "No transactions yet. Start by adding your first transaction!",
        type: "trend"
      }
    ];
  }

  // 1. Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // 2. Find largest expense category
  if (totalExpenses > 0) {
    const expenseByCategory: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense' && t.categoryId)
      .forEach(t => {
        const category = categories.find(c => c.id === t.categoryId);
        if (category) {
          expenseByCategory[category.name] = (expenseByCategory[category.name] || 0) + t.amount;
        }
      });
    
    if (Object.keys(expenseByCategory).length > 0) {
      const largestExpenseCategory = Object.entries(expenseByCategory)
        .reduce((prev, current) => (prev[1] > current[1] ? prev : current));
      
      insights.push({
        title: "Biggest Expense Category",
        description: `Your largest expense category is ${largestExpenseCategory[0]} with ${formatCurrency(largestExpenseCategory[1])}. Consider reviewing your spending in this area.`,
        type: "expense"
      });
    }
  }
  
  // 3. Income vs expenses comparison
  if (totalIncome > 0 && totalExpenses > 0) {
    if (totalExpenses > totalIncome) {
      insights.push({
        title: "Spending Exceeds Income",
        description: `Your expenses (${formatCurrency(totalExpenses)}) exceed your income (${formatCurrency(totalIncome)}) by ${formatCurrency(totalExpenses - totalIncome)}. Consider finding ways to reduce expenses or increase income.`,
        type: "expense"
      });
    } else {
      insights.push({
        title: "Positive Financial Health",
        description: `Great job! Your income (${formatCurrency(totalIncome)}) exceeds your expenses (${formatCurrency(totalExpenses)}) by ${formatCurrency(totalIncome - totalExpenses)}.`,
        type: "income"
      });
    }
  }
  
  // 4. Recent transaction insights
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 10);
  
  if (recentTransactions.length > 0) {
    // Find the most expensive recent transaction
    const mostExpensive = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((max, t) => (t.amount > max.amount ? t : max), recentTransactions.find(t => t.type === 'expense') || recentTransactions[0]);
    
    if (mostExpensive && mostExpensive.type === 'expense') {
      const category = categories.find(c => c.id === mostExpensive.categoryId);
      insights.push({
        title: "Largest Recent Expense",
        description: `Your largest recent expense was ${formatCurrency(mostExpensive.amount)} for "${mostExpensive.description}"${category ? ` in the ${category.name} category` : ''}.`,
        type: "expense"
      });
    }
  }
  
  // 5. Monthly comparison if we have enough data
  if (transactions.length >= 2) {
    // Group by month
    const monthlyData: Record<string, { income: number, expenses: number }> = {};
    
    transactions.forEach(t => {
      const month = new Date(t.transactionDate).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += t.amount;
      }
    });
    
    const months = Object.keys(monthlyData).sort();
    
    if (months.length >= 2) {
      const currentMonth = monthlyData[months[months.length - 1]];
      const previousMonth = monthlyData[months[months.length - 2]];
      
      // Compare expenses
      if (previousMonth.expenses > 0) {
        const expenseChange = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
        if (Math.abs(expenseChange) > 10) { // Only show if change is more than 10%
          const direction = expenseChange > 0 ? 'increased' : 'decreased';
          insights.push({
            title: `Expenses ${direction}`,
            description: `Your expenses ${direction} by ${Math.abs(expenseChange).toFixed(1)}% compared to last month (${formatCurrency(previousMonth.expenses)} → ${formatCurrency(currentMonth.expenses)}).`,
            type: "trend"
          });
        }
      }
      
      // Compare income
      if (previousMonth.income > 0) {
        const incomeChange = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100;
        if (Math.abs(incomeChange) > 10) { // Only show if change is more than 10%
          const direction = incomeChange > 0 ? 'increased' : 'decreased';
          insights.push({
            title: `Income ${direction}`,
            description: `Your income ${direction} by ${Math.abs(incomeChange).toFixed(1)}% compared to last month (${formatCurrency(previousMonth.income)} → ${formatCurrency(currentMonth.income)}).`,
            type: "trend"
          });
        }
      }
    }
  }
  
  // Limit to 5 insights
  return insights.slice(0, 5);
};

const formatCurrency = (amountInCents: number): string => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};