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
import { apiClient } from "./api-client";

const STORAGE_KEYS = {
  OPENAI_KEY: "ai-fi-openai-key",
  GEMINI_KEY: "ai-fi-gemini-key",
  AI_PROVIDER: "ai-fi-provider",
};

// Generic storage utilities for localStorage (for API keys / client preferences)
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore localStorage errors
    }
  },

  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore localStorage errors
    }
  },
};

// User operations (using Supabase Auth client dynamically if needed)
export const userStorage = {
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { createClient } = await import("./supabase/client");
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return null;
      return {
        id: user.id,
        email: user.email || "",
        createdAt: user.created_at,
      };
    } catch {
      return null;
    }
  },
};

// Category operations via REST API Client
export const categoryStorage = {
  getAll: async (
    userId?: string,
    type?: "income" | "expense"
  ): Promise<Category[]> => {
    const categories = await apiClient.categories.list(type);
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      userId: c.userId || userId || "",
      createdAt: c.createdAt,
      type: c.type,
      parentId: c.parentId || null,
      color: c.color || null,
      icon: c.icon || null,
      description: c.description || null,
      sort_order: c.sortOrder ?? null,
      is_active: c.isActive ?? true,
    }));
  },

  create: async (
    name: string,
    userId: string,
    type: "income" | "expense",
    parentId: string | null = null,
    extra?: Partial<Category>
  ): Promise<Category> => {
    const result = await apiClient.categories.create({
      name,
      type,
      parentId: parentId || null,
      color: extra?.color,
      icon: extra?.icon,
      description: extra?.description,
      sortOrder: extra?.sort_order,
      isActive: extra?.is_active ?? true,
    });

    return {
      id: result.id,
      name: result.name,
      userId: result.userId || userId,
      createdAt: result.createdAt,
      type: result.type,
      parentId: result.parentId || null,
      color: result.color || null,
      icon: result.icon || null,
      description: result.description || null,
      sort_order: result.sortOrder ?? null,
      is_active: result.isActive ?? true,
    };
  },

  update: async (id: string, updates: Partial<Category>): Promise<Category> => {
    const result = await apiClient.categories.update(id, {
      name: updates.name,
      type: updates.type,
      parentId: updates.parentId !== undefined ? updates.parentId : undefined,
      color: updates.color !== undefined ? updates.color : undefined,
      icon: updates.icon !== undefined ? updates.icon : undefined,
      description: updates.description !== undefined ? updates.description : undefined,
      sortOrder: updates.sort_order !== undefined ? updates.sort_order : undefined,
      isActive: updates.is_active !== undefined ? updates.is_active : undefined,
    });

    return {
      id: result.id,
      name: result.name,
      userId: result.userId,
      createdAt: result.createdAt,
      type: result.type,
      parentId: result.parentId || null,
      color: result.color || null,
      icon: result.icon || null,
      description: result.description || null,
      sort_order: result.sortOrder ?? null,
      is_active: result.isActive ?? true,
    };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.categories.delete(id);
  },

  findByName: async (
    name: string,
    userId: string
  ): Promise<Category | undefined> => {
    const all = await categoryStorage.getAll(userId);
    return all.find((c) => c.name.toLowerCase() === name.toLowerCase());
  },
};

