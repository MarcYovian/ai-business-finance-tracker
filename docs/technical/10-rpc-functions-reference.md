# 🔧 Technical Reference: RPC Functions

## 1. Overview

This document provides a detailed reference for the custom PostgreSQL Remote Procedure Call (RPC) functions used in the Supabase backend. These functions contain critical business logic and ensure that complex database operations are performed atomically and securely.

---

## 2. Transaction-Related Functions

### a. `create_transaction_and_update_balance`

- **Purpose**: Creates a new transaction (and an associated fee transaction, if applicable) and atomically updates the balances of the corresponding fund sources.
- **Parameters**:
  - `p_description` (text): The transaction description.
  - `p_amount` (integer): The transaction amount in cents.
  - `p_type` (text): The transaction type (`income`, `expense`, or `transfer`).
  - `p_transaction_date` (timestamptz): The date of the transaction.
  - `p_user_id` (uuid): The ID of the user performing the transaction.
  - `p_category_id` (uuid): The ID of the associated category (nullable).
  - `p_source_fund_id` (uuid): The ID of the source fund (for `expense` and `transfer`).
  - `p_destination_fund_id` (uuid): The ID of the destination fund (for `income` and `transfer`).
  - `p_fee` (integer): The administrative fee in cents (for `transfer`).
- **Logic**:

  1.  Inserts the main transaction into the `transactions` table and captures the newly created record.
  2.  Based on the transaction `type`:
      - **'income'**: Increases the balance of the `p_destination_fund_id`.
      - **'expense'**: Decreases the balance of the `p_source_fund_id`.
      - **'transfer'**: Decreases the `p_source_fund_id` balance by the transaction amount plus any fee, and increases the `p_destination_fund_id` balance by the transaction amount.
  3.  If the transaction is a `transfer` and a `p_fee` is provided, it creates a separate, secondary `expense` transaction for the fee amount, linked to the source fund.
  4.  Returns the newly created main transaction record.

- **SQL Definition**:

  ```sql
  CREATE OR REPLACE FUNCTION public.create_transaction_and_update_balance(
      p_description text,
      p_amount bigint,
      p_type text,
      p_transaction_date timestamp with time zone,
      p_user_id uuid,
      p_category_id uuid,
      p_source_fund_id uuid,
      p_destination_fund_id uuid,
      p_fee bigint
  )
  RETURNS transactions AS $$
  DECLARE
    new_transaction transactions;
  BEGIN
    INSERT INTO public.transactions (description, amount, type, transaction_date, user_id, category_id, source_fund_id, destination_fund_id)
    VALUES (p_description, p_amount, p_type, p_transaction_date, p_user_id, p_category_id, p_source_fund_id, p_destination_fund_id)
    RETURNING * INTO new_transaction;

    IF p_type = 'income' AND p_destination_fund_id IS NOT NULL THEN
      UPDATE public.fund_sources
      SET balance = balance + p_amount
      WHERE id = p_destination_fund_id;

    ELSIF p_type = 'expense' AND p_source_fund_id IS NOT NULL THEN
      UPDATE public.fund_sources
      SET balance = balance - p_amount
      WHERE id = p_source_fund_id;

    ELSIF p_type = 'transfer' AND p_source_fund_id IS NOT NULL AND p_destination_fund_id IS NOT NULL THEN
      UPDATE public.fund_sources
      SET balance = balance - (p_amount + p_fee)
      WHERE id = p_source_fund_id;

      UPDATE public.fund_sources
      SET balance = balance + p_amount
      WHERE id = p_destination_fund_id;

      IF p_fee > 0 THEN
        INSERT INTO public.transactions (description, amount, type, transaction_date, user_id, category_id, source_fund_id)
        VALUES ('Biaya admin untuk transfer', p_fee, 'expense', p_transaction_date, p_user_id, NULL, p_source_fund_id);
      END IF;

    END IF;

    RETURN new_transaction;
  END;
  $$ LANGUAGE plpgsql;
  ```

### b. `update_transaction_and_update_balance`

