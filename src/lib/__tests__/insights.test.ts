import { describe, it, expect } from 'vitest';
import { generateInsights } from '@/lib/insights';
import { Transaction, Category } from '@/types/finance';

describe('Insights generation', () => {
  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Food', userId: 'user1', createdAt: '2023-01-01' },
    { id: 'cat2', name: 'Office', userId: 'user1', createdAt: '2023-01-01' },
    { id: 'cat3', name: 'Travel', userId: 'user1', createdAt: '2023-01-01' },
  ];

  it('generates message when no transactions exist', () => {
    const insights = generateInsights([], mockCategories);
    expect(insights).toHaveLength(1);
    expect(insights[0].title).toBe('Get Started');
    expect(insights[0].type).toBe('trend');
  });

  it('identifies largest expense category', () => {
    const transactions: Transaction[] = [
      { id: 't1', description: 'Lunch', amount: 3000, type: 'expense', transactionDate: '2023-01-01', createdAt: '2023-01-01', userId: 'user1', categoryId: 'cat1' },
      { id: 't2', description: 'Dinner', amount: 5000, type: 'expense', transactionDate: '2023-01-02', createdAt: '2023-01-02', userId: 'user1', categoryId: 'cat1' },
      { id: 't3', description: 'Pens', amount: 2000, type: 'expense', transactionDate: '2023-01-03', createdAt: '2023-01-03', userId: 'user1', categoryId: 'cat2' },
    ];
    
    const insights = generateInsights(transactions, mockCategories);
    const biggestExpenseInsight = insights.find(i => i.title === 'Biggest Expense Category');
    
    expect(biggestExpenseInsight).toBeDefined();
    expect(biggestExpenseInsight?.description).toContain('Food');
    expect(biggestExpenseInsight?.description).toContain('$80.00');
  });

  it('reports when expenses exceed income', () => {
    const transactions: Transaction[] = [
      { id: 't1', description: 'Salary', amount: 50000, type: 'income', transactionDate: '2023-01-01', createdAt: '2023-01-01', userId: 'user1' },
      { id: 't2', description: 'Rent', amount: 60000, type: 'expense', transactionDate: '2023-01-02', createdAt: '2023-01-02', userId: 'user1' },
    ];
    
    const insights = generateInsights(transactions, mockCategories);
    const spendingExceedsInsight = insights.find(i => i.title === 'Spending Exceeds Income');
    
    expect(spendingExceedsInsight).toBeDefined();
    expect(spendingExceedsInsight?.type).toBe('expense');
  });

  it('reports positive financial health when income exceeds expenses', () => {
    const transactions: Transaction[] = [
      { id: 't1', description: 'Salary', amount: 80000, type: 'income', transactionDate: '2023-01-01', createdAt: '2023-01-01', userId: 'user1' },
      { id: 't2', description: 'Groceries', amount: 30000, type: 'expense', transactionDate: '2023-01-02', createdAt: '2023-01-02', userId: 'user1' },
    ];
    
    const insights = generateInsights(transactions, mockCategories);
    const positiveInsight = insights.find(i => i.title === 'Positive Financial Health');
    
    expect(positiveInsight).toBeDefined();
    expect(positiveInsight?.type).toBe('income');
  });

  it('identifies largest recent expense', () => {
    const transactions: Transaction[] = [
      { id: 't1', description: 'Coffee', amount: 500, type: 'expense', transactionDate: '2023-01-01', createdAt: '2023-01-01', userId: 'user1', categoryId: 'cat1' },
      { id: 't2', description: 'Dinner', amount: 8000, type: 'expense', transactionDate: '2023-01-02', createdAt: '2023-01-02', userId: 'user1', categoryId: 'cat1' },
      { id: 't3', description: 'Lunch', amount: 3000, type: 'expense', transactionDate: '2023-01-03', createdAt: '2023-01-03', userId: 'user1', categoryId: 'cat2' },
    ];
    
    const insights = generateInsights(transactions, mockCategories);
    const largestExpenseInsight = insights.find(i => i.title === 'Largest Recent Expense');
    
    expect(largestExpenseInsight).toBeDefined();
    expect(largestExpenseInsight?.description).toContain('$80.00');
    expect(largestExpenseInsight?.description).toContain('Dinner');
  });
});