// Fund Source operations via REST API Client
export const fundSourceStorage = {
  getAll: async (userId?: string): Promise<FundSource[]> => {
    const sources = await apiClient.fundSources.list(false);
    return sources.map((f) => ({
      id: f.id,
      user_id: f.userId || userId || "",
      name: f.name,
      type: (f.type as any) || "bank",
      balance: f.balance,
      account_number: f.accountNumber || null,
      account_holder_name: f.accountHolderName || null,
      card_expiry: f.cardExpiry || null,
      color_theme: f.colorTheme || null,
      is_active: f.isActive ?? true,
      created_at: f.createdAt,
    }));
  },

  create: async (
    name: string,
    balance: number,
    userId: string,
    extra?: Partial<FundSource>
  ): Promise<FundSource> => {
    const result = await apiClient.fundSources.create({
      name,
      balance,
      type: (extra?.type as any) || "bank",
      accountNumber: extra?.account_number || null,
      accountHolderName: extra?.account_holder_name || null,
      cardExpiry: extra?.card_expiry || null,
      colorTheme: extra?.color_theme || "lime",
      isActive: extra?.is_active ?? true,
    });

    return {
      id: result.id,
      name: result.name,
      balance: result.balance,
      user_id: result.userId || userId,
      type: (result.type as any) || "bank",
      created_at: result.createdAt,
      account_number: result.accountNumber || null,
      account_holder_name: result.accountHolderName || null,
      card_expiry: result.cardExpiry || null,
      color_theme: result.colorTheme || null,
      is_active: result.isActive ?? true,
    };
  },

  update: async (id: string, updates: Partial<FundSource>): Promise<void> => {
    await apiClient.fundSources.update(id, {
      name: updates.name,
      balance: updates.balance,
      type: updates.type as any,
      accountNumber: updates.account_number,
      accountHolderName: updates.account_holder_name,
      cardExpiry: updates.card_expiry,
      colorTheme: updates.color_theme,
      isActive: updates.is_active,
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.fundSources.delete(id);
  },

  findByName: async (
    name: string,
    userId: string
  ): Promise<FundSource | undefined> => {
    const all = await fundSourceStorage.getAll(userId);
    return all.find((f) => f.name.toLowerCase() === name.toLowerCase());
  },
};

// Transaction operations via REST API Client
export const transactionStorage = {
  getAll: async (userId?: string): Promise<Transaction[]> => {
    const list = await apiClient.transactions.list({ limit: 1000 });
    return list.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type,
      transactionDate: t.transactionDate,
      createdAt: t.createdAt,
      userId: t.userId || userId || "",
      categoryId: t.categoryId || undefined,
      sourceFundId: t.sourceFundId || undefined,
      destinationFundId: t.destinationFundId || undefined,
      fee: t.fee,
      notes: t.notes || null,
      status: (t.status as any) || "completed",
      parentTransactionId: t.parentTransactionId || undefined,
    }));
  },

  create: async (
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Promise<Transaction> => {
    const result = await apiClient.transactions.create({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      transactionDate: transaction.transactionDate,
      categoryId: transaction.categoryId || null,
      sourceFundId: transaction.sourceFundId || null,
      destinationFundId: transaction.destinationFundId || null,
      fee: transaction.fee,
      notes: transaction.notes || null,
    });

    return {
      id: result.id,
      description: result.description,
      amount: result.amount,
      type: result.type,
      transactionDate: result.transactionDate,
      createdAt: result.createdAt,
      userId: result.userId,
      categoryId: result.categoryId || undefined,
      sourceFundId: result.sourceFundId || undefined,
      destinationFundId: result.destinationFundId || undefined,
      fee: result.fee,
      notes: result.notes || null,
      status: (result.status as any) || "completed",
      parentTransactionId: result.parentTransactionId || undefined,
    };
  },

  update: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    await apiClient.transactions.update(id, {
      description: updates.description,
      amount: updates.amount,
      type: updates.type,
      transactionDate: updates.transactionDate,
      categoryId: updates.categoryId,
      sourceFundId: updates.sourceFundId,
      destinationFundId: updates.destinationFundId,
      fee: updates.fee,
      notes: updates.notes,
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.transactions.delete(id);
  },

  createTransfer: async (
    fromFundId: string,
    toFundId: string,
    amount: number,
    fee: number
  ): Promise<void> => {
    await apiClient.transactions.transfer({
      fromFundId,
      toFundId,
      amount,
      fee,
    });
  },
};

type UpsertBudgetStoragePayload = Omit<Budget, "id" | "created_at"> & {
  items: Pick<BudgetItem, "category_id" | "amount">[];
};

export const budgetStorage = {
  upsert: async (payload: UpsertBudgetStoragePayload): Promise<void> => {
    await apiClient.budgets.upsert({
      name: payload.name,
      startDate: payload.start_date,
      endDate: payload.end_date,
      items: payload.items.map((item) => ({
        categoryId: item.category_id,
        amount: item.amount,
      })),
    });
  },

  getOrCreateForMonth: async (
    userId: string,
    month: Date
  ): Promise<Budget | null> => {
    const result = await apiClient.budgets.getCurrent(month);
    if (!result) return null;
    return {
      id: result.id,
      user_id: result.userId || userId,
      name: result.name,
      start_date: result.startDate,
      end_date: result.endDate,
      created_at: result.createdAt || "",
    };
  },

  getDetails: async (
    budgetId: string | null | undefined
  ): Promise<BudgetDetail[]> => {
    if (!budgetId) return [];
    const details = await apiClient.budgets.getDetails(budgetId);
    return (details || []).map((row: any) => ({
      id: row.id,
      category_id: row.category_id || row.categoryId,
      category_name: row.category_name || row.categoryName || "",
      category_icon: row.category_icon || row.categoryIcon || "",
      amount: row.amount !== undefined ? row.amount : (row.plannedAmount ? row.plannedAmount * 100 : 0),
      spent: row.spent !== undefined ? row.spent : (row.spentAmount ? row.spentAmount * 100 : 0),
    }));
  },

  getBudgetsWithItems: async (userId?: string): Promise<any[]> => {
    return apiClient.budgets.getWithItems();
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
    return apiClient.budgets.getPrevious(currentMonth);
  },
};

// API Key and AI Provider operations (LocalStorage)
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

// Beneficiary operations via REST API Client
export const beneficiaryStorage = {
  getAll: async (userId?: string): Promise<Beneficiary[]> => {
    const list = await apiClient.beneficiaries.list();
    return list.map((b) => ({
      id: b.id,
      user_id: b.userId || b.user_id || userId || "",
      name: b.name,
      bank_name: b.bankName || b.bank_name,
      account_number: b.accountNumber || b.account_number,
      account_type: (b.accountType || b.account_type) as any,
      notes: b.notes || null,
      created_at: b.createdAt || b.created_at,
      updated_at: b.updatedAt || b.updated_at || b.createdAt || b.created_at,
    }));
  },

  create: async (
    payload: Omit<Beneficiary, "id" | "created_at" | "updated_at">
  ): Promise<Beneficiary> => {
    const result = await apiClient.beneficiaries.create({
      name: payload.name,
      bankName: payload.bank_name,
      accountNumber: payload.account_number,
      accountType: payload.account_type as any,
      notes: payload.notes || undefined,
    });

    return {
      id: result.id,
      user_id: result.userId || result.user_id,
      name: result.name,
      bank_name: result.bankName || result.bank_name,
      account_number: result.accountNumber || result.account_number,
      account_type: (result.accountType || result.account_type) as any,
      notes: result.notes || null,
      created_at: result.createdAt || result.created_at,
      updated_at: result.updatedAt || result.updated_at || result.createdAt,
    };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.beneficiaries.delete(id);
  },
};

// Financial Goals operations via REST API Client
export const financialGoalsStorage = {
  getAll: async (userId?: string): Promise<FinancialGoal[]> => {
    const list = await apiClient.financialGoals.list();
    return list.map((g) => ({
      id: g.id,
      user_id: g.userId || g.user_id || userId || "",
      name: g.name,
      description: g.description || null,
      target_amount: g.targetAmount ?? g.target_amount,
      current_amount: g.currentAmount ?? g.current_amount ?? 0,
      category: g.category as any,
      target_date: g.targetDate || g.target_date,
      status: g.status as any,
      priority: g.priority ?? 0,
      created_at: g.createdAt || g.created_at,
      updated_at: g.updatedAt || g.updated_at,
    }));
  },

  upsert: async (
    goal: Omit<FinancialGoal, "id" | "created_at" | "updated_at"> & { id?: string }
  ): Promise<FinancialGoal> => {
    const result = await apiClient.financialGoals.upsert({
      id: goal.id,
      name: goal.name,
      description: goal.description,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      category: goal.category,
      targetDate: goal.target_date,
      status: goal.status,
      priority: goal.priority,
    });

    return {
      id: result.id,
      user_id: result.userId || result.user_id,
      name: result.name,
      description: result.description,
      target_amount: result.targetAmount ?? result.target_amount,
      current_amount: result.currentAmount ?? result.current_amount ?? 0,
      category: result.category as any,
      target_date: result.targetDate || result.target_date,
      status: result.status as any,
      priority: result.priority ?? 0,
      created_at: result.createdAt || result.created_at,
      updated_at: result.updatedAt || result.updated_at,
    };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.financialGoals.delete(id);
  },
};
