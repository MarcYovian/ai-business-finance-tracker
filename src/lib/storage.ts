import {
  Beneficiary,
  Budget,
  BudgetDetail,
  BudgetItem,
  Category,
  FinancialGoal,
  FundSource,
  Transaction,
  User,
} from "@/types/finance";
import { formatCurrency } from "./currency";
import { supabase } from "./supabase";

const STORAGE_KEYS = {
  OPENAI_KEY: "ai-fi-openai-key",
  GEMINI_KEY: "ai-fi-gemini-key",
  AI_PROVIDER: "ai-fi-provider",
};

// Generic storage utilities for localStorage (for API keys)
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

// User operations (using Supabase Auth)
export const userStorage = {
  getCurrentUser: async (): Promise<User | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || "",
      createdAt: user.created_at,
    };
  },

  // signIn, signUp, signOut will be handled directly in components/AuthContext
};

// Category operations
export const categoryStorage = {
  getAll: async (
    userId: string,
    type?: "income" | "expense"
  ): Promise<Category[]> => {
    let query = supabase.from("categories").select("*").eq("user_id", userId);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (
      data?.map((category) => ({
        id: category.id,
        name: category.name,
        userId: category.user_id,
        createdAt: category.created_at,
        type: category.type,
        parentId: category.parent_id || null,
        color: category.color || null,
        icon: category.icon || null,
        description: category.description || null,
        sort_order: category.sort_order ?? null,
        is_active: category.is_active ?? true,
      })) || []
    );
  },

  create: async (
    name: string,
    userId: string,
    type: "income" | "expense",
    parentId: string | null = null,
    extra?: Partial<Category>
  ): Promise<Category> => {
    const payload: any = {
      name,
      user_id: userId,
      type,
      parent_id: parentId,
    };
    if (extra?.color !== undefined) payload.color = extra.color;
    if (extra?.icon !== undefined) payload.icon = extra.icon;
    if (extra?.description !== undefined) payload.description = extra.description;
    if (extra?.sort_order !== undefined) payload.sort_order = extra.sort_order;
    if (extra?.is_active !== undefined) payload.is_active = extra.is_active;

    const { data, error } = await supabase
      .from("categories")
      .insert([payload])
      .select();
    if (error) throw error;

    const result = data[0];
    return {
      id: result.id,
      name: result.name,
      userId: result.user_id,
      createdAt: result.created_at,
      type: result.type,
      parentId: result.parent_id || null,
      color: result.color || null,
      icon: result.icon || null,
      description: result.description || null,
      sort_order: result.sort_order ?? null,
      is_active: result.is_active ?? true,
    };
  },

  update: async (id: string, updates: Partial<Category>): Promise<Category> => {
    const updatesForDb: any = {};
    if (updates.name !== undefined) updatesForDb.name = updates.name;
    if (updates.type !== undefined) updatesForDb.type = updates.type;
    if (updates.parentId !== undefined)
      updatesForDb.parent_id = updates.parentId;
    if (updates.color !== undefined) updatesForDb.color = updates.color;
    if (updates.icon !== undefined) updatesForDb.icon = updates.icon;
    if (updates.description !== undefined) updatesForDb.description = updates.description;
    if (updates.sort_order !== undefined) updatesForDb.sort_order = updates.sort_order;
    if (updates.is_active !== undefined) updatesForDb.is_active = updates.is_active;

    const { data, error } = await supabase
      .from("categories")
      .update(updatesForDb)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
      createdAt: data.created_at,
      type: data.type,
      parentId: data.parent_id || null,
      color: data.color || null,
      icon: data.icon || null,
      description: data.description || null,
      sort_order: data.sort_order ?? null,
      is_active: data.is_active ?? true,
    };
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },

  findByName: async (
    name: string,
    userId: string
  ): Promise<Category | undefined> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", name)
      .limit(1);
    if (error) throw error;

    if (data && data[0]) {
      const category = data[0];
      return {
        id: category.id,
        name: category.name,
        userId: category.user_id,
        createdAt: category.created_at,
        type: category.type,
        parentId: category.parent_id || null,
        color: category.color || null,
        icon: category.icon || null,
        description: category.description || null,
        sort_order: category.sort_order ?? null,
        is_active: category.is_active ?? true,
      };
    }
    return undefined;
  },
};

