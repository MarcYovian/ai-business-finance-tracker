import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  storage,
  userStorage,
  categoryStorage,
  fundSourceStorage,
  transactionStorage,
  aiConfigStorage,
  financialGoalsStorage,
} from '@/lib/storage';
import { apiClient } from '@/lib/api-client';

// Mock the API client layer
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    categories: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    fundSources: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transactions: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transfer: vi.fn(),
    },
    budgets: {
      getCurrent: vi.fn(),
      getDetails: vi.fn(),
      getHistory: vi.fn(),
      getWithItems: vi.fn(),
      getPrevious: vi.fn(),
      upsert: vi.fn(),
    },
    beneficiaries: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    financialGoals: {
      list: vi.fn(),
      getById: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    ai: {
      chat: vi.fn(),
      insights: vi.fn(),
    },
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Storage (REST API Bridge)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('categoryStorage', () => {
    it('creates a category via apiClient', async () => {
      const mockCategory = {
        id: 'cat1',
        name: 'Food',
        userId: 'user1',
        type: 'expense' as const,
        parentId: null,
        color: null,
        icon: null,
        description: null,
        sortOrder: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      (apiClient.categories.create as any).mockResolvedValue(mockCategory);

      const category = await categoryStorage.create('Food', 'user1', 'expense', null);

      expect(apiClient.categories.create).toHaveBeenCalledWith({
        name: 'Food',
        type: 'expense',
        parentId: null,
        color: undefined,
        icon: undefined,
        description: undefined,
        sortOrder: undefined,
        isActive: true,
      });

      expect(category).toEqual({
        id: 'cat1',
        name: 'Food',
        userId: 'user1',
        type: 'expense',
        parentId: null,
        createdAt: mockCategory.createdAt,
        color: null,
        icon: null,
        description: null,
        sort_order: null,
        is_active: true,
      });
    });

    it('creates a subcategory via apiClient', async () => {
      const mockCategory = {
        id: 'cat2',
        name: 'Groceries',
        userId: 'user1',
        type: 'expense' as const,
        parentId: 'cat1',
        color: null,
        icon: null,
        description: null,
        sortOrder: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      (apiClient.categories.create as any).mockResolvedValue(mockCategory);

      const category = await categoryStorage.create('Groceries', 'user1', 'expense', 'cat1');

      expect(category).toEqual({
        id: 'cat2',
        name: 'Groceries',
        userId: 'user1',
        type: 'expense',
        parentId: 'cat1',
        createdAt: mockCategory.createdAt,
        color: null,
        icon: null,
        description: null,
        sort_order: null,
        is_active: true,
      });
    });
  });

  describe('fundSourceStorage', () => {
    it('creates a fund source via apiClient', async () => {
      const mockFundSource = {
        id: 'fs1',
        name: 'BCA',
        balance: 100000,
        userId: 'user1',
        type: 'bank' as const,
        createdAt: new Date().toISOString(),
        accountNumber: null,
        accountHolderName: null,
        cardExpiry: null,
        colorTheme: 'lime',
        isActive: true,
      };
      (apiClient.fundSources.create as any).mockResolvedValue(mockFundSource);

      const fundSource = await fundSourceStorage.create('BCA', 100000, 'user1');

      expect(apiClient.fundSources.create).toHaveBeenCalledWith({
        name: 'BCA',
        balance: 100000,
        type: 'bank',
        accountNumber: null,
        accountHolderName: null,
        cardExpiry: null,
        colorTheme: 'lime',
        isActive: true,
      });

      expect(fundSource.id).toBe('fs1');
      expect(fundSource.name).toBe('BCA');
      expect(fundSource.balance).toBe(100000);
    });
  });

  describe('transactionStorage', () => {
    it('creates a transaction via apiClient', async () => {
      const mockTransaction = {
        id: 't1',
        description: 'Lunch',
        amount: 50000,
        type: 'expense' as const,
        transactionDate: new Date().toISOString(),
        userId: 'user1',
        categoryId: 'cat1',
        sourceFundId: 'fs1',
        destinationFundId: null,
        fee: 0,
        notes: null,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      (apiClient.transactions.create as any).mockResolvedValue(mockTransaction);

      const transaction = await transactionStorage.create({
        description: 'Lunch',
        amount: 50000,
        type: 'expense',
        transactionDate: mockTransaction.transactionDate,
        userId: 'user1',
        categoryId: 'cat1',
        sourceFundId: 'fs1',
      });

      expect(apiClient.transactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Lunch',
          amount: 50000,
          type: 'expense',
        })
      );

      expect(transaction.id).toBe('t1');
      expect(transaction.amount).toBe(50000);
    });
  });

  describe('aiConfigStorage', () => {
    it('sets and gets provider', () => {
      aiConfigStorage.setProvider('gemini');
      expect(aiConfigStorage.getProvider()).toBe('gemini');
    });

    it('sets and gets OpenAI key', () => {
      aiConfigStorage.setOpenAIKey('test-key');
      expect(aiConfigStorage.getOpenAIKey()).toBe('test-key');
    });

    it('sets and gets Gemini key', () => {
      aiConfigStorage.setGeminiKey('test-key-2');
      expect(aiConfigStorage.getGeminiKey()).toBe('test-key-2');
    });

    it('gets active key', () => {
      aiConfigStorage.setProvider('openai');
      aiConfigStorage.setOpenAIKey('openai-key');
      aiConfigStorage.setGeminiKey('gemini-key');
      expect(aiConfigStorage.getActiveKey()).toBe('openai-key');

      aiConfigStorage.setProvider('gemini');
      expect(aiConfigStorage.getActiveKey()).toBe('gemini-key');
    });
  });

  describe('financialGoalsStorage', () => {
    it('fetches goals via apiClient', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          userId: 'user-1',
          name: 'Dana Cadangan Kas',
          description: 'Emergency reserve',
          targetAmount: 10000000,
          currentAmount: 5000000,
          category: 'savings',
          targetDate: '2026-12-31',
          status: 'active',
          priority: 10,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ];

      (apiClient.financialGoals.list as any).mockResolvedValue(mockGoals);

      const goals = await financialGoalsStorage.getAll('user-1');
      expect(goals).toHaveLength(1);
      expect(goals[0].target_amount).toBe(10000000);
      expect(goals[0].current_amount).toBe(5000000);
      expect(goals[0].name).toBe('Dana Cadangan Kas');
    });

    it('upserts a goal via apiClient', async () => {
      const mockResult = {
        id: 'goal-new',
        userId: 'user-1',
        name: 'Investasi Mesin',
        description: null,
        targetAmount: 50000000,
        currentAmount: 10000000,
        category: 'investment',
        targetDate: '2027-01-01',
        status: 'active',
        priority: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      (apiClient.financialGoals.upsert as any).mockResolvedValue(mockResult);

      const result = await financialGoalsStorage.upsert({
        user_id: 'user-1',
        name: 'Investasi Mesin',
        target_amount: 50000000,
        current_amount: 10000000,
        category: 'investment',
        target_date: '2027-01-01',
        status: 'active',
      });

      expect(apiClient.financialGoals.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Investasi Mesin',
          targetAmount: 50000000,
          currentAmount: 10000000,
        })
      );
      expect(result.target_amount).toBe(50000000);
      expect(result.current_amount).toBe(10000000);
    });
  });
});
