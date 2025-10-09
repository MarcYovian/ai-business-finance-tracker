# Project: Implement Insufficient Funds Check for Transactions

## 1. High-Level Goal

I need you to act as an expert React/TypeScript developer. Your task is to fix a critical data integrity bug in my finance application. Currently, the application allows creating 'expense' or 'transfer' transactions even when the source fund has an insufficient balance, which can result in a negative balance.

The fix involves two parts:

1.  Add a **client-side balance check** in the data storage layer before a transaction is created.
2.  Implement **context-aware error handling**:
    - For transactions created via the **AI Assistant**, the error must be displayed as a **chat message**.
    - For transactions created **manually** (e.g., through a dialog), the error should be displayed as a **toast notification**.

## 2. Problem Description

The root cause of the bug is the lack of a pre-emptive balance check in the client-side code.

1.  **In `src/lib/storage.ts`**: The `transactionStorage.create` function directly calls a database RPC without first verifying if the `sourceFundId` has enough balance for an `expense`.
2.  **In `src/pages/AIAssistant.tsx`**: The `handleLogTransaction` function calls `transactionStorage.create` but its `try...catch` block is generic and doesn't distinguish between different types of errors. It shows a `toast` for all failures. We want to handle the "Insufficient Funds" error specifically by sending a chat message instead.

## 3. Current Codebase Files to Refactor

The main files that need changes are `src/lib/storage.ts` and `src/pages/AIAssistant.tsx`.

### `src/lib/storage.ts`

```typescript
// Current src/lib/storage.ts
// ...
export const transactionStorage = {
  // ... other functions
  create: async (
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Promise<Transaction> => {
    // BUG: No balance check happens here before calling the RPC.
    const { data: newTransaction, error } = await supabase
      .rpc("create_transaction_and_update_balance", {
        p_description: transaction.description,
        // ... other parameters
      })
      .select()
      .single();
    if (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
    // ... mapping logic
    return {
      /* ... */
    };
  },
  // ... other functions
};
```

### `src/pages/AIAssistant.tsx`

```typescript
// Current src/pages/AIAssistant.tsx
// ...
const handleLogTransaction = async (userInput: string) => {
  // ...
  try {
    // ... logic to parse AI response and build transaction object ...

    await transactionStorage.create({
      /* ... transaction data ... */
    });

    // ... success message logic ...
  } catch (error) {
    // BUG: This catch block is too generic. It shows a toast for all errors,
    // including "Insufficient Funds", which should be a chat message.
    console.error("AI processing error:", error);
    toast({
      title: "Error",
      description: "Failed to process your request.",
      variant: "destructive",
    });
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try rephrasing.",
      },
    ]);
  }
};
// ...
```

---

## 4. Required Changes & Instructions

Please implement the following refactoring steps.

### Step 1: Add Balance Check to `storage.ts`

Modify the `transactionStorage.create` function in `src/lib/storage.ts`.

1.  Inside the function, **before** the `supabase.rpc()` call, add a conditional block to check if the transaction is an `expense` or `transfer` and has a `sourceFundId`.
2.  If it is, `await` a fetch call to get the `fund_sources` record that matches the `sourceFundId`.
3.  Compare the fetched `balance` with the `transaction.amount`.
4.  If `balance < transaction.amount`, you **must `throw new Error("Insufficient funds in the source account.")`**. The specific error message is important as the UI will rely on it.
5.  If the fund source is not found, also throw an error (e.g., `throw new Error("Source fund not found.")`).
6.  If the balance is sufficient, allow the function to proceed to the `supabase.rpc()` call.

### Step 2: Implement Context-Aware Error Handling in `AIAssistant.tsx`

Modify the `catch` block within the `handleLogTransaction` function in `src/pages/AIAssistant.tsx`.

1.  The `catch` block should be updated to `catch (error: any)`.
2.  Inside the `catch` block, check if `error.message` includes the string `"Insufficient funds"`.
3.  **If it does**, do **not** show a `toast`. Instead, update the chat state with a user-friendly message, like: `"Maaf, saldo di sumber dana Anda tidak mencukupi untuk melakukan transaksi ini."`
4.  **If the error is different**, you can proceed with the existing generic error handling (showing a `toast` and a generic chat message).

---

## 5. Final Output

Please provide the complete, refactored code for the following two files:

1.  **`src/lib/storage.ts`** (with the updated `transactionStorage.create` function).
2.  **`src/pages/AIAssistant.tsx`** (with the updated `handleLogTransaction` function containing the new `try...catch` logic).