- **Purpose**: Updates an existing transaction and correctly adjusts the balances of all affected fund sources by reverting the old transaction and applying the new one.
- **Parameters**: Similar to `create_transaction_and_update_balance`, with the addition of `p_id` (the ID of the transaction to update).
- **Logic**:

  1.  Finds the original transaction (`old_tx`) using its ID.
  2.  Searches for and deletes any associated admin fee transaction from the original record, reverting its balance impact.
  3.  Reverts the balance changes from the original transaction based on its type (e.g., adds the amount back for an expense).
  4.  Checks if the source fund has sufficient balance for the **new** transaction details.
  5.  Applies the new balance changes based on the updated transaction details, including creating a new fee transaction if required.
  6.  Updates the original transaction record with the new data.

- **SQL Definition**:

  ```sql
  CREATE OR REPLACE FUNCTION update_transaction_and_update_balance(
      p_id UUID,
      p_description TEXT,
      p_amount BIGINT,
      p_type TEXT,
      p_transaction_date TIMESTAMPTZ,
      p_category_id UUID,
      p_source_fund_id UUID,
      p_destination_fund_id UUID,
      p_fee BIGINT DEFAULT 0
  )
  RETURNS VOID AS $$
  DECLARE
      old_tx RECORD;
      new_source_balance BIGINT;
      old_fee_tx RECORD;
  BEGIN
      SELECT * INTO old_tx FROM public.transactions WHERE id = p_id;

      SELECT * INTO old_fee_tx FROM public.transactions
      WHERE type = 'expense'
      AND source_fund_id = old_tx.source_fund_id
      AND transaction_date = old_tx.transaction_date
      AND description = 'Biaya admin untuk transfer';

      IF FOUND THEN
          UPDATE public.fund_sources
          SET balance = balance + old_fee_tx.amount
          WHERE id = old_fee_tx.source_fund_id;
          DELETE FROM public.transactions WHERE id = old_fee_tx.id;
      END IF;

      IF old_tx.type = 'expense' THEN
          UPDATE public.fund_sources SET balance = balance + old_tx.amount WHERE id = old_tx.source_fund_id;
      ELSIF old_tx.type = 'income' THEN
          UPDATE public.fund_sources SET balance = balance - old_tx.amount WHERE id = old_tx.destination_fund_id;
      ELSIF old_tx.type = 'transfer' THEN
          UPDATE public.fund_sources SET balance = balance + old_tx.amount WHERE id = old_tx.source_fund_id;
          UPDATE public.fund_sources SET balance = balance - old_tx.amount WHERE id = old_tx.destination_fund_id;
      END IF;

      IF (p_type = 'expense' OR p_type = 'transfer') AND p_source_fund_id IS NOT NULL THEN
          SELECT balance INTO new_source_balance FROM public.fund_sources WHERE id = p_source_fund_id;
          IF new_source_balance < (p_amount + p_fee) THEN
              RAISE EXCEPTION 'Insufficient funds in the source account.';
          END IF;
      END IF;

      IF p_type = 'expense' THEN
          UPDATE public.fund_sources SET balance = balance - p_amount WHERE id = p_source_fund_id;
      ELSIF p_type = 'income' THEN
          UPDATE public.fund_sources SET balance = balance + p_amount WHERE id = p_destination_fund_id;
      ELSIF p_type = 'transfer' THEN
          UPDATE public.fund_sources SET balance = balance - (p_amount + p_fee) WHERE id = p_source_fund_id;
          UPDATE public.fund_sources SET balance = balance + p_amount WHERE id = p_destination_fund_id;

          IF p_fee > 0 THEN
            INSERT INTO public.transactions (description, amount, type, transaction_date, user_id, category_id, source_fund_id)
            VALUES ('Biaya admin untuk transfer', p_fee, 'expense', p_transaction_date, old_tx.user_id, NULL, p_source_fund_id);
          END IF;
      END IF;

      UPDATE public.transactions
      SET
          description = p_description,
          amount = p_amount,
          type = p_type,
          transaction_date = p_transaction_date,
          category_id = p_category_id,
          source_fund_id = p_source_fund_id,
          destination_fund_id = p_destination_fund_id
      WHERE id = p_id;

  END;
  $$ LANGUAGE plpgsql;
  ```

### c. `delete_transaction_and_revert_balance`

