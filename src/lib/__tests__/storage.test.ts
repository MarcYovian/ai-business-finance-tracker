import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userStorage, categoryStorage, fundSourceStorage, transactionStorage, apiKeyStorage } from '@/lib/storage';
import { User, Category, FundSource, Transaction } from '@/types/finance';

describe('Storage functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  describe('userStorage', () => {
    it('creates and retrieves users', () => {
      const user = userStorage.create('test@example.com');
      
      expect(user.email).toBe('test@example.com');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      
      const users = userStorage.getAll();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('test@example.com');
    });

    it('finds user by email', () => {
      userStorage.create('test@example.com');
      const foundUser = userStorage.findByEmail('test@example.com');
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('test@example.com');
    });

    it('sets and gets current user', () => {
      const user = userStorage.create('test@example.com');
      userStorage.setCurrentUser(user);
      
      const currentUser = userStorage.getCurrentUser();
      expect(currentUser?.email).toBe('test@example.com');
    });
  });

  describe('categoryStorage', () => {
    it('creates and retrieves categories for user', () => {
      const user = userStorage.create('test@example.com');
      const category = categoryStorage.create('Food', user.id);
      
      expect(category.name).toBe('Food');
      expect(category.userId).toBe(user.id);
      
      const categories = categoryStorage.getAll(user.id);
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Food');
    });

    it('finds category by name', () => {
      const user = userStorage.create('test@example.com');
      categoryStorage.create('Food', user.id);
      
      const foundCategory = categoryStorage.findByName('Food', user.id);
      expect(foundCategory).toBeDefined();
      expect(foundCategory?.name).toBe('Food');
    });

    it('deletes category', () => {
      const user = userStorage.create('test@example.com');
      const category = categoryStorage.create('Food', user.id);
      
      let categories = categoryStorage.getAll(user.id);
      expect(categories).toHaveLength(1);
      
      categoryStorage.delete(category.id);
      categories = categoryStorage.getAll(user.id);
      expect(categories).toHaveLength(0);
    });
  });

  describe('fundSourceStorage', () => {
    it('creates and retrieves fund sources for user', () => {
      const user = userStorage.create('test@example.com');
      const fundSource = fundSourceStorage.create('Checking', 50000, user.id);
      
      expect(fundSource.name).toBe('Checking');
      expect(fundSource.balance).toBe(50000);
      expect(fundSource.userId).toBe(user.id);
      
      const sources = fundSourceStorage.getAll(user.id);
      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('Checking');
    });

    it('finds fund source by name', () => {
      const user = userStorage.create('test@example.com');
      fundSourceStorage.create('Checking', 50000, user.id);
      
      const foundSource = fundSourceStorage.findByName('Checking', user.id);
      expect(foundSource).toBeDefined();
      expect(foundSource?.name).toBe('Checking');
    });
  });

  describe('transactionStorage', () => {
    it('creates and retrieves transactions for user', () => {
      const user = userStorage.create('test@example.com');
      const transaction = transactionStorage.create({
        description: 'Lunch',
        amount: 1500,
        type: 'expense',
        transactionDate: new Date().toISOString(),
        userId: user.id
      });
      
      expect(transaction.description).toBe('Lunch');
      expect(transaction.amount).toBe(1500);
      expect(transaction.userId).toBe(user.id);
      
      const transactions = transactionStorage.getAll(user.id);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].description).toBe('Lunch');
    });

    it('updates transaction', () => {
      const user = userStorage.create('test@example.com');
      const transaction = transactionStorage.create({
        description: 'Lunch',
        amount: 1500,
        type: 'expense',
        transactionDate: new Date().toISOString(),
        userId: user.id
      });
      
      transactionStorage.update(transaction.id, {
        description: 'Dinner',
        amount: 3000
      });
      
      const updatedTransactions = transactionStorage.getAll(user.id);
      const updatedTransaction = updatedTransactions[0];
      expect(updatedTransaction.description).toBe('Dinner');
      expect(updatedTransaction.amount).toBe(3000);
    });

    it('deletes transaction', () => {
      const user = userStorage.create('test@example.com');
      const transaction = transactionStorage.create({
        description: 'Lunch',
        amount: 1500,
        type: 'expense',
        transactionDate: new Date().toISOString(),
        userId: user.id
      });
      
      let transactions = transactionStorage.getAll(user.id);
      expect(transactions).toHaveLength(1);
      
      transactionStorage.delete(transaction.id);
      transactions = transactionStorage.getAll(user.id);
      expect(transactions).toHaveLength(0);
    });
  });

  describe('apiKeyStorage', () => {
    it('sets and gets API key', () => {
      apiKeyStorage.set('test-api-key');
      const key = apiKeyStorage.get();
      
      expect(key).toBe('test-api-key');
    });

    it('removes API key', () => {
      apiKeyStorage.set('test-api-key');
      expect(apiKeyStorage.get()).toBe('test-api-key');
      
      apiKeyStorage.remove();
      expect(apiKeyStorage.get()).toBeNull();
    });
  });
});