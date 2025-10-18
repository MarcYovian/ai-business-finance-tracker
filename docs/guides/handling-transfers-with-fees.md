# 📖 Guide: Handling Transfers with Fees

## 1. Overview

In many financial scenarios, transferring funds between two accounts (e.g., from a bank account to a cash wallet) can incur an administrative fee. The AI Business Finance Tracker provides a seamless way to record both the transfer and its associated fee in a single, atomic operation.

This guide explains how to perform a fund transfer with a fee using the `TransactionDialog`.

---

## 2. How to Record a Transfer with a Fee

### Step 1: Open the Transaction Dialog

Navigate to the **Transactions** page and click the **"Add Transaction"** button. This will open the `TransactionDialog`.

### Step 2: Select the Transfer Type

In the dialog, select `Transfer` from the **Type** dropdown menu. This will reconfigure the form to show fields relevant for a transfer.

### Step 3: Fill in the Transfer Details

-   **Amount**: Enter the main amount you are transferring from one account to the other.
-   **Source Fund**: Select the account from which the money is being withdrawn.
-   **Destination Fund**: Select the account to which the money is being deposited.
-   **Description**: The description is automatically generated (e.g., "Transfer from Bank A to Bank B") but can be customized.
-   **Date**: The date of the transfer.

### Step 4: Add the Administrative Fee

An **"Admin Fee (Optional)"** field will appear. Enter the amount of the fee in this field.

**Example:**

-   **Amount**: `Rp 1.000.000`
-   **Source Fund**: `BCA`
-   **Destination Fund**: `Cash Wallet`
-   **Admin Fee**: `Rp 6.500`

### Step 5: Submit the Transaction

Click the **"Create"** button. The system will then perform the following actions in the background.

---

## 3. The Backend Logic (RPC Function)

When you submit a transfer with a fee, the application calls the `create_transaction_and_update_balance` Supabase RPC function. This function is designed to handle the operation atomically, meaning all steps must succeed for the transaction to be saved. This prevents data inconsistencies.

Here’s what the RPC function does:

1.  **Creates the Main Transfer Transaction**: A `transfer` type transaction is created for the main amount (`Rp 1.000.000` in our example).

2.  **Creates a Fee Transaction**: If a fee is included, a separate `expense` type transaction is created for the fee amount (`Rp 6.500`). This new expense transaction is linked to the main transfer transaction via the `parent_transaction_id` field.

3.  **Updates Fund Balances**: The balances of the source and destination funds are updated accordingly:
    -   The **Source Fund** balance is decreased by the transfer amount **plus** the fee (`Rp 1.000.000 + Rp 6.500`).
    -   The **Destination Fund** balance is increased by only the transfer amount (`Rp 1.000.000`).

By using an RPC function, we ensure that this complex, multi-step operation is handled safely and reliably on the backend, maintaining the integrity of your financial data.