- **Purpose**: Deletes a transaction and its associated fee (if any) and reverts the corresponding balance changes.
- **Parameters**:
  - `p_transaction_id` (uuid): The ID of the transaction to delete.
- **Logic**:

  1.  Finds the transaction to be deleted.
  2.  If the transaction is a `transfer`, it finds and deletes any associated fee transaction first.
  3.  Reverts the balance changes on the affected fund sources. For transfers, it correctly adds back both the principal amount and the fee to the source fund.
  4.  Deletes the main transaction record.

- **SQL Definition**:

  ```sql
  CREATE OR REPLACE FUNCTION delete_transaction_and_revert_balance(p_transaction_id UUID)
  RETURNS VOID AS $$
  DECLARE
      tx_to_delete RECORD;
      fee_amount BIGINT := 0;
  BEGIN
      SELECT * INTO tx_to_delete FROM public.transactions WHERE id = p_transaction_id;

      IF NOT FOUND THEN
          RAISE EXCEPTION 'Transaction with id % not found', p_transaction_id;
      END IF;

      IF tx_to_delete.type = 'transfer' THEN
          SELECT amount INTO fee_amount FROM public.transactions WHERE parent_transaction_id = tx_to_delete.id;

          DELETE FROM public.transactions WHERE parent_transaction_id = tx_to_delete.id;
      END IF;

      IF tx_to_delete.type = 'expense' THEN
          UPDATE public.fund_sources
          SET balance = balance + tx_to_delete.amount
          WHERE id = tx_to_delete.source_fund_id;

      ELSIF tx_to_delete.type = 'income' THEN
          UPDATE public.fund_sources
          SET balance = balance - tx_to_delete.amount
          WHERE id = tx_to_delete.destination_fund_id;

      ELSIF tx_to_delete.type = 'transfer' THEN
          UPDATE public.fund_sources
          SET balance = balance + tx_to_delete.amount + COALESCE(fee_amount, 0)
          WHERE id = tx_to_delete.source_fund_id;

          UPDATE public.fund_sources
          SET balance = balance - tx_to_delete.amount
          WHERE id = tx_to_delete.destination_fund_id;
      END IF;

      DELETE FROM public.transactions WHERE id = p_transaction_id;

  END;
  $$ LANGUAGE plpgsql;
  ```

---

## 3. Budget-Related Functions

### a. `get_or_create_budget_for_month`

- **Purpose**: Retrieves the budget for a given month. If one does not exist, it creates a new, empty budget for that month.
- **Parameters**:
  - `p_user_id` (uuid): The user's ID.
  - `p_month_date` (date): A date within the desired month (typically the first day).
- **Logic**:

  1.  Determines the start and end date of the month based on `p_month_date`.
  2.  Checks if a budget already exists for the user within that exact date range.
  3.  If a budget is found, it is returned.
  4.  If no budget is found, it creates a new one with a formatted name (e.g., "Budget for October 2025") and returns the new record.

- **SQL Definition**:

  ```sql
  CREATE OR REPLACE FUNCTION get_or_create_budget_for_month(p_user_id UUID, p_month_date DATE)
  RETURNS TABLE (id UUID, user_id UUID, name TEXT, start_date DATE, end_date DATE, created_at TIMESTAMPTZ) AS $$
  DECLARE
      v_budget_id UUID;
      v_start_date DATE;
      v_end_date DATE;
      v_name TEXT;
  BEGIN
      v_start_date := date_trunc('month', p_month_date)::date;
      v_end_date := (date_trunc('month', p_month_date) + interval '1 month - 1 day')::date;

      SELECT b.id INTO v_budget_id FROM public.budgets b
      WHERE b.user_id = p_user_id AND b.start_date = v_start_date;

      IF NOT FOUND THEN
          v_name := 'Budget for ' || to_char(p_month_date, 'Month YYYY');
          INSERT INTO public.budgets (user_id, start_date, end_date, name)
          VALUES (p_user_id, v_start_date, v_end_date, v_name)
          RETURNING budgets.id INTO v_budget_id;
      END IF;

      RETURN QUERY SELECT * FROM public.budgets WHERE budgets.id = v_budget_id;
  END;
  $$ LANGUAGE plpgsql;
  ```