// Fund Source operations
export const fundSourceStorage = {
  getAll: async (userId: string): Promise<FundSource[]> => {
    const { data, error } = await supabase
      .from("fund_sources")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    return (
      data?.map((fundSource) => ({
        id: fundSource.id,
        user_id: fundSource.user_id,
        name: fundSource.name,
        type: fundSource.type,
        balance: fundSource.balance,
        account_number: fundSource.account_number,
        account_holder_name: fundSource.account_holder_name,
        card_expiry: fundSource.card_expiry,
        color_theme: fundSource.color_theme,
        is_active: fundSource.is_active,
        created_at: fundSource.created_at,
      })) || []
    );
  },

  create: async (
    name: string,
    balance: number,
    userId: string,
    extra?: Partial<FundSource>
  ): Promise<FundSource> => {
    const payload = {
      name,
      balance,
      user_id: userId,
      type: extra?.type || "bank",
      account_number: extra?.account_number || null,
      account_holder_name: extra?.account_holder_name || null,
      card_expiry: extra?.card_expiry || null,
      color_theme: extra?.color_theme || "lime",
      is_active: extra?.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("fund_sources")
      .insert([payload])
      .select();
    if (error) throw error;

    const result = data[0];
    return {
      id: result.id,
      name: result.name,
      balance: result.balance,
      userId: result.user_id,
      createdAt: result.created_at,
    };
  },

  update: async (id: string, updates: Partial<FundSource>): Promise<void> => {
    const updatesForDb: { [key: string]: any } = {};
    if (updates.name !== undefined) updatesForDb.name = updates.name;
    if (updates.balance !== undefined) updatesForDb.balance = updates.balance;
    if (updates.type !== undefined) updatesForDb.type = updates.type;
    if (updates.account_number !== undefined) updatesForDb.account_number = updates.account_number;
    if (updates.account_holder_name !== undefined) updatesForDb.account_holder_name = updates.account_holder_name;
    if (updates.card_expiry !== undefined) updatesForDb.card_expiry = updates.card_expiry;
    if (updates.color_theme !== undefined) updatesForDb.color_theme = updates.color_theme;
    if (updates.is_active !== undefined) updatesForDb.is_active = updates.is_active;

    const { error } = await supabase
      .from("fund_sources")
      .update(updatesForDb)
      .eq("id", id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("fund_sources").delete().eq("id", id);
    if (error) throw error;
  },

  findByName: async (
    name: string,
    userId: string
  ): Promise<FundSource | undefined> => {
    const { data, error } = await supabase
      .from("fund_sources")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", name)
      .limit(1);
    if (error) throw error;

    if (data && data[0]) {
      const fundSource = data[0];
      return {
        id: fundSource.id,
        name: fundSource.name,
        balance: fundSource.balance,
        userId: fundSource.user_id,
        createdAt: fundSource.created_at,
      };
    }
    return undefined;
  },
};

// Transaction operations
export const transactionStorage = {
  getAll: async (userId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;

    return (
      data?.map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        transactionDate: transaction.transaction_date,
        createdAt: transaction.created_at,
        userId: transaction.user_id,
        categoryId: transaction.category_id,
        sourceFundId: transaction.source_fund_id,
        destinationFundId: transaction.destination_fund_id,
        notes: transaction.notes,
        status: transaction.status,
        parentTransactionId: transaction.parent_transaction_id,
      })) || []
    );
  },

  create: async (
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Promise<Transaction> => {
    const amountInCents = transaction.amount * 100;
    const feeInCents = transaction.fee ? transaction.fee * 100 : 0;

    // Check for sufficient funds for expense transactions
    if (
      (transaction.type === "expense" || transaction.type === "transfer") &&
      transaction.sourceFundId
    ) {
      const { data: sourceFund, error: fundError } = await supabase
        .from("fund_sources")
        .select("balance")
        .eq("id", transaction.sourceFundId)
        .single();

      if (fundError || !sourceFund) {
        throw new Error("Source fund not found.");
      }

      if (sourceFund.balance < amountInCents + feeInCents) {
        throw new Error("Insufficient funds in the source account.");
      }
    }

    const { data: newTransaction, error } = await supabase
      .rpc("create_transaction_and_update_balance", {
        p_description: transaction.description,
        p_amount: amountInCents,
        p_type: transaction.type,
        p_transaction_date: transaction.transactionDate,
        p_user_id: transaction.userId,
        p_category_id: transaction.categoryId ?? null,
        p_source_fund_id: transaction.sourceFundId ?? null,
        p_destination_fund_id: transaction.destinationFundId ?? null,
        p_fee: feeInCents ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }

    return {
      id: newTransaction.id,
      description: newTransaction.description,
      amount: newTransaction.amount,
      type: newTransaction.type,
      transactionDate: newTransaction.transaction_date,
      createdAt: newTransaction.created_at,
      userId: newTransaction.user_id,
      categoryId: newTransaction.category_id,
      sourceFundId: newTransaction.source_fund_id,
      destinationFundId: newTransaction.destination_fund_id,
      notes: newTransaction.notes,
      status: newTransaction.status,
    };
  },

  update: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const amountInCents = updates.amount ? updates.amount * 100 : 0;
    const feeInCents = updates.fee ? updates.fee * 100 : 0;

    if (
      (updates.type === "expense" || updates.type === "transfer") &&
      updates.sourceFundId
    ) {
      const { data: sourceFund, error: fundError } = await supabase
        .from("fund_sources")
        .select("balance")
        .eq("id", updates.sourceFundId)
        .single();

      if (fundError || !sourceFund) {
        throw new Error("Source fund not found.");
      }

      if (sourceFund.balance < amountInCents + feeInCents) {
        throw new Error("Insufficient funds in the source account.");
      }
    }

    const { data, error } = await supabase.rpc(
      "update_transaction_and_update_balance",
      {
        p_id: id,
        p_description: updates.description,
        p_amount: amountInCents,
        p_type: updates.type,
        p_transaction_date: updates.transactionDate,
        p_category_id: updates.categoryId,
        p_source_fund_id: updates.sourceFundId || null,
        p_destination_fund_id: updates.destinationFundId || null,
        p_fee: feeInCents || null,
      }
    );

    if (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc(
      "delete_transaction_and_revert_balance",
      {
        p_transaction_id: id,
      }
    );

    if (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  },

  createTransfer: async (
    fromFundId: string,
    toFundId: string,
    amount: number,
    fee: number
  ): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: fromFundSource, error: fromError } = await supabase
      .from("fund_sources")
      .select("name, balance")
      .eq("id", fromFundId)
      .single();
    if (fromError || !fromFundSource) throw new Error("Source fund not found");

    const { data: toFundSource, error: toError } = await supabase
      .from("fund_sources")
      .select("name, balance")
      .eq("id", toFundId)
      .single();
    if (toError || !toFundSource) throw new Error("Destination fund not found");

    const totalExpense = amount + fee;
    if (fromFundSource.balance < totalExpense) {
      throw new Error(
        `Insufficient funds. Available: ${formatCurrency(
          fromFundSource.balance
        )}, Required: ${formatCurrency(totalExpense)}.`
      );
    }

    // Create transfer transaction
    const transferTransaction = {
      description: `Transfer from ${fromFundSource.name} to ${toFundSource.name}`,
      amount: amount,
      type: "transfer" as const,
      transaction_date: new Date().toISOString(),
      user_id: user.id,
      source_fund_id: fromFundId,
      destination_fund_id: toFundId,
      category_id: null, // Transfers don't have categories
    };

    const insertPromises = [
      supabase.from("transactions").insert([transferTransaction]),
    ];

    // If there's a fee, create a separate expense transaction for it
    if (fee > 0) {
      const feeTransaction = {
        description: "Transfer fee",
        amount: fee,
        type: "expense" as const,
        transaction_date: new Date().toISOString(),
        user_id: user.id,
        source_fund_id: fromFundId,
        destination_fund_id: null,
        category_id: null, // Fee may have a category but for simplicity we'll leave it null
      };
      insertPromises.push(
        supabase.from("transactions").insert([feeTransaction])
      );
    }

    // Execute all inserts
    const results = await Promise.all(insertPromises);
    for (const result of results) {
      if (result.error) throw result.error;
    }

    // Update fund source balances
    const newFromBalance = fromFundSource.balance - totalExpense;
    const newToBalance = toFundSource.balance + amount;

    await fundSourceStorage.update(fromFundId, { balance: newFromBalance });
    await fundSourceStorage.update(toFundId, { balance: newToBalance });
  },
};

