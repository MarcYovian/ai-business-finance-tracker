import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fundSourceStorage } from '@/lib/storage';
import { FundSource } from '@/types/finance';

export const useFundSources = (userId: string) => {
  return useQuery({
    queryKey: ['fundSources', userId],
    queryFn: () => fundSourceStorage.getAll(userId),
    enabled: !!userId,
  });
};

export const useAddFundSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      name,
      balance,
      userId,
      extra,
    }: {
      name: string;
      balance: number;
      userId: string;
      extra?: Partial<FundSource>;
    }) => fundSourceStorage.create(name, balance, userId, extra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundSources'] });
    },
  });
};

export const useUpdateFundSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FundSource> }) =>
      fundSourceStorage.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundSources'] });
    },
  });
};

export const useDeleteFundSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => fundSourceStorage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundSources'] });
    },
  });
};