### b. `upsert_budget_with_items`

- **Purpose**: Creates or updates a budget and all of its associated items (category budgets) in a single operation.
- **Parameters**:
  - `p_user_id` (uuid): The user's ID.
  - `p_start_date` (date): The start date of the budget period.
  - `p_end_date` (date): The end date of the budget period.
  - `p_name` (text): The name of the budget.
  - `p_items` (jsonb): A JSON array of budget items, each with `category_id` and `amount`.
- **Logic**:

  1.  Performs an "upsert" on the `budgets` table. It inserts a new budget or updates the name of an existing one based on a conflict on `(user_id, start_date, end_date)`.
  2.  It then **deletes all existing items** from `budget_items` that are linked to the budget ID. This ensures that the new set of items is the only one associated with the budget.
  3.  Finally, it iterates through the `p_items` JSON array and inserts the new budget items.

- **SQL Definition**:

  ```sql
  CREATE OR REPLACE FUNCTION upsert_budget_with_items(
      p_user_id UUID,
      p_start_date DATE,
      p_end_date DATE,
      p_name TEXT,
      p_items JSONB
  )
  RETURNS VOID AS $$
  DECLARE
      v_budget_id UUID;
      item jsonb;
  BEGIN
      INSERT INTO public.budgets (user_id, start_date, end_date, name)
      VALUES (p_user_id, p_start_date, p_end_date, p_name)
      ON CONFLICT (user_id, start_date, end_date)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO v_budget_id;

      DELETE FROM public.budget_items WHERE budget_id = v_budget_id;

      FOR item IN SELECT jsonb_array_elements(p_items)
      LOOP
          INSERT INTO public.budget_items (budget_id, category_id, amount)
          VALUES (
              v_budget_id,
              (item->>'category_id')::uuid,
              (item->>'amount')::bigint
          );
      END LOOP;
  END;
  $$ LANGUAGE plpgsql;
  ```

### c. `get_budget_details`

- **Purpose**: Fetches a detailed breakdown of a budget, including the amount spent for each category.
- **Parameters**:
  - `p_budget_id` (uuid): The ID of the budget to retrieve details for.
- **Logic**:

  1.  Uses a Common Table Expression (CTE) to find the `start_date` and `end_date` of the specified budget.
  2.  Uses a second CTE (`category_spending`) to sum up all `expense` transactions for the user within the budget's date range, grouped by `category_id`.
  3.  The final query joins `budget_items` with `categories` (to get the category name) and `LEFT JOIN`s the result with the `category_spending` CTE.
  4.  `COALESCE` is used to ensure that `spent` is `0` for categories with no expenses, rather than `NULL`.
  5.  Returns a table of records, each containing the budget item ID, budgeted amount, category ID and name, and the calculated total spent for that category.

- **SQL Definition**:

  ```sql
  CREATE OR REPLACE FUNCTION get_budget_details(p_budget_id UUID)
  RETURNS TABLE (
      id UUID,
      amount BIGINT,
      category_id UUID,
      category_name TEXT,
      spent BIGINT
  )
  LANGUAGE plpgsql
  AS $$
  BEGIN
      RETURN QUERY
      WITH budget_period AS (
          SELECT b.start_date, b.end_date
          FROM public.budgets b
          WHERE b.id = p_budget_id AND b.user_id = auth.uid()
      ),
      category_spending AS (
          SELECT
              t.category_id,
              SUM(t.amount) AS total_spent
          FROM public.transactions t, budget_period bp
          WHERE t.user_id = auth.uid()
            AND t.type = 'expense'
            AND t.transaction_date BETWEEN bp.start_date AND bp.end_date
          GROUP BY t.category_id
      )
      SELECT
          bi.id,
          bi.amount,
          bi.category_id,
          c.name AS category_name,
          COALESCE(cs.total_spent, 0)::BIGINT AS spent
      FROM public.budget_items bi
      JOIN public.categories c ON bi.category_id = c.id
      LEFT JOIN category_spending cs ON bi.category_id = cs.category_id
      WHERE bi.budget_id = p_budget_id;
  END;
  $$;
  ```
