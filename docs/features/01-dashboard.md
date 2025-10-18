# ✨ Feature: Dashboard

## 1. Overview

The Dashboard is the central hub of the AI Business Finance Tracker, providing a comprehensive, at-a-glance overview of your financial health. It is designed to be the first page you see, offering key insights and quick access to your financial data.

This page is located at `src/pages/Dashboard.tsx`.

---

## 2. Key Features

### a. Financial Summary Cards

At the top of the dashboard, you will find three summary cards that provide a quick snapshot of your core financial metrics:

-   **Total Income**: Displays the total amount of income recorded across all sources. The card is highlighted in green and features a `TrendingUp` icon.
-   **Total Expenses**: Shows the total amount of expenses across all categories. This card is highlighted in red with a `TrendingDown` icon.
-   **Net Profit/Loss**: Calculates the difference between total income and total expenses. The value is displayed in green for a net profit and red for a net loss.

### b. Income vs. Expenses Chart

This is a bar chart that visualizes your monthly financial activity.

-   **Data**: It plots total income and total expenses for each month.
-   **Exclusions**: Transfer transactions are excluded from this chart to provide a clear view of profit and loss.
-   **Interactivity**: You can hover over the bars to see the exact income and expense figures for each month.

### c. AI Insights

Leveraging the power of AI, this section provides intelligent and actionable insights based on your transaction data.

-   **Analysis**: The `generateInsights` function (from `src/lib/insights.ts`) analyzes your spending and income patterns.
-   **Content**: It can highlight unusual spending, identify top expense categories, or point out significant changes in your income.
-   **Presentation**: Each insight is presented in a card with an icon and a clear description, making it easy to understand.

### d. Expense Breakdown

A pie chart that provides a visual breakdown of your expenses by category.

-   **Grouping**: Expenses are grouped by their parent category, providing a high-level overview of where your money is going.
-   **Visualization**: Each slice of the pie represents a parent category, and its size corresponds to the total expenses in that category (including all its sub-categories).
-   **Interactivity**: Hovering over a slice reveals the category name and the total amount spent.

### e. Recent Transactions

This section provides a list of your most recent financial activities, allowing you to quickly see where your money has been moving.

-   **Sorting**: Transactions are sorted by date in descending order.
-   **Details**: Each entry displays the transaction description, date, and amount, with a color indicator for income, expense, or transfer.

---

## 3. Loading and Empty States

-   **Loading State**: While data is being fetched, the dashboard displays a skeleton layout to indicate that content is loading.
-   **Empty States**: If there is not enough data for a particular chart or section (e.g., no transactions yet), a user-friendly message is displayed with an icon, guiding the user on what to do next.
