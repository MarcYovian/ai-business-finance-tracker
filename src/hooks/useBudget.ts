import { useMemo } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { budgetStorage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { Budget, BudgetDetail, BudgetItem } from "@/types/finance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get the authenticated user
const useUser = () => {
  const { user } = useAuth();
  if (!user) throw new Error("User not authenticated");
  return user;
};

// ========== FETCH HOOKS ==========

export interface MonthlyBudgetInfo {
  limit: number; // in whole Rupiah
  source: "current" | "previous" | "none";
  budgetName?: string;
  sourceMonth?: string;
  isLoading: boolean;
}

/**
 * Fetches the effective monthly budget limit for the user:
 * 1. Checks current calendar month budget (start_date starts with current YYYY-MM).
 * 2. If not found or limit is 0, falls back to the most recent previous month budget.
 * 3. If the user is new / has never set any budget, defaults to 0.
 */
export const useMonthlyBudgetLimit = (userId?: string) => {
  const query = useQuery({
    queryKey: ["budgets", userId, "monthlyLimit"],
    queryFn: () => (userId ? budgetStorage.getBudgetsWithItems(userId) : Promise.resolve([])),
    enabled: !!userId,
  });

  const budgetInfo = useMemo<MonthlyBudgetInfo>(() => {
    if (!query.data || query.data.length === 0) {
      return {
        limit: 0,
        source: "none",
        isLoading: query.isLoading,
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    const currentMonthPrefix = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;

    const calculateBudgetLimitInRupiah = (b: any): number => {
      let limitInCents = 0;
      if (b.budget_items && Array.isArray(b.budget_items) && b.budget_items.length > 0) {
        const sumItems = b.budget_items.reduce(
          (sum: number, item: { planned_amount?: number }) => sum + (item.planned_amount || 0),
          0
        );
        if (sumItems > 0) {
          limitInCents = sumItems;
        }
      }
      if (limitInCents === 0 && b.total_limit && b.total_limit > 1) {
        limitInCents = b.total_limit;
      }
      return Math.round(limitInCents / 100);
    };

    // 1. Cek budget bulan berjalan
    const currentBudget = query.data.find((b: any) => {
      if (!b.start_date) return false;
      return b.start_date.startsWith(currentMonthPrefix);
    });

    if (currentBudget) {
      const currentLimit = calculateBudgetLimitInRupiah(currentBudget);
      if (currentLimit > 0) {
        return {
          limit: currentLimit,
          source: "current",
          budgetName: currentBudget.name,
          isLoading: false,
        };
      }
    }

    // 2. Jika budget bulan berjalan belum ada atau masih 0, cari bulan-bulan sebelumnya
    const previousBudgets = query.data
      .filter((b: any) => {
        if (!b.start_date) return false;
        return b.start_date < `${currentMonthPrefix}-01`;
      })
      .sort((a: any, b: any) => b.start_date.localeCompare(a.start_date));

    for (const prev of previousBudgets) {
      const prevLimit = calculateBudgetLimitInRupiah(prev);
      if (prevLimit > 0) {
        const d = new Date(prev.start_date);
        const sourceMonth = !isNaN(d.getTime())
          ? d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
          : undefined;

        return {
          limit: prevLimit,
          source: "previous",
          budgetName: prev.name,
          sourceMonth,
          isLoading: false,
        };
      }
    }

    // 3. Jika pengguna baru dan belum ada budget sama sekali, default ke 0
    return {
      limit: 0,
      source: "none",
      isLoading: false,
    };
  }, [query.data, query.isLoading]);

  return budgetInfo;
};

/**
 * Fetches the detailed items for a specific budget, including spent amounts.
 * This hook relies on the get_budget_details PostgreSQL RPC function.
 */
export const useBudgetDetails = (budgetId: string | null | undefined) => {
  return useQuery<BudgetDetail[], Error>({
    queryKey: ["budgetDetails", budgetId],
    queryFn: () => budgetStorage.getDetails(budgetId),
    enabled: !!budgetId, // Only run query if budgetId is available
  });
};

export const useCurrentBudget = (month: Date) => {
  const user = useUser();
  const startDate = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1))
    .toISOString()
    .split("T")[0];

  return useQuery<Budget | null, Error>({
    queryKey: ["currentBudget", user.id, startDate],
    queryFn: () => budgetStorage.getOrCreateForMonth(user.id, month),
  });
};

// ========== MUTATION HOOKS ==========

type UpsertBudgetPayload = Omit<Budget, "id" | "user_id" | "created_at"> & {
  items: Pick<BudgetItem, "category_id" | "amount">[];
};

/**
 * Mutation to create or update a budget for a given period.
 * It performs an upsert for the budget and its items.
 */
export const useUpsertBudget = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: async (payload: UpsertBudgetPayload) => {
      // Step 1: Upsert the budget period to get its ID
      await budgetStorage.upsert({
        ...payload,
        user_id: user.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your budget has been saved successfully.",
      });
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budgetDetails"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save budget: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
