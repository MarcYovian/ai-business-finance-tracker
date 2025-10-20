# 🔧 Technical: Database and RPC Functions

## 1. Overview

This document details the database schema used in the AI Business Finance Tracker and explains the role of the Supabase Remote Procedure Calls (RPCs) in maintaining data integrity and handling complex operations atomically.

---

## 2. Database Schema

The database is hosted on Supabase (PostgreSQL). The key tables are `transactions`, `categories`, `fund_sources`, `budgets`, and `budget_items`.

### a. `transactions` Table

This is the central table that stores all financial movements.

| Column                | Type          | Description                                                                                                |
| --------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `id`                  | `uuid`        | Primary key for the transaction.                                                                           |
| `description`         | `text`        | A user-provided description of the transaction. Nullable.                                                  |
| `amount`              | `bigint`      | The monetary value, stored in cents to avoid floating-point inaccuracies.                                  |
| `type`                | `text`        | The type of transaction: `income`, `expense`, or `transfer`.                                               |
| `transaction_date`    | `timestamptz` | The date and time the transaction occurred.                                                                |
| `user_id`             | `uuid`        | Foreign key to `auth.users`. Automatically links the transaction to the logged-in user.                    |
| `category_id`         | `uuid`        | Foreign key to `categories`. `ON DELETE SET NULL`.                                                         |
| `created_at`          | `timestamptz` | Timestamp of when the record was created.                                                                  |
| `source_fund_id`      | `uuid`        | Foreign key to `fund_sources`. Used for `expense` and `transfer` types.                                    |
| `destination_fund_id` | `uuid`        | Foreign key to `fund_sources`. Used for `income` and `transfer` types.                                     |
| `parent_transaction_id` | `uuid`        | Links a transaction to a parent (e.g., a fee to a transfer). `ON DELETE SET NULL`.                         |

### b. `fund_sources` Table

Stores the user's financial accounts (e.g., bank accounts, cash).

| Column       | Type          | Description                                                                      |
| ------------ | ------------- | -------------------------------------------------------------------------------- |
| `id`         | `uuid`        | Primary key for the fund source.                                                 |
| `name`       | `text`        | The name of the fund source (e.g., "BCA", "GoPay").                              |
| `balance`    | `bigint`      | The current balance of the account, stored in cents.                             |
| `user_id`    | `uuid`        | Foreign key to `auth.users`.                                                     |
| `created_at` | `timestamptz` | Timestamp of when the record was created.                                        |
| `type`       | `text`        | The type of fund source. Check constraint limits to: `bank`, `cash`, or `other`. |

### c. `categories` Table

Stores user-defined categories for income and expenses.

| Column      | Type          | Description                                                                    |
| ----------- | ------------- | ------------------------------------------------------------------------------ |
| `id`        | `uuid`        | Primary key for the category.                                                  |
| `name`      | `text`        | The name of the category (e.g., "Food", "Salary").                             |
| `user_id`   | `uuid`        | Foreign key to `auth.users`.                                                   |
| `created_at`| `timestamptz` | Timestamp of when the record was created.                                      |
| `type`      | `text`        | The type of category. Check constraint limits to: `income` or `expense`.       |
| `parent_id` | `uuid`        | Self-referencing foreign key to support hierarchical/nested categories.        |

### d. `budgets` Table

Defines a budget period for a user.

| Column       | Type          | Description                                                              |
| ------------ | ------------- | ------------------------------------------------------------------------ |
| `id`         | `uuid`        | Primary key for the budget.                                              |
| `user_id`    | `uuid`        | Foreign key to `auth.users`.                                             |
| `name`       | `text`        | The name of the budget (e.g., "October 2025 Budget").                    |
| `start_date` | `date`        | The start date of the budget period.                                     |
| `end_date`   | `date`        | The end date of the budget period.                                       |
| `created_at` | `timestamptz` | Timestamp of when the record was created.                                |

### e. `budget_items` Table

Links categories to a specific budget with an allocated amount.

| Column      | Type          | Description                                                              |
| ----------- | ------------- | ------------------------------------------------------------------------ |
| `id`        | `uuid`        | Primary key for the budget item.                                         |
| `budget_id` | `uuid`        | Foreign key to the `budgets` table.                                      |
| `category_id`| `uuid`        | Foreign key to the `categories` table.                                   |
| `amount`    | `bigint`      | The budgeted amount for the linked category, stored in cents.            |
| `created_at`| `timestamptz` | Timestamp of when the record was created.                                |

---

## 3. Remote Procedure Calls (RPCs)

To ensure that complex operations are **atomic** (i.e., they either complete fully or not at all), the application relies on custom PostgreSQL functions executed via Supabase RPC.

This approach moves complex logic to the database, reducing the number of round-trips between the client and the server and guaranteeing data consistency.

### a. `create_transaction_and_update_balance`

This function is called when a new transaction is created.

-   **Purpose**: To create one or more transaction records and update the relevant fund source balances in a single, atomic operation.
-   **Logic**:
    1.  It receives the transaction details (description, amount, type, fee, etc.) as parameters.
    2.  It checks for sufficient funds in the source account if the transaction is an `expense` or `transfer`.
    3.  It inserts the main transaction record into the `transactions` table.
    4.  **If a fee is provided**, it inserts a second `expense` transaction for the fee, linking it to the main transaction with `parent_transaction_id`.
    5.  It updates the `balance` in the `fund_sources` table:
        -   For an `expense`, it subtracts the amount from the source fund.
        -   For an `income`, it adds the amount to the destination fund.
        -   For a `transfer`, it subtracts the amount (plus fee) from the source and adds the amount to the destination.

### b. `update_transaction_and_update_balance`

This function is called when an existing transaction is modified.

-   **Purpose**: To update a transaction and adjust fund balances accordingly, reverting the old transaction's impact first.
-   **Logic**:
    1.  It first reverts the financial impact of the original transaction on the fund source(s).
    2.  It then updates the transaction record in the `transactions` table with the new details.
    3.  Finally, it applies the financial impact of the new, updated transaction to the relevant fund source(s), similar to the `create` function.

### c. `delete_transaction_and_revert_balance`

This function is called to delete a transaction.

-   **Purpose**: To delete a transaction and its associated fee (if any) and revert the changes to the fund balances.
-   **Logic**:
    1.  It identifies the transaction to be deleted by its ID.
    2.  It reverts the impact of this transaction on the fund source balances.
    3.  It checks if any other transaction (i.e., a fee) has this transaction as its `parent_transaction_id`. If so, it also reverts the fee's impact and deletes the fee transaction.
    4.  It deletes the main transaction record.

---

For a more detailed reference on each RPC function, including parameters and SQL definitions, see the [RPC Functions Reference](./10-rpc-functions-reference.md).
