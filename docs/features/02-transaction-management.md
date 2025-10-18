# ✨ Feature: Transaction Management

## 1. Overview

Effective transaction management is at the heart of the AI Business Finance Tracker. The application provides a robust and user-friendly interface for creating, reading, updating, and deleting (CRUD) transactions. This documentation details the functionalities available on the **Transactions** page (`src/pages/Transactions.tsx`) and the **Transaction Dialog** (`src/components/TransactionDialog.tsx`).

---

## 2. Adding and Editing Transactions

Both adding a new transaction and editing an existing one are handled through the `TransactionDialog` component to provide a consistent user experience.

### a. The Transaction Dialog

-   **Opening the Dialog**: 
    -   To **add** a new transaction, click the "Add Transaction" button on the Transactions page.
    -   To **edit** an existing transaction, click the pencil icon next to a transaction in the list.

-   **Form Fields**:
    -   **Description**: A brief description of the transaction (e.g., "Office Supplies").
    -   **Amount**: The monetary value of the transaction.
    -   **Type**: The type of transaction, which can be `Income`, `Expense`, or `Transfer`.
    -   **Date**: The date the transaction occurred.
    -   **Category**: (For Income/Expense) The category the transaction belongs to. Sub-categories are displayed hierarchically.
    -   **Source/Destination Fund**: Depending on the transaction type, you will select the source or destination of the funds.
    -   **Admin Fee**: (For Transfers) An optional field to record any administrative fees associated with the transfer.

### b. Form Validation

To ensure data integrity, the transaction form is equipped with comprehensive validation powered by **Zod** and **React Hook Form**.

-   **Schema**: A Zod schema (`transactionSchema`) defines the validation rules for each field.
-   **Conditional Validation**: The schema uses `.superRefine` to apply conditional logic. For example:
    -   A `sourceFundId` is required for `Expense` and `Transfer` types.
    -   A `destinationFundId` is required for `Income` and `Transfer` types.
    -   For transfers, the source and destination funds cannot be the same.
-   **User Feedback**: Validation errors are displayed in real-time under each form field, guiding the user to correct their input.

---

## 3. Deleting Transactions

To prevent accidental data loss, a confirmation step is required when deleting a transaction.

### a. The Delete Confirmation Flow

1.  **Initiate Deletion**: Click the trash can icon next to the transaction you wish to delete.
2.  **Confirmation Dialog**: A confirmation dialog (`DeleteConfirmationDialog`) appears, asking you to confirm the action.
3.  **Confirm or Cancel**:
    -   Clicking **"Delete"** permanently removes the transaction from the database.
    -   Clicking **"Cancel"** closes the dialog without making any changes.

### b. Implementation

-   The `Transactions.tsx` page manages the state of the confirmation dialog.
-   The `useDeleteTransaction` hook (from TanStack Query) is used to perform the deletion and automatically update the UI upon success.

---

## 4. Filtering and Sorting

The Transactions page provides tools to easily find and organize your transactions:

-   **Filter by Type**: You can filter the transaction list to show `All`, `Income`, `Expense`, or `Transfer` types.
-   **Sort By**: The list can be sorted by:
    -   Date (Newest or Oldest)
    -   Amount (High-Low or Low-High)
