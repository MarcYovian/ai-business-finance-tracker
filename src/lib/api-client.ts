/**
 * Type-Safe API Client Layer for AI Business Finance Tracker
 * Conforming to RFC 7807 Problem Details and Single Source of Truth REST API (/api/v1/...)
 */

import type {
  TransactionDTO,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  ListTransactionsFilter,
} from "@/server/domain/transactions/transaction.types";
import type {
  FundSourceDTO,
  CreateFundSourceDTO,
  UpdateFundSourceDTO,
  BalanceSummaryDTO,
} from "@/server/domain/fund-sources/fund-source.types";
import type {
  CategoryDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryType,
} from "@/server/domain/categories/category.types";
import type {
  BudgetDTO,
  BudgetItemDTO,
  UpsertBudgetDTO,
  PreviousBudgetDTO,
} from "@/server/domain/budgets/budget.types";
import type {
  BeneficiaryDTO,
  CreateBeneficiaryDTO,
} from "@/server/domain/beneficiaries/beneficiary.types";
import type {
  FinancialGoalDTO,
  UpsertFinancialGoalDTO,
} from "@/server/domain/financial-goals/financial-goal.types";
import type {
  ChatMessage,
  ChatRequestDTO,
  ChatResponseDTO,
} from "@/server/domain/ai/ai-chat.service";

/**
 * Standard RFC 7807 Problem Details Error Class
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly title?: string;
  public readonly type?: string;
  public readonly instance?: string;

  constructor(
    message: string,
    status = 500,
    code = "API_ERROR",
    details?: unknown,
    title?: string,
    type?: string,
    instance?: string
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.title = title;
    this.type = type;
    this.instance = instance;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Resolves API Base URL and session headers for both browser client and RSC server prefetching
 */
async function resolveBaseUrlAndHeaders(): Promise<{
  baseUrl: string;
  headers: Record<string, string>;
}> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Browser Client or jsdom test runner
  if (typeof window !== "undefined") {
    const origin =
      typeof window.location !== "undefined" &&
      window.location.origin &&
      window.location.origin !== "null" &&
      !window.location.origin.startsWith("file:")
        ? window.location.origin
        : "http://127.0.0.1:3000";
    return { baseUrl: `${origin}/api/v1`, headers };
  }

  // Server-side (RSC or Server Action)
  try {
    const { cookies, headers: nextHeaders } = await import("next/headers");
    const cookieStore = await cookies();
    const headerList = await nextHeaders();
    const host = headerList.get("host") || "127.0.0.1:3000";
    const proto = headerList.get("x-forwarded-proto") || "http";
    const cookieString = cookieStore.toString();
    if (cookieString) {
      headers["Cookie"] = cookieString;
    }
    return { baseUrl: `${proto}://${host}/api/v1`, headers };
  } catch {
    const port = process.env.PORT || "3000";
    return { baseUrl: `http://127.0.0.1:${port}/api/v1`, headers };
  }
}

