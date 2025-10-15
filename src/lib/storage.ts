import { Category, FundSource, Transaction, User } from "@/types/finance";
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
      })) || []
    );
  },

  create: async (
    name: string,
    userId: string,
    type: "income" | "expense",
    parentId: string | null = null
  ): Promise<Category> => {
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, user_id: userId, type, parent_id: parentId }])
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
    };
  },

  update: async (id: string, updates: Partial<Category>): Promise<Category> => {
    const updatesForDb: any = {};
    if (updates.name) updatesForDb.name = updates.name;
    if (updates.type) updatesForDb.type = updates.type;
    if (updates.parentId !== undefined)
      updatesForDb.parent_id = updates.parentId;

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
      .eq("user_id", userId);
    if (error) throw error;

    return (
      data?.map((fundSource) => ({
        id: fundSource.id,
        name: fundSource.name,
        balance: fundSource.balance,
        userId: fundSource.user_id,
        createdAt: fundSource.created_at,
      })) || []
    );
  },

  create: async (
    name: string,
    balance: number,
    userId: string
  ): Promise<FundSource> => {
    const { data, error } = await supabase
      .from("fund_sources")
      .insert([{ name, balance, user_id: userId }])
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
    if (updates.name) updatesForDb.name = updates.name;
    if (updates.balance) updatesForDb.balance = updates.balance;

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
      })) || []
    );
  },

  create: async (
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Promise<Transaction> => {
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

      if (sourceFund.balance < transaction.amount) {
        throw new Error("Insufficient funds in the source account.");
      }
    }

    const { data: newTransaction, error } = await supabase
      .rpc("create_transaction_and_update_balance", {
        p_description: transaction.description,
        p_amount: transaction.amount,
        p_type: transaction.type,
        p_transaction_date: transaction.transactionDate,
        p_user_id: transaction.userId,
        p_category_id: transaction.categoryId ?? null,
        p_source_fund_id: transaction.sourceFundId ?? null,
        p_destination_fund_id: transaction.destinationFundId ?? null,
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
    };
  },

  update: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    // Memanggil RPC function yang baru dibuat
    const { data, error } = await supabase.rpc(
      "update_transaction_and_update_balance",
      {
        p_id: id,
        p_description: updates.description,
        p_amount: updates.amount,
        p_type: updates.type,
        p_transaction_date: updates.transactionDate,
        p_category_id: updates.categoryId,
        p_source_fund_id: updates.sourceFundId || null,
        p_destination_fund_id: updates.destinationFundId || null,
      }
    );

    if (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
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
