import { User, Category, FundSource, Transaction } from '@/types/finance';

const STORAGE_KEYS = {
  USERS: 'ai-fi-users',
  CURRENT_USER: 'ai-fi-current-user',
  CATEGORIES: 'ai-fi-categories',
  FUND_SOURCES: 'ai-fi-fund-sources',
  TRANSACTIONS: 'ai-fi-transactions',
  OPENAI_KEY: 'ai-fi-openai-key',
};

// Generic storage utilities
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

// User operations
export const userStorage = {
  getAll: (): User[] => storage.get<User[]>(STORAGE_KEYS.USERS) || [],
  
  findByEmail: (email: string): User | undefined => {
    const users = userStorage.getAll();
    return users.find(u => u.email === email);
  },
  
  create: (email: string): User => {
    const users = userStorage.getAll();
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  },
  
  getCurrentUser: (): User | null => storage.get<User>(STORAGE_KEYS.CURRENT_USER),
  
  setCurrentUser: (user: User | null): void => {
    if (user) {
      storage.set(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      storage.remove(STORAGE_KEYS.CURRENT_USER);
    }
  },
};

// Category operations
export const categoryStorage = {
  getAll: (userId: string): Category[] => {
    const categories = storage.get<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
    return categories.filter(c => c.userId === userId);
  },
  
  create: (name: string, userId: string): Category => {
    const categories = storage.get<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name,
      userId,
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.CATEGORIES, [...categories, newCategory]);
    return newCategory;
  },
  
  update: (id: string, name: string): void => {
    const categories = storage.get<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
    const updated = categories.map(c => c.id === id ? { ...c, name } : c);
    storage.set(STORAGE_KEYS.CATEGORIES, updated);
  },
  
  delete: (id: string): void => {
    const categories = storage.get<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
    storage.set(STORAGE_KEYS.CATEGORIES, categories.filter(c => c.id !== id));
  },
  
  findByName: (name: string, userId: string): Category | undefined => {
    const categories = categoryStorage.getAll(userId);
    return categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  },
};

// Fund Source operations
export const fundSourceStorage = {
  getAll: (userId: string): FundSource[] => {
    const sources = storage.get<FundSource[]>(STORAGE_KEYS.FUND_SOURCES) || [];
    return sources.filter(s => s.userId === userId);
  },
  
  create: (name: string, balance: number, userId: string): FundSource => {
    const sources = storage.get<FundSource[]>(STORAGE_KEYS.FUND_SOURCES) || [];
    const newSource: FundSource = {
      id: crypto.randomUUID(),
      name,
      balance,
      userId,
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.FUND_SOURCES, [...sources, newSource]);
    return newSource;
  },
  
  update: (id: string, updates: Partial<FundSource>): void => {
    const sources = storage.get<FundSource[]>(STORAGE_KEYS.FUND_SOURCES) || [];
    const updated = sources.map(s => s.id === id ? { ...s, ...updates } : s);
    storage.set(STORAGE_KEYS.FUND_SOURCES, updated);
  },
  
  delete: (id: string): void => {
    const sources = storage.get<FundSource[]>(STORAGE_KEYS.FUND_SOURCES) || [];
    storage.set(STORAGE_KEYS.FUND_SOURCES, sources.filter(s => s.id !== id));
  },
  
  findByName: (name: string, userId: string): FundSource | undefined => {
    const sources = fundSourceStorage.getAll(userId);
    return sources.find(s => s.name.toLowerCase() === name.toLowerCase());
  },
};

// Transaction operations
export const transactionStorage = {
  getAll: (userId: string): Transaction[] => {
    const transactions = storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    return transactions.filter(t => t.userId === userId);
  },
  
  create: (transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const transactions = storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.TRANSACTIONS, [...transactions, newTransaction]);
    return newTransaction;
  },
  
  update: (id: string, updates: Partial<Transaction>): void => {
    const transactions = storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    const updated = transactions.map(t => t.id === id ? { ...t, ...updates } : t);
    storage.set(STORAGE_KEYS.TRANSACTIONS, updated);
  },
  
  delete: (id: string): void => {
    const transactions = storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
    storage.set(STORAGE_KEYS.TRANSACTIONS, transactions.filter(t => t.id !== id));
  },
};

// OpenAI API Key operations
export const apiKeyStorage = {
  get: (): string | null => storage.get<string>(STORAGE_KEYS.OPENAI_KEY),
  set: (key: string): void => storage.set(STORAGE_KEYS.OPENAI_KEY, key),
  remove: (): void => storage.remove(STORAGE_KEYS.OPENAI_KEY),
};