/**
 * Centralized fetch wrapper with credentials: 'include' and RFC 7807 error parsing
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { baseUrl, headers: defaultHeaders } = await resolveBaseUrlAndHeaders();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${baseUrl}${cleanPath}`;

  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers: mergedHeaders,
    credentials: "include",
    cache: "no-store",
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      body?.detail ||
      body?.error ||
      body?.message ||
      `Permintaan gagal dengan status ${response.status}: ${response.statusText}`;

    const code =
      body?.code ||
      (response.status === 401
        ? "UNAUTHORIZED"
        : response.status === 403
        ? "FORBIDDEN"
        : response.status === 404
        ? "NOT_FOUND"
        : response.status === 422
        ? "VALIDATION_ERROR"
        : "API_ERROR");

    throw new ApiClientError(
      message,
      response.status,
      code,
      body?.details,
      body?.title,
      body?.type,
      body?.instance
    );
  }

  // Next.js Route Handlers unwrap: return body.data if present
  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }

  return body as T;
}

export interface TransferPayload {
  fromFundId: string;
  toFundId: string;
  amount: number;
  fee?: number;
  description?: string;
  transactionDate?: string;
  notes?: string | null;
}

export const apiClient = {
  transactions: {
    list: async (filter: ListTransactionsFilter = {}): Promise<TransactionDTO[]> => {
      const params = new URLSearchParams();
      if (filter.type) params.set("type", filter.type);
      if (filter.categoryId) params.set("categoryId", filter.categoryId);
      if (filter.sourceFundId) params.set("sourceFundId", filter.sourceFundId);
      if (filter.destinationFundId) params.set("destinationFundId", filter.destinationFundId);
      if (filter.startDate) params.set("startDate", filter.startDate);
      if (filter.endDate) params.set("endDate", filter.endDate);
      if (filter.limit !== undefined) params.set("limit", String(filter.limit));
      if (filter.offset !== undefined) params.set("offset", String(filter.offset));

      const query = params.toString();
      return request<TransactionDTO[]>(`/transactions${query ? `?${query}` : ""}`);
    },

    getById: async (id: string): Promise<TransactionDTO> => {
      return request<TransactionDTO>(`/transactions/${id}`);
    },

    create: async (data: CreateTransactionDTO): Promise<TransactionDTO> => {
      return request<TransactionDTO>("/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: string,
      updates: Partial<CreateTransactionDTO> | Record<string, unknown>
    ): Promise<TransactionDTO> => {
      return request<TransactionDTO>(`/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return request<{ success: boolean; message?: string }>(`/transactions/${id}`, {
        method: "DELETE",
      });
    },

    transfer: async (payload: TransferPayload): Promise<TransactionDTO> => {
      return request<TransactionDTO>("/transactions/transfer", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },

  fundSources: {
    list: async (activeOnly?: boolean): Promise<FundSourceDTO[]> => {
      const query = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : "";
      return request<FundSourceDTO[]>(`/fund-sources${query}`);
    },

    getById: async (id: string): Promise<FundSourceDTO> => {
      return request<FundSourceDTO>(`/fund-sources/${id}`);
    },

    create: async (data: CreateFundSourceDTO): Promise<FundSourceDTO> => {
      return request<FundSourceDTO>("/fund-sources", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: string,
      updates: Partial<UpdateFundSourceDTO> | Record<string, unknown>
    ): Promise<FundSourceDTO> => {
      return request<FundSourceDTO>(`/fund-sources/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return request<{ success: boolean; message?: string }>(`/fund-sources/${id}`, {
        method: "DELETE",
      });
    },

    summary: async (): Promise<BalanceSummaryDTO> => {
      return request<BalanceSummaryDTO>("/fund-sources?summary=true");
    },
  },

  categories: {
    list: async (type?: CategoryType): Promise<CategoryDTO[]> => {
      const query = type ? `?type=${type}` : "";
      return request<CategoryDTO[]>(`/categories${query}`);
    },

    getById: async (id: string): Promise<CategoryDTO> => {
      return request<CategoryDTO>(`/categories/${id}`);
    },

    create: async (data: CreateCategoryDTO): Promise<CategoryDTO> => {
      return request<CategoryDTO>("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: string,
      updates: Partial<UpdateCategoryDTO> | Record<string, unknown>
    ): Promise<CategoryDTO> => {
      return request<CategoryDTO>(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return request<{ success: boolean; message?: string }>(`/categories/${id}`, {
        method: "DELETE",
      });
    },
  },

  budgets: {
    getCurrent: async (month?: string | Date): Promise<BudgetDTO> => {
      let monthStr: string | undefined;
      if (month instanceof Date) {
        monthStr = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1))
          .toISOString()
          .split("T")[0];
      } else if (typeof month === "string") {
        monthStr = month;
      }
      const query = monthStr ? `?month=${monthStr}` : "";
      return request<BudgetDTO>(`/budgets${query}`);
    },

    getDetails: async (budgetId: string): Promise<any[]> => {
      if (!budgetId) return [];
      return request<any[]>(`/budgets/details?budgetId=${budgetId}`);
    },

    getHistory: async (): Promise<BudgetDTO[]> => {
      return request<BudgetDTO[]>("/budgets?history=true");
    },

    getWithItems: async (): Promise<any[]> => {
      return request<any[]>("/budgets?withItems=true");
    },

    getPrevious: async (currentMonth?: string | Date): Promise<PreviousBudgetDTO | null> => {
      let monthStr: string | undefined;
      if (currentMonth instanceof Date) {
        monthStr = new Date(Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), 1))
          .toISOString()
          .split("T")[0];
      } else if (typeof currentMonth === "string") {
        monthStr = currentMonth;
      }
      const query = monthStr ? `?month=${monthStr}` : "";
      return request<PreviousBudgetDTO | null>(`/budgets/previous${query}`);
    },

    upsert: async (payload: UpsertBudgetDTO): Promise<BudgetDTO> => {
      return request<BudgetDTO>("/budgets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },

  beneficiaries: {
    list: async (): Promise<BeneficiaryDTO[]> => {
      return request<BeneficiaryDTO[]>("/beneficiaries");
    },

    getById: async (id: string): Promise<BeneficiaryDTO> => {
      return request<BeneficiaryDTO>(`/beneficiaries/${id}`);
    },

    create: async (payload: CreateBeneficiaryDTO): Promise<BeneficiaryDTO> => {
      return request<BeneficiaryDTO>("/beneficiaries", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return request<{ success: boolean; message?: string }>(`/beneficiaries/${id}`, {
        method: "DELETE",
      });
    },
  },

  financialGoals: {
    list: async (): Promise<FinancialGoalDTO[]> => {
      return request<FinancialGoalDTO[]>("/financial-goals");
    },

    getById: async (id: string): Promise<FinancialGoalDTO> => {
      return request<FinancialGoalDTO>(`/financial-goals/${id}`);
    },

    upsert: async (payload: UpsertFinancialGoalDTO): Promise<FinancialGoalDTO> => {
      return request<FinancialGoalDTO>("/financial-goals", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
      return request<{ success: boolean; message?: string }>(`/financial-goals/${id}`, {
        method: "DELETE",
      });
    },
  },

  ai: {
    chat: async (
      messagesOrPrompt: ChatMessage[] | string,
      context?: Record<string, any>
    ): Promise<ChatResponseDTO> => {
      const payload: ChatRequestDTO =
        typeof messagesOrPrompt === "string"
          ? { message: messagesOrPrompt, context }
          : { messages: messagesOrPrompt, context };

      return request<ChatResponseDTO>("/ai/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    insights: async (query?: string, month?: string): Promise<any> => {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (month) params.set("month", month);
      const queryString = params.toString();
      return request<any>(`/insights${queryString ? `?${queryString}` : ""}`);
    },
  },
};
