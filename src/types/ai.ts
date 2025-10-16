import { Transaction } from "./finance";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    processingTime?: number;
  };
}

export interface ConversationContext {
  messages: Message[];
  pendingTransaction?: PendingTransaction;
  lastIntent?: string;
  userPreferences?: {
    defaultFundSource?: string;
    defaultCategory?: string;
  };
}

export interface PendingTransaction {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  date: string;
  category?: string;
  fundSource?: string;
  sourceFund?: string;
  destinationFund?: string;
  confidence: number;
  needsConfirmation: boolean;
}

export interface AIClassification {
  intent: string;
  confidence: number;
  query?: string;
  queryType?: string;
  entities?: {
    amount?: number;
    category?: string;
    fundSource?: string;
    date?: string;
    type?: string;
  };
}

export interface AITransactionResponse {
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  date: string;
  category?: string;
  fundSource?: string;
  sourceFund?: string;
  destinationFund?: string;
  confidence: number;
  missingFields?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface QueryResult {
  type: string;
  data: any;
  summary: string;
  visualizationData?: any;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface AIRequestOptions {
  maxRetries?: number;
  timeout?: number;
  includeContext?: boolean;
}

export interface PromptTemplate {
  system: string;
  user: string;
  examples?: Array<{
    user: string;
    assistant: string;
  }>;
}
