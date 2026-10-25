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
      color,
      icon,
      description,
      sort_order,
      is_active,
    }: {
      name: string;
      userId: string;
      type: "income" | "expense";
      parentId?: string | null;
      color?: string | null;
      icon?: string | null;
      description?: string | null;
      sort_order?: number | null;
      is_active?: boolean;
    }) =>
      categoryStorage.create(name, userId, type, parentId || null, {
        color,
        icon,
        description,
        sort_order,
        is_active,
      }),
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
      color,
      icon,
      description,
      sort_order,
      is_active,
    }: {
      id: string;
      name?: string;
      type?: "income" | "expense";
      parentId?: string | null;
      color?: string | null;
      icon?: string | null;
      description?: string | null;
      sort_order?: number | null;
      is_active?: boolean;
    }) =>
      categoryStorage.update(id, {
        name,
        type,
        parentId,
        color,
        icon,
        description,
        sort_order,
        is_active,
      }),
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
