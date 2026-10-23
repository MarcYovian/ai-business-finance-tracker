import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/currency';
import { generateInsights } from '@/lib/insights';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Lightbulb, BarChart2, PieChart as PieChartIcon, AlertCircle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { FEATURES } from '@/config/features';

const DashboardLoading = () => (
  <Layout>
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  </Layout>
);

const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex flex-col items-center justify-center text-center h-full py-12">
    <Icon className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(user?.id || '');
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(user?.id || '');

  if (transactionsLoading || categoriesLoading) {
    return <DashboardLoading />;
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const monthlyData = transactions.reduce((acc: { month: string; income: number; expenses: number }[], transaction) => {
    if (transaction.type === 'transfer') return acc;
    const date = new Date(transaction.transactionDate);
    if (isNaN(date.getTime())) return acc;
    const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    let monthData = acc.find(item => item.month === monthKey);
    if (!monthData) {
      monthData = { month: monthKey, income: 0, expenses: 0 };
      acc.push(monthData);
    }
    if (transaction.type === 'income') {
      monthData.income += transaction.amount / 100;
    } else if (transaction.type === 'expense') {
      monthData.expenses += transaction.amount / 100;
    }
    return acc;
  }, []).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Group expense transactions by parent category for the pie chart
  const expenseByCategory = (() => {
    const parentCategories = categories.filter(cat => !cat.parentId);
    const subCategories = categories.filter(cat => cat.parentId);
    
    return parentCategories
      .map(parent => {
        // Get all expense transactions for this parent category and its sub-categories
        const parentTransactions = transactions.filter(t => 
          t.type === 'expense' && t.categoryId === parent.id
        );
        
        // Get all sub-categories for this parent
        const parentSubCategories = subCategories.filter(sub => sub.parentId === parent.id);
        // Get all expense transactions for this parent's sub-categories
        const subCategoryTransactions = transactions.filter(t => 
          t.type === 'expense' && parentSubCategories.some(sub => sub.id === t.categoryId)
        );
        
        // Calculate total value for this parent (including its sub-categories)
        const parentValue = parentTransactions.reduce((sum, t) => sum + t.amount, 0) / 100;
        const subValue = subCategoryTransactions.reduce((sum, t) => sum + t.amount, 0) / 100;
        
        return {
          name: parent.name,
          value: parentValue + subValue
        };
      })
      .filter(item => item.value > 0); // Only include categories with transactions
  })();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const insights = generateInsights(transactions, categories);

  const recentTransactions = transactions
    .filter(t => !isNaN(new Date(t.transactionDate).getTime()))
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">from all sources</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">across all categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Income minus expenses</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly financial activity (transfers excluded)</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `${value / 1000}k`} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart2} title="Not Enough Data" description="Monthly income and expense data will appear here once you log more transactions." />
            )}
          </CardContent>
        </Card>

        {FEATURES.ENABLE_INSIGHTS && insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                {FEATURES.ENABLE_AI ? "AI Insights" : "Financial Insights"}
              </CardTitle>
              <CardDescription>
                {FEATURES.ENABLE_AI
                  ? "Intelligent analysis of your financial data"
                  : "Statistical analysis of your financial data"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-opacity-10 ${insight.type === 'expense' ? 'bg-destructive text-destructive' : 'bg-success text-success'}`}>
                    {insight.type === 'expense' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="font-semibold">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name">
                      {expenseByCategory.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={PieChartIcon} title="No Expense Data" description="Your expense breakdown by category will show up here." />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial movements</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map(t => (
                    <div key={t.id} className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.type === 'income' ? 'bg-success/10 text-success' : t.type === 'transfer' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{t.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(t.transactionDate)}</p>
                      </div>
                      <p className={`font-semibold ${t.type === 'income' ? 'text-success' : t.type === 'transfer' ? 'text-primary' : 'text-destructive'}`}>
                        {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={AlertCircle} title="No Transactions Yet" description="Your recent transactions will be listed here once you add them." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}