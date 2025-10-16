import { Category, FundSource, Transaction } from "@/types/finance";
import { cacheManager, getCacheKey, invalidateUserCache } from "@/utils/cache";
import { supabase } from "./supabase";

// Enhanced Category Storage with Caching
export const enhancedCategoryStorage = {
  getAll: async (
    userId: string,
    type?: "income" | "expense"
  ): Promise<Category[]> => {
    const cacheKey = getCacheKey.categories(userId) + (type ? `:${type}` : "");

    // Check cache first
    const cached = cacheManager.get<Category[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    let query = supabase.from("categories").select("*").eq("user_id", userId);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
    if (error) throw error;

    const categories =
      data?.map((category) => ({
        id: category.id,
        name: category.name,
        userId: category.user_id,
        createdAt: category.created_at,
        type: category.type,
        parentId: category.parent_id || null,
      })) || [];

    // Cache the result
    cacheManager.set(cacheKey, categories);

    return categories;
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
    const category = {
      id: result.id,
      name: result.name,
      userId: result.user_id,
      createdAt: result.created_at,
      type: result.type,
      parentId: result.parent_id || null,
    };

    // Invalidate cache
    cacheManager.invalidatePattern(`categories:${userId}`);

    return category;
  },

  findOrCreate: async (
    name: string,
    userId: string,
    type: "income" | "expense"
  ): Promise<Category> => {
    const categories = await enhancedCategoryStorage.getAll(userId, type);
    const existing = categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    return enhancedCategoryStorage.create(name, userId, type);
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

    const category = {
      id: data.id,
      name: data.name,
      userId: data.user_id,
      createdAt: data.created_at,
      type: data.type,
      parentId: data.parent_id || null,
    };

    // Invalidate cache
    cacheManager.invalidatePattern(`categories:${category.userId}`);

    return category;
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;

    // Invalidate cache
    cacheManager.invalidatePattern(`categories:${userId}`);
  },
};

// Enhanced Fund Source Storage with Caching
export const enhancedFundSourceStorage = {
  getAll: async (userId: string): Promise<FundSource[]> => {
    const cacheKey = getCacheKey.fundSources(userId);

    // Check cache first
    const cached = cacheManager.get<FundSource[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from("fund_sources")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;

    const fundSources =
      data?.map((fundSource) => ({
        id: fundSource.id,
        name: fundSource.name,
        balance: fundSource.balance,
        userId: fundSource.user_id,
        createdAt: fundSource.created_at,
      })) || [];

    // Cache the result
    cacheManager.set(cacheKey, fundSources);

    return fundSources;
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
    const fundSource = {
      id: result.id,
      name: result.name,
      balance: result.balance,
      userId: result.user_id,
      createdAt: result.created_at,
    };

    // Invalidate cache
    cacheManager.invalidatePattern(`fundSources:${userId}`);

    return fundSource;
  },

  findOrCreate: async (
    name: string,
    userId: string,
    initialBalance: number = 0
  ): Promise<FundSource> => {
    const fundSources = await enhancedFundSourceStorage.getAll(userId);
    const existing = fundSources.find(
      (f) => f.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    return enhancedFundSourceStorage.create(name, initialBalance, userId);
  },

  update: async (
    id: string,
    updates: Partial<FundSource>,
    userId: string
  ): Promise<void> => {
    const updatesForDb: { [key: string]: any } = {};
    if (updates.name) updatesForDb.name = updates.name;
    if (updates.balance !== undefined) updatesForDb.balance = updates.balance;

    const { error } = await supabase
      .from("fund_sources")
      .update(updatesForDb)
      .eq("id", id);
    if (error) throw error;

    // Invalidate cache
    cacheManager.invalidatePattern(`fundSources:${userId}`);
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const { error } = await supabase.from("fund_sources").delete().eq("id", id);
    if (error) throw error;

    // Invalidate cache
    cacheManager.invalidatePattern(`fundSources:${userId}`);
  },
};

// Enhanced Transaction Storage with Caching
export const enhancedTransactionStorage = {
  getAll: async (
    userId: string,
    useCache: boolean = true
  ): Promise<Transaction[]> => {
    const cacheKey = getCacheKey.transactions(userId);

    // Check cache first if enabled
    if (useCache) {
      const cached = cacheManager.get<Transaction[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false });
    if (error) throw error;

    const transactions =
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
      })) || [];

    // Cache the result with shorter duration (2 minutes for transactions)
    cacheManager.set(cacheKey, transactions, 2 * 60 * 1000);

    return transactions;
  },

  create: async (
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Promise<Transaction> => {
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

    // Invalidate relevant caches
    invalidateUserCache(transaction.userId);

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

  update: async (
    id: string,
    updates: Partial<Transaction>,
    userId: string
  ): Promise<void> => {
    const { error } = await supabase.rpc(
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

    // Invalidate relevant caches
    invalidateUserCache(userId);
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;

    // Invalidate relevant caches
    invalidateUserCache(userId);
  },
};
