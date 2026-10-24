import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { SupabaseClient } from '@supabase/supabase-js';
import { storage, userStorage, categoryStorage, fundSourceStorage, transactionStorage, aiConfigStorage, financialGoalsStorage } from '@/lib/storage';

// Mock the supabase client
vi.mock('@/lib/supabase', () => {
  const supabase = mockDeep<SupabaseClient>();
  return { supabase };
});

import { supabase } from '@/lib/supabase';

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

describe('Storage', () => {
  beforeEach(() => {
    mockReset(supabase);
    localStorageMock.clear();
  });

  describe('userStorage', () => {
    it('gets current user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const user = await userStorage.getCurrentUser();

      expect(user).toEqual({
        id: '123',
        email: 'test@example.com',
        createdAt: mockUser.created_at,
      });
    });
  });

  describe('categoryStorage', () => {
    it('creates a category', async () => {
      const mockCategory = { id: 'cat1', name: 'Food', user_id: 'user1', type: 'expense', created_at: new Date().toISOString() };
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [mockCategory], error: null }),
        }),
      });

      const category = await categoryStorage.create('Food', 'user1', 'expense', null);

      expect(category).toEqual({
        id: 'cat1',
        name: 'Food',
        userId: 'user1',
        type: 'expense',
        parentId: null,
        createdAt: mockCategory.created_at,
      });
    });

    it('creates a subcategory', async () => {
      const mockCategory = { 
        id: 'cat2', 
        name: 'Groceries', 
        user_id: 'user1', 
        type: 'expense',
        created_at: new Date().toISOString(), 
        parent_id: 'cat1' 
      };
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [mockCategory], error: null }),
        }),
      });

      const category = await categoryStorage.create('Groceries', 'user1', 'expense', 'cat1');

      expect(category).toEqual({
        id: 'cat2',
        name: 'Groceries',
        userId: 'user1',
        type: 'expense',
        parentId: 'cat1',
        createdAt: mockCategory.created_at,
      });
    });
  });

  describe('fundSourceStorage', () => {
    it('creates a fund source', async () => {
      const mockFundSource = { id: 'fs1', name: 'BCA', balance: 100000, user_id: 'user1', created_at: new Date().toISOString() };
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [mockFundSource], error: null }),
        }),
      });

      const fundSource = await fundSourceStorage.create('BCA', 100000, 'user1');

      expect(fundSource).toEqual({
        id: 'fs1',
        name: 'BCA',
        balance: 100000,
        userId: 'user1',
        createdAt: mockFundSource.created_at,
      });
    });
  });

  describe('transactionStorage', () => {
    it('creates a transaction', async () => {
      const mockTransaction = {
        id: 't1',
        description: 'Lunch',
        amount: 50000,
        type: 'expense' as const,
        transaction_date: new Date().toISOString(),
        user_id: 'user1',
        category_id: 'cat1',
        source_fund_id: 'fs1',
        destination_fund_id: null,
        created_at: new Date().toISOString(),
      };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { balance: 10000000 }, error: null }),
          }),
        }),
      });

      (supabase.rpc as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
        }),
      });

      const transaction = await transactionStorage.create({
        description: 'Lunch',
        amount: 50000,
        type: 'expense',
        transactionDate: mockTransaction.transaction_date,
        userId: 'user1',
        categoryId: 'cat1',
        fundSourceId: 'fs1',
      });

      expect(transaction).toEqual({
        id: 't1',
        description: 'Lunch',
        amount: 50000,
        type: 'expense',
        transactionDate: mockTransaction.transaction_date,
        userId: 'user1',
        categoryId: 'cat1',
        sourceFundId: 'fs1',
        destinationFundId: null,
        createdAt: mockTransaction.created_at,
      });
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
    it('fetches goals and converts cents to whole rupiah', async () => {
      const mockGoalsDb = [
        {
          id: 'goal-1',
          user_id: 'user-1',
          name: 'Dana Cadangan Kas',
          description: 'Emergency reserve',
          target_amount: 1000000000, // 10,000,000 in cents
          current_amount: 500000000, // 5,000,000 in cents
          category: 'savings',
          target_date: '2026-12-31',
          status: 'active',
          priority: 10,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockGoalsDb, error: null }),
            }),
          }),
        }),
      });

      const goals = await financialGoalsStorage.getAll('user-1');
      expect(goals).toHaveLength(1);
      expect(goals[0].target_amount).toBe(10000000);
      expect(goals[0].current_amount).toBe(5000000);
      expect(goals[0].name).toBe('Dana Cadangan Kas');
    });

    it('upserts a goal and converts whole rupiah to cents', async () => {
      const upsertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'goal-new',
              user_id: 'user-1',
              name: 'Investasi Mesin',
              description: null,
              target_amount: 5000000000, // 50m in cents
              current_amount: 1000000000, // 10m in cents
              category: 'investment',
              target_date: '2027-01-01',
              status: 'active',
              priority: 0,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        upsert: upsertMock,
      });

      const result = await financialGoalsStorage.upsert({
        user_id: 'user-1',
        name: 'Investasi Mesin',
        target_amount: 50000000,
        current_amount: 10000000,
        category: 'investment',
        target_date: '2027-01-01',
        status: 'active',
      });

      expect(upsertMock).toHaveBeenCalledWith([
        expect.objectContaining({
          target_amount: 5000000000,
          current_amount: 1000000000,
          category: 'investment',
        }),
      ]);
      expect(result.target_amount).toBe(50000000);
      expect(result.current_amount).toBe(10000000);
    });
  });
});
