import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { createClient } from '@/lib/supabase/server';
import {
  transactionStorage,
  categoryStorage,
  budgetStorage,
} from '@/lib/storage';
import BudgetHistoryClient from './BudgetHistoryClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budget History | AI Business Finance Tracker',
  description: 'Riwayat dan performa realisasi anggaran bisnis dari bulan ke bulan.',
};

export default async function BudgetHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const queryClient = getQueryClient();
  const userId = user?.id || '';

  if (userId) {
    try {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['budgets', userId, 'history'],
          queryFn: () => budgetStorage.getBudgetsWithItems(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: ['transactions', userId],
          queryFn: () => transactionStorage.getAll(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: ['categories', userId],
          queryFn: () => categoryStorage.getAll(userId),
        }),
      ]);
    } catch {
      // Graceful fallback to client fetching
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BudgetHistoryClient userId={userId} />
    </HydrationBoundary>
  );
}