type UpsertBudgetStoragePayload = Omit<Budget, "id" | "created_at"> & {
  items: Pick<BudgetItem, "category_id" | "amount">[];
};

export const budgetStorage = {
  upsert: async (payload: UpsertBudgetStoragePayload): Promise<void> => {
    const itemsInCents = payload.items.map((item) => ({
      category_id: item.category_id,
      amount: Math.round(item.amount * 100),
    }));

    const { error } = await supabase.rpc("upsert_budget_with_items", {
      p_user_id: payload.user_id,
      p_start_date: payload.start_date,
      p_end_date: payload.end_date,
      p_name: payload.name,
      p_items: itemsInCents,
    });

    if (error) {
      throw error;
    }
  },

  getOrCreateForMonth: async (
    userId: string,
    month: Date
  ): Promise<Budget | null> => {
    const startDate = new Date(
      Date.UTC(month.getFullYear(), month.getMonth(), 1)
    )
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .rpc("get_or_create_budget_for_month", {
        p_user_id: userId,
        p_month_date: startDate,
      })
      .single();

    if (error) {
      console.error("Error getting or creating budget for month:", error);
      throw error;
    }

    return data;
  },

  getDetails: async (
    budgetId: string | null | undefined
  ): Promise<BudgetDetail[]> => {
    if (!budgetId) {
      return []; // Jika tidak ada budgetId, kembalikan array kosong
    }

    const { data, error } = await supabase.rpc("get_budget_details", {
      p_budget_id: budgetId,
    });

    if (error) {
      console.error("Error fetching budget details:", error);
      throw error;
    }

    return data || [];
  },

  getBudgetsWithItems: async (userId: string) => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          id,
          user_id,
          name,
          start_date,
          end_date,
          total_limit,
          is_active,
          created_at,
          budget_items (
            id,
            planned_amount
          )
        `)
        .eq("user_id", userId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Falling back to query without budget_items join:", err);
      const { data, error } = await supabase
        .from("budgets")
        .select("id, user_id, name, start_date, end_date, total_limit, is_active, created_at")
        .eq("user_id", userId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []).map((b) => ({ ...b, budget_items: [] }));
    }
  },

  getPreviousBudgetWithItems: async (
    userId: string,
    currentMonth: Date
  ): Promise<{
    budgetId: string;
    name: string;
    startDate: string;
    monthLabel: string;
    items: { category_id: string; amount: number }[];
  } | null> => {
    if (!userId) return null;
    const currentStart = new Date(
      Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    )
      .toISOString()
      .split("T")[0];

    try {
      const { data: pastBudgets, error: bErr } = await supabase
        .from("budgets")
        .select("id, name, start_date")
        .eq("user_id", userId)
        .lt("start_date", currentStart)
        .order("start_date", { ascending: false })
        .limit(10);

      if (bErr || !pastBudgets || pastBudgets.length === 0) return null;

      const budgetIds = pastBudgets.map((b) => b.id);
      const { data: allItems, error: iErr } = await supabase
        .from("budget_items")
        .select("budget_id, category_id, planned_amount")
        .in("budget_id", budgetIds)
        .gt("planned_amount", 0);

      if (iErr || !allItems || allItems.length === 0) return null;

      // Find the first past budget in descending order that has items
      for (const b of pastBudgets) {
        const itemsForBudget = allItems.filter((i) => i.budget_id === b.id);
        if (itemsForBudget.length > 0) {
          const d = new Date(b.start_date);
          const monthLabel = !isNaN(d.getTime())
            ? d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : b.name;

          return {
            budgetId: b.id,
            name: b.name,
            startDate: b.start_date,
            monthLabel,
            items: itemsForBudget.map((i) => ({
              category_id: i.category_id,
              amount: Math.round(i.planned_amount / 100),
            })),
          };
        }
      }

      return null;
    } catch (err) {
      console.error("Error fetching previous budget with items:", err);
      return null;
    }
  },
};

// API Key and AI Provider operations
export const aiConfigStorage = {
  getProvider: (): "openai" | "gemini" =>
    storage.get<any>(STORAGE_KEYS.AI_PROVIDER) || "openai",
  setProvider: (provider: "openai" | "gemini"): void =>
    storage.set(STORAGE_KEYS.AI_PROVIDER, provider),

  getOpenAIKey: (): string | null =>
    storage.get<string>(STORAGE_KEYS.OPENAI_KEY),
  setOpenAIKey: (key: string): void =>
    storage.set(STORAGE_KEYS.OPENAI_KEY, key),

  getGeminiKey: (): string | null =>
    storage.get<string>(STORAGE_KEYS.GEMINI_KEY),
  setGeminiKey: (key: string): void =>
    storage.set(STORAGE_KEYS.GEMINI_KEY, key),

  getActiveKey: (): string | null => {
    const provider = aiConfigStorage.getProvider();
    return provider === "gemini"
      ? aiConfigStorage.getGeminiKey()
      : aiConfigStorage.getOpenAIKey();
  },
};

// Beneficiary / Transfer Contacts operations
export const beneficiaryStorage = {
  getAll: async (userId: string): Promise<Beneficiary[]> => {
    const { data, error } = await supabase
      .from("beneficiaries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Beneficiary[]) || [];
  },

  create: async (
    payload: Omit<Beneficiary, "id" | "created_at" | "updated_at">
  ): Promise<Beneficiary> => {
    const { data, error } = await supabase
      .from("beneficiaries")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as Beneficiary;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("beneficiaries")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// Financial Goals operations
export const financialGoalsStorage = {
  getAll: async (userId: string): Promise<FinancialGoal[]> => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("financial_goals")
      .select("*")
      .eq("user_id", userId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching financial goals:", error);
      throw error;
    }

    return (data || []).map((goal: any) => ({
      id: goal.id,
      user_id: goal.user_id,
      name: goal.name,
      description: goal.description,
      target_amount: Number(goal.target_amount) / 100,
      current_amount: Number(goal.current_amount || 0) / 100,
      category: goal.category,
      target_date: goal.target_date,
      status: goal.status,
      priority: goal.priority ?? 0,
      created_at: goal.created_at,
      updated_at: goal.updated_at,
    }));
  },

  upsert: async (
    goal: Omit<FinancialGoal, "id" | "created_at" | "updated_at"> & { id?: string }
  ): Promise<FinancialGoal> => {
    const payload: any = {
      user_id: goal.user_id,
      name: goal.name,
      description: goal.description || null,
      target_amount: Math.round(Number(goal.target_amount) * 100),
      current_amount: Math.round(Number(goal.current_amount || 0) * 100),
      category: goal.category || "savings",
      target_date: goal.target_date,
      status: goal.status || "active",
      priority: goal.priority ?? 0,
      updated_at: new Date().toISOString(),
    };

    if (goal.id) {
      payload.id = goal.id;
    }

    const { data, error } = await supabase
      .from("financial_goals")
      .upsert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error saving financial goal:", error);
      throw error;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      description: data.description,
      target_amount: Number(data.target_amount) / 100,
      current_amount: Number(data.current_amount || 0) / 100,
      category: data.category,
      target_date: data.target_date,
      status: data.status,
      priority: data.priority ?? 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("financial_goals")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting financial goal:", error);
      throw error;
    }
  },
};

