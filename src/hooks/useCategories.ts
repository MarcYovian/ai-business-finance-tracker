import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryStorage } from '@/lib/storage';
import { Category } from '@/types/finance';

export const useCategories = (userId: string) => {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: () => categoryStorage.getAll(userId),
    enabled: !!userId,
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name, userId }: { name: string; userId: string }) =>
      categoryStorage.create(name, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      categoryStorage.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => categoryStorage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};