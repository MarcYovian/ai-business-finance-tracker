export type TransactionType = "income" | "expense" | "transfer";

export interface TransactionDTO {
  id: string;
  description: string;
  amount: number; // Rupiah murni (e.g. 50000)
  type: TransactionType;
  transactionDate: string;
  createdAt: string;
  userId: string;
  categoryId?: string | null;
  sourceFundId?: string | null;
  destinationFundId?: string | null;
  fee?: number; // Rupiah murni (e.g. 2500)
  notes?: string | null;
  status?: string;
  parentTransactionId?: string | null;
}

export interface ListTransactionsFilter {
  limit?: number;
  offset?: number;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  sourceFundId?: string;
  destinationFundId?: string;
}

export interface CreateTransactionDTO {
  description: string;
  amount: number; // Rupiah murni
  type: TransactionType;
  transactionDate?: string;
  categoryId?: string | null;
  sourceFundId?: string | null;
  destinationFundId?: string | null;
  fee?: number; // Rupiah murni
  notes?: string | null;
}

export interface UpdateTransactionDTO {
  id: string;
  description?: string;
  amount?: number; // Rupiah murni
  type?: TransactionType;
  transactionDate?: string;
  categoryId?: string | null;
  sourceFundId?: string | null;
  destinationFundId?: string | null;
  fee?: number; // Rupiah murni
  notes?: string | null;
}

export interface ITransactionService {
  list(filter?: ListTransactionsFilter): Promise<TransactionDTO[]>;
  getById(id: string): Promise<TransactionDTO>;
  create(payload: CreateTransactionDTO): Promise<TransactionDTO>;
  update(payload: UpdateTransactionDTO): Promise<TransactionDTO>;
  delete(id: string): Promise<void>;
}
