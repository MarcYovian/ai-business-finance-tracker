# ✨ Feature: Monthly Budget

## 1. Overview

The Budget page provides a comprehensive tool for managing your monthly finances. It allows you to set spending limits for different expense categories and track your progress throughout the month. This feature is essential for maintaining financial discipline and achieving your financial goals.

The page is located at `src/pages/Budget.tsx`.

---

## 2. Key Features

### a. Monthly Navigation

You can easily navigate between different months to view or edit historical, current, or future budgets.

- **Controls**: Use the left and right arrow buttons to move to the previous or next month.
- **Display**: The currently selected month and year are clearly displayed.

### b. Budget Summary

A top-level card provides an at-a-glance summary of your overall budget for the selected month.

- **Total Spent**: The sum of all expenses for the month.
- **Total Budgeted**: The sum of all budget allocations for the month.
- **Remaining**: The difference between the total budgeted and total spent amount.
- **Progress Bar**: A visual indicator of your overall spending against the total budget. The color of the bar changes based on your spending progress (blue for normal, yellow for nearing the limit, and red for over budget).

### c. Category Breakdown

Each expense category with a budget is listed individually, allowing for granular tracking.

- **Category Name**: The name of the expense category.
- **Remaining Budget**: The amount of money left to spend in that category.
- **Progress Bar**: A visual indicator for each category's spending.
- **Spent vs. Budgeted**: A clear text display of the amount spent versus the amount budgeted for that category (e.g., "Rp 50.000 / Rp 100.000").

### d. Editing and Creating Budgets

- **Edit Budget**: Click the "Edit Budget" button to open the `BudgetDialog`.
- **Budget Dialog**: In this dialog, you can set or modify the budget amount for each expense category for the selected month.
- **Saving**: Once you save, the budget for the month is created or updated, and the view is refreshed.

### e. Empty State

If no budget has been set for a selected month, a helpful message is displayed, prompting you to create one.

---

## 3. Real-time Budget Impact in Transaction Dialog

The budget feature is tightly integrated with the `TransactionDialog` to provide real-time feedback when adding or editing an expense.

- **Budget Impact Section**: When you select an expense category that has a budget, a "Budget Impact" section appears in the dialog.
- **Live Updates**: As you type the transaction amount, the progress bar and summary text update instantly to show you how this new expense will affect your category budget.
- **Smart Warnings**: The system provides color-coded warnings:
    - **Green (Within Budget)**: The expense is well within the category's budget.
    - **Yellow (Near Limit)**: The expense will bring the category's spending close to its limit (e.g., over 80%).
    - **Red (Over Budget)**: The expense will exceed the category's budget. The dialog will show by how much you will be over budget.
