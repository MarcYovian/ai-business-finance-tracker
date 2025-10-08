export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface FundSource {
  id: string;
  name: string;
  balance: number; // stored in cents
  userId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number; // stored in cents
  type: TransactionType;
  transactionDate: string;
  createdAt: string;
  userId: string;
  categoryId?: string;
  fundSourceId?: string;
}

export interface AIResponse {
  clarification_needed?: string;
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: string;
  category?: string;
  fundSource?: string;
}
