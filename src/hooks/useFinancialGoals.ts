import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialGoalsStorage } from '@/lib/storage';
import { FinancialGoal } from '@/types/finance';

export const useFinancialGoals = (userId?: string) => {
  return useQuery({
    queryKey: ['financialGoals', userId],
    queryFn: () => financialGoalsStorage.getAll(userId || ''),
    enabled: !!userId,
  });
};

export const useUpsertFinancialGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      goal: Omit<FinancialGoal, 'id' | 'created_at' | 'updated_at'> & { id?: string }
    ) => financialGoalsStorage.upsert(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
    },
  });
};

export const useDeleteFinancialGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financialGoalsStorage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
    },
  });
};
