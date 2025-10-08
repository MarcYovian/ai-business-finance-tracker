import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, Category } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/currency';
import { generateInsights } from '@/lib/insights';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Lightbulb } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(user?.id || '');
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(user?.id || '');

  if (transactionsLoading || categoriesLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </Layout>
    );
  }

  // Calculate total income and expenses, excluding transfers
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Prepare monthly data for bar chart (excluding transfers)
  const monthlyData = transactions.reduce((acc: { month: string; income: number; expenses: number; transfers: number }[], transaction) => {
    if (transaction.type === 'transfer') return acc; // Exclude transfers from income/expense charts
    
    const date = new Date(transaction.transactionDate);
    // Skip transactions with invalid dates
    if (isNaN(date.getTime())) {
      return acc;
    }
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Find existing month or create new entry
    let monthData = acc.find(item => item.month === monthKey);
    if (!monthData) {
      monthData = { month: monthKey, income: 0, expenses: 0, transfers: 0 };
      acc.push(monthData);
    }
    
    if (transaction.type === 'income') {
      monthData.income += transaction.amount / 100; // Convert from cents to dollars for display
    } else if (transaction.type === 'expense') {
      monthData.expenses += transaction.amount / 100; // Convert from cents to dollars for display
    } else if (transaction.type === 'transfer') {
      monthData.transfers += transaction.amount / 100; // Track transfers separately if needed
    }
    
    return acc;
  }, []);

  // Sort monthly data by date (oldest to newest)
  monthlyData.sort((a, b) => a.month.localeCompare(b.month));

  // Prepare data for expense breakdown pie chart
  const expenseByCategory = categories.map(cat => {
    const total = transactions
      .filter(t => t.type === 'expense' && t.categoryId === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat.name, value: total / 100 };
  }).filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Generate insights
  const insights = generateInsights(transactions, categories);

  const netProfit = totalIncome - totalExpenses;

  // Recent transactions (excluding transfers from display but including them in data)
  const validTransactions = transactions.filter(t => !isNaN(new Date(t.transactionDate).getTime()));
  const recentTransactions = [...validTransactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(netProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Income vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses Over Time</CardTitle>
            <CardDescription>Monthly breakdown of your financial activity (excluding transfers)</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value}`} />
                  <Tooltip formatter={(value) => [`${value}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No monthly data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Insights
            </CardTitle>
            <CardDescription>Intelligent analysis of your financial data</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg border p-4 ${
                      insight.type === 'expense' 
                        ? 'border-destructive/30 bg-destructive/5' 
                        : insight.type === 'income' 
                          ? 'border-success/30 bg-success/5' 
                          : 'border-amber-300/30 bg-amber-500/5'
                    }`}
                  >
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Analyzing your financial data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No expense data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(transaction.transactionDate)}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${
                        transaction.type === 'income' 
                          ? 'text-success' 
                          : transaction.type === 'transfer'
                            ? 'text-primary'
                            : 'text-destructive'
                      }`}>
                        {transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '→' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}