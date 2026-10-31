import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/components/providers/query-provider';
import { createClient } from '@/lib/supabase/server';
import {
  transactionStorage,
  categoryStorage,
  budgetStorage,
} from '@/lib/storage';
import BudgetClient from './BudgetClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monthly Budget | AI Business Finance Tracker',
  description: 'Kelola pagu pengeluaran bulanan dan pantau realisasi anggaran operasional.',
};

export default async function BudgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const queryClient = getQueryClient();
  const userId = user?.id || '';

  if (userId) {
    try {
      const now = new Date();
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['transactions', userId],
          queryFn: () => transactionStorage.getAll(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: ['categories', userId, 'expense'],
          queryFn: () => categoryStorage.getAll(userId, 'expense'),
        }),
      ]);
    } catch {
      // Graceful fallback to client fetching
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BudgetClient userId={userId} />
    </HydrationBoundary>
  );
}
