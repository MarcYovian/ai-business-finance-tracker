import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
 * Fetches all budget periods for the current user.
 */
export const useBudgets = () => {
  const user = useUser();
  return useQuery<Budget[], Error>({
    queryKey: ["budgets", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

/**
 * Fetches the detailed items for a specific budget, including spent amounts.
 * This hook relies on the get_budget_details PostgreSQL RPC function.
 */
export const useBudgetDetails = (budgetId: string | null | undefined) => {
  return useQuery<BudgetDetail[], Error>({
    queryKey: ["budgetDetails", budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      const { data, error } = await supabase.rpc("get_budget_details", {
        p_budget_id: budgetId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!budgetId, // Only run query if budgetId is available
  });
};

// ========== MUTATION HOOKS ==========

interface UpsertBudgetPayload {
  name: string;
  startDate: string;
  endDate: string;
  items: { category_id: string; amount: number }[];
}

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
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .upsert(
          {
            user_id: user.id,
            start_date: payload.startDate,
            end_date: payload.endDate,
            name: payload.name,
          },
          { onConflict: "user_id, start_date, end_date" }
        )
        .select("id")
        .single();

      if (budgetError) throw budgetError;
      const budgetId = budgetData.id;

      // Step 2: Prepare and upsert budget items
      const budgetItemsToUpsert = payload.items
        .filter((item) => item.amount > 0)
        .map((item) => ({
          budget_id: budgetId,
          category_id: item.category_id,
          amount: Math.round(item.amount * 100), // Convert to cents
        }));

      if (budgetItemsToUpsert.length > 0) {
        const { error: itemsError } = await supabase
          .from("budget_items")
          .upsert(budgetItemsToUpsert, {
            onConflict: "budget_id, category_id",
          });

        if (itemsError) throw itemsError;
      }

      return null;
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
