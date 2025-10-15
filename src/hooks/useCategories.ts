import { categoryStorage } from "@/lib/storage";
import { Category } from "@/types/finance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCategories = (userId: string, type?: "income" | "expense") => {
  return useQuery({
    queryKey: ["categories", userId, type],
    queryFn: () => categoryStorage.getAll(userId, type),
    enabled: !!userId,
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      userId,
      type,
      parentId,
    }: {
      name: string;
      userId: string;
      type: "income" | "expense";
      parentId?: string | null;
    }) => categoryStorage.create(name, userId, type, parentId || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      name,
      type,
      parentId,
    }: {
      id: string;
      name: string;
      type?: "income" | "expense";
      parentId?: string | null;
    }) => categoryStorage.update(id, { name, type, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryStorage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
