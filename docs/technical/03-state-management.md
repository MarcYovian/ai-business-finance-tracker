# 🔧 Technical: State Management with TanStack Query

## 1. Overview

In the AI Business Finance Tracker, state is divided into two main categories: **client state** and **server state**.

-   **Client State**: Managed with React's built-in hooks (`useState`, `useContext`). This includes UI state like dialog visibility, form inputs, etc.
-   **Server State**: Managed with **TanStack Query** (formerly React Query). This includes any data that is fetched from and persisted on the server (our Supabase backend), such as transactions, categories, and fund sources.

This document focuses on how TanStack Query is used for server state management.

---

## 2. Why TanStack Query?

TanStack Query is not just a data-fetching library; it is a powerful server state management tool that provides several key benefits:

-   **Caching**: It automatically caches data from the server, reducing the number of redundant API calls and making the application feel faster.
-   **Synchronization**: It keeps the client state in sync with the server state, automatically refetching data in the background when it becomes stale.
-   **Declarative API**: It provides a simple, declarative API for fetching, caching, and updating data, which simplifies the codebase.
-   **Performance**: Features like `stale-while-revalidate` ensure that the user sees data immediately from the cache while fresh data is being fetched in the background.

---

## 3. Implementation: Custom Hooks

To make working with TanStack Query even more straightforward and to centralize data-access logic, the application uses a set of custom hooks. Each hook is responsible for managing a specific type of data.

These hooks are located in the `src/hooks/` directory.

### a. `useTransactions.ts`

This hook manages all CRUD operations for transactions.

-   **`useTransactions()`**: A wrapper around `useQuery` that fetches all transactions for the current user. It uses a query key like `['transactions', userId]`.

-   **`useAddTransaction()`**: A wrapper around `useMutation` for creating a new transaction. On success, it automatically invalidates the `['transactions']` query to refetch the list and display the new data.

-   **`useUpdateTransaction()`**: A wrapper around `useMutation` for updating an existing transaction. It also invalidates the `['transactions']` query on success.

-   **`useDeleteTransaction()`**: A wrapper around `useMutation` for deleting a transaction, which also invalidates the query.

### b. `useCategories.ts` and `useFundSources.ts`

These hooks follow the same pattern as `useTransactions.ts` but are responsible for managing categories and fund sources, respectively. They provide functions for fetching, adding, updating, and deleting their specific data types.

---

## 4. The Invalidation Strategy: Keeping Data Fresh

A core concept in this architecture is **query invalidation**. Instead of manually updating the local cache after a mutation (which can be complex and error-prone), we simply tell TanStack Query that the data is now stale.

### How It Works

1.  A mutation is performed (e.g., a new transaction is added using `useAddTransaction`).
2.  In the `onSuccess` callback of the mutation, we call `queryClient.invalidateQueries()`.

    ```typescript
    const queryClient = useQueryClient();

    const mutation = useMutation({
      mutationFn: addTransaction,
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      },
    });
    ```

3.  TanStack Query marks any query whose key matches `['transactions']` as stale.
4.  If that query is currently active on the screen, it is automatically refetched in the background.
5.  Once the fresh data arrives, the UI is seamlessly updated.

This strategy ensures that the UI is always eventually consistent with the server state and greatly simplifies the logic within our components.
