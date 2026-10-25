export type TransactionType = "income" | "expense" | "transfer";
export type FundType = "bank" | "cash" | "credit_card" | "wallet" | "other";

export interface TransactionDTO {
  id: string;
  description: string;
  amount: number; // in normal Rupiah
  type: TransactionType;
  transactionDate: string;
  createdAt: string;
  userId: string;
  categoryId?: string | null;
  sourceFundId?: string | null;
  destinationFundId?: string | null;
  fee?: number;
  notes?: string | null;
  status?: string;
  parentTransactionId?: string | null;
}

export interface FundSourceDTO {
  id: string;
  userId: string;
  name: string;
  type: FundType;
  balance: number; // in normal Rupiah
  accountNumber?: string | null;
  accountHolderName?: string | null;
  colorTheme?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  userId: string;
  type: "income" | "expense";
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  isActive: boolean;
  createdAt: string;
}
