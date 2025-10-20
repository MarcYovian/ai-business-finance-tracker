# 🔧 Technical: Query Engine

## 1. Overview

The `QueryEngine` is a powerful utility class located at `src/utils/queryEngine.ts`. Its primary responsibility is to take a specific query type (as determined by the AI's intent classification) and execute it against the user's local data (transactions, categories, etc.). It acts as the analytical brain of the application, performing calculations and data aggregation before the results are sent back to the AI for natural language formatting.

---

## 2. Architecture

- **Class-based Structure**: The `QueryEngine` is a class that is instantiated with the user's current data (transactions, categories, fund sources, and budget details).
- **Separation of Concerns**: By encapsulating all data-querying logic, the `QueryEngine` separates the data analysis from the AI interaction and UI layers, making the code cleaner and easier to maintain.
- **Structured Output**: Every query method in the engine returns a `QueryResult` object, which includes the `type` of query, the raw `data`, a pre-formatted `summary`, and optional `visualizationData` for charts.

---

## 3. Core Query Methods

The `QueryEngine` has a public method `executeQuery` that acts as a router, calling the appropriate private method based on the `queryType`.

### a. Transaction and Spending Queries

- `getTotalExpensesThisMonth()`: Calculates the sum of all `expense` transactions for the current month.
- `getTotalIncomeThisMonth()`: Calculates the sum of all `income` transactions for the current month.
- `getTopExpenseCategory()`: Identifies the expense category with the highest total spending.
- `getBalanceByFund()`: Returns the current balance for each fund source.
- `getRecentTransactions()`: Retrieves the last 5 transactions.
- `getMonthlyComparison()`: Compares the total expenses of the current month with the previous month.
- `getCategoryBreakdown()`: Provides a detailed breakdown of spending for each category in the current month.
- `getSpendingTrend()`: Calculates the total expenses for each of the last 6 months to show a spending trend.

### b. Budget-Related Queries

These methods are only executed if budget data is available.

- `getBudgetOverview()`: Provides a comprehensive summary of the current month's budget, including total budgeted, total spent, and the status of each category.
- `getOverBudgetCategories()`: Lists all categories where spending has exceeded the budgeted amount.
- `getBudgetRecommendations()`: Analyzes the spending patterns of the last 3 months to suggest a new budget for the upcoming month, including a 10% buffer.
- `getBudgetVsActual()`: Provides a detailed side-by-side comparison of budgeted amounts versus actual spending for each category.

---

## 4. Data Flow

1.  The `useAIAssistant` hook receives a `queryType` from the `aiAssistantService`.
2.  It instantiates the `QueryEngine` with all the necessary data from the application's state (transactions, categories, etc.).
3.  It calls `queryEngine.executeQuery(queryType)`.
4.  The `QueryEngine` runs the corresponding private method (e.g., `getTopExpenseCategory()`).
5.  The method performs the necessary calculations and returns a structured `QueryResult` object.
6.  This `QueryResult` is then passed to the AI service to be formatted into a natural language response.
