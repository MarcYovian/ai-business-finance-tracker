import { transactionStorage } from "@/lib/storage";
import { Transaction } from "@/types/finance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useTransactions = (userId: string) => {
  return useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => transactionStorage.getAll(userId),
    enabled: !!userId,
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transaction: Omit<Transaction, "id" | "createdAt">) =>
      transactionStorage.create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Transaction>;
    }) => transactionStorage.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["fundSources"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionStorage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fromFundId,
      toFundId,
      amount,
      fee,
    }: {
      fromFundId: string;
      toFundId: string;
      amount: number;
      fee: number;
    }) => transactionStorage.createTransfer(fromFundId, toFundId, amount, fee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["fundSources"] });
    },
  });
};
