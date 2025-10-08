import { supabase } from './supabase';
import { Category, FundSource, Transaction, User } from "@/types/finance";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || '',
      createdAt: user.created_at,
    };
  },

  // signIn, signUp, signOut will be handled directly in components/AuthContext
};

// Category operations
export const categoryStorage = {
  getAll: async (userId: string): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  create: async (name: string, userId: string): Promise<Category> => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, user_id: userId }])
      .select();
    if (error) throw error;
    return data[0];
  },

  update: async (id: string, name: string): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  findByName: async (name: string, userId: string): Promise<Category | undefined> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', name)
      .limit(1);
    if (error) throw error;
    return data?.[0];
  },
};

// Fund Source operations
export const fundSourceStorage = {
  getAll: async (userId: string): Promise<FundSource[]> => {
    const { data, error } = await supabase
      .from('fund_sources')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  create: async (name: string, balance: number, userId: string): Promise<FundSource> => {
    const { data, error } = await supabase
      .from('fund_sources')
      .insert([{ name, balance, user_id: userId }])
      .select();
    if (error) throw error;
    return data[0];
  },

  update: async (id: string, updates: Partial<FundSource>): Promise<void> => {
    const { error } = await supabase
      .from('fund_sources')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('fund_sources').delete().eq('id', id);
    if (error) throw error;
  },

  findByName: async (name: string, userId: string): Promise<FundSource | undefined> => {
    const { data, error } = await supabase
      .from('fund_sources')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', name)
      .limit(1);
    if (error) throw error;
    return data?.[0];
  },
};

// Transaction operations
export const transactionStorage = {
  getAll: async (userId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  create: async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select();
    if (error) throw error;
    return data[0];
  },

  update: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  createTransfer: async (fromFundId: string, toFundId: string, amount: number, fee: number): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: fromFundSource, error: fromError } = await supabase.from('fund_sources').select('name, balance').eq('id', fromFundId).single();
    if (fromError || !fromFundSource) throw new Error("Source fund not found");

    const { data: toFundSource, error: toError } = await supabase.from('fund_sources').select('name, balance').eq('id', toFundId).single();
    if (toError || !toFundSource) throw new Error("Destination fund not found");

    const totalExpense = amount + fee;
    if (fromFundSource.balance < totalExpense) {
      throw new Error("Insufficient funds for transfer");
    }

    const transactionsToCreate = [
      {
        description: `Transfer to ${toFundSource.name}`,
        amount: amount,
        type: 'expense',
        transaction_date: new Date().toISOString(),
        user_id: user.id,
        fund_source_id: fromFundId,
      },
      {
        description: `Transfer from ${fromFundSource.name}`,
        amount: amount,
        type: 'income',
        transaction_date: new Date().toISOString(),
        user_id: user.id,
        fund_source_id: toFundId,
      },
    ];

    if (fee > 0) {
      transactionsToCreate.push({
        description: 'Transfer fee',
        amount: fee,
        type: 'expense',
        transaction_date: new Date().toISOString(),
        user_id: user.id,
        fund_source_id: fromFundId,
      });
    }

    const { error: transactionError } = await supabase.from('transactions').insert(transactionsToCreate);
    if (transactionError) throw transactionError;

    const newFromBalance = fromFundSource.balance - totalExpense;
    const newToBalance = toFundSource.balance + amount;

    await fundSourceStorage.update(fromFundId, { balance: newFromBalance });
    await fundSourceStorage.update(toFundId, { balance: newToBalance });
  },
};

// API Key and AI Provider operations
export const aiConfigStorage = {
  // AI Provider
  getProvider: (): 'openai' | 'gemini' => 
    storage.get<any>(STORAGE_KEYS.AI_PROVIDER) || 'openai',
  setProvider: (provider: 'openai' | 'gemini'): void => 
    storage.set(STORAGE_KEYS.AI_PROVIDER, provider),

  // OpenAI Key
  getOpenAIKey: (): string | null => storage.get<string>(STORAGE_KEYS.OPENAI_KEY),
  setOpenAIKey: (key: string): void => storage.set(STORAGE_KEYS.OPENAI_KEY, key),

  // Gemini Key
  getGeminiKey: (): string | null => storage.get<string>(STORAGE_KEYS.GEMINI_KEY),
  setGeminiKey: (key: string): void => storage.set(STORAGE_KEYS.GEMINI_KEY, key),

  // Get key for the active provider
  getActiveKey: (): string | null => {
    const provider = aiConfigStorage.getProvider();
    return provider === 'gemini' 
      ? aiConfigStorage.getGeminiKey() 
      : aiConfigStorage.getOpenAIKey();
  }
};