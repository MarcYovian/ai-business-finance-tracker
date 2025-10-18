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
