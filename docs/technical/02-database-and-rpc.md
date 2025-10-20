# 🔧 Technical: Database and RPC Functions

## 1. Overview

This document details the database schema used in the AI Business Finance Tracker and explains the role of the Supabase Remote Procedure Calls (RPCs) in maintaining data integrity and handling complex operations atomically.

---

## 2. Database Schema

The database is hosted on Supabase (PostgreSQL). The key tables are `transactions`, `categories`, and `fund_sources`.

### a. `transactions` Table

This is the central table that stores all financial movements.

| Column              | Type      | Description                                                                                      |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `id`                | `uuid`    | Primary key for the transaction.                                                                 |
| `user_id`           | `uuid`    | Foreign key linking to the `auth.users` table.                                                   |
| `description`       | `text`    | A user-provided description of the transaction.                                                  |
| `amount`            | `integer` | The monetary value of the transaction, stored in cents to avoid floating-point inaccuracies.     |
| `type`              | `enum`    | The type of transaction: `income`, `expense`, or `transfer`.                                     |
| `transaction_date`  | `timestamptz` | The date and time the transaction occurred.                                                    |
| `category_id`       | `uuid`    | Foreign key linking to the `categories` table. Nullable.                                         |
| `source_fund_id`    | `uuid`    | Foreign key to `fund_sources`. Used for `expense` and `transfer` types.                          |
| `destination_fund_id` | `uuid`    | Foreign key to `fund_sources`. Used for `income` and `transfer` types.                           |
| `parent_transaction_id` | `uuid`    | **Crucial field**. Links a transaction to a parent. Used to associate a fee with a transfer. |
| `created_at`        | `timestamptz` | Timestamp of when the record was created.                                                      |

#### The `parent_transaction_id` Relationship

When a transfer includes an administrative fee, two transactions are created:
1.  A `transfer` transaction for the main amount.
2.  An `expense` transaction for the fee amount.

The `parent_transaction_id` of the fee transaction is set to the `id` of the main transfer transaction, creating a clear link between them.

### b. `categories` and `fund_sources` Tables

-   **`categories`**: Stores user-defined categories for income and expenses. It supports a hierarchical structure with a `parent_id` column.
-   **`fund_sources`**: Stores the user's financial accounts (e.g., bank accounts, cash) and their current balances.

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
