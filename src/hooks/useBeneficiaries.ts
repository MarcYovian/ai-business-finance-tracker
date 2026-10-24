import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { beneficiaryStorage } from '@/lib/storage';
import { Beneficiary } from '@/types/finance';

export const useBeneficiaries = (userId: string) => {
  return useQuery({
    queryKey: ['beneficiaries', userId],
    queryFn: () => beneficiaryStorage.getAll(userId),
    enabled: !!userId,
  });
};

export const useAddBeneficiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<Beneficiary, 'id' | 'created_at' | 'updated_at'>) =>
      beneficiaryStorage.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
  });
};

export const useDeleteBeneficiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => beneficiaryStorage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
  });
};
