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
    
    return data?.map(category => ({
      id: category.id,
      name: category.name,
      userId: category.user_id,
      createdAt: category.created_at,
    })) || [];
  },

  create: async (name: string, userId: string): Promise<Category> => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, user_id: userId }])
      .select();
    if (error) throw error;
    
    const result = data[0];
    return {
      id: result.id,
      name: result.name,
      userId: result.user_id,
      createdAt: result.created_at,
    };
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
    
    if (data && data[0]) {
      const category = data[0];
      return {
        id: category.id,
        name: category.name,
        userId: category.user_id,
        createdAt: category.created_at,
      };
    }
    return undefined;
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
    
    return data?.map(fundSource => ({
      id: fundSource.id,
      name: fundSource.name,
      balance: fundSource.balance,
      userId: fundSource.user_id,
      createdAt: fundSource.created_at,
    })) || [];
  },

  create: async (name: string, balance: number, userId: string): Promise<FundSource> => {
    const { data, error } = await supabase
      .from('fund_sources')
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
      .from('fund_sources')
      .update(updatesForDb)
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
      .from('transactions')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    
    return data?.map(transaction => ({
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
  },

  create: async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const transactionForDb = {
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      transaction_date: transaction.transactionDate,
      user_id: transaction.userId,
      category_id: transaction.categoryId,
      source_fund_id: transaction.sourceFundId,
      destination_fund_id: transaction.destinationFundId,
    };
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionForDb])
      .select();
    if (error) throw error;
    
    const result = data[0];
    return {
      id: result.id,
      description: result.description,
      amount: result.amount,
      type: result.type,
      transactionDate: result.transaction_date,
      createdAt: result.created_at,
      userId: result.user_id,
      categoryId: result.category_id,
      sourceFundId: result.source_fund_id,
      destinationFundId: result.destination_fund_id,
    };
  },

  update: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const updatesForDb: { [key: string]: any } = {};
    if (updates.description) updatesForDb.description = updates.description;
    if (updates.amount) updatesForDb.amount = updates.amount;
    if (updates.type) updatesForDb.type = updates.type;
    if (updates.transactionDate) updatesForDb.transaction_date = updates.transactionDate;
    if (updates.categoryId) updatesForDb.category_id = updates.categoryId;
    if (updates.sourceFundId) updatesForDb.source_fund_id = updates.sourceFundId;
    if (updates.destinationFundId) updatesForDb.destination_fund_id = updates.destinationFundId;

    const { error } = await supabase
      .from('transactions')
      .update(updatesForDb)
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

    const transactions = [
      {
        description: `Transfer to ${toFundSource.name}`,
        amount: amount,
        type: 'expense' as const,
        transactionDate: new Date().toISOString(),
        userId: user.id,
        sourceFundId: fromFundId,
        destinationFundId: toFundId,
      },
      {
        description: `Transfer from ${fromFundSource.name}`,
        amount: amount,
        type: 'income' as const,
        transactionDate: new Date().toISOString(),
        userId: user.id,
        sourceFundId: fromFundId,
        destinationFundId: toFundId,
      },
    ];

    if (fee > 0) {
      transactions.push({
        description: 'Transfer fee',
        amount: fee,
        type: 'expense' as const,
        transactionDate: new Date().toISOString(),
        userId: user.id,
        sourceFundId: fromFundId,
        destinationFundId: toFundId,
      });
    }

    const transactionsToCreate = transactions.map(t => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      transaction_date: t.transactionDate,
      user_id: t.userId,
      source_fund_id: t.sourceFundId,
      destination_fund_id: t.destinationFundId,
    }));

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
  getProvider: (): 'openai' | 'gemini' => 
    storage.get<any>(STORAGE_KEYS.AI_PROVIDER) || 'openai',
  setProvider: (provider: 'openai' | 'gemini'): void => 
    storage.set(STORAGE_KEYS.AI_PROVIDER, provider),

  getOpenAIKey: (): string | null => storage.get<string>(STORAGE_KEYS.OPENAI_KEY),
  setOpenAIKey: (key: string): void => storage.set(STORAGE_KEYS.OPENAI_KEY, key),

  getGeminiKey: (): string | null => storage.get<string>(STORAGE_KEYS.GEMINI_KEY),
  setGeminiKey: (key: string): void => storage.set(STORAGE_KEYS.GEMINI_KEY, key),

  getActiveKey: (): string | null => {
    const provider = aiConfigStorage.getProvider();
    return provider === 'gemini' 
      ? aiConfigStorage.getGeminiKey() 
      : aiConfigStorage.getOpenAIKey();
  }
};