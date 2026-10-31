import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { createClient } from '@/lib/supabase/server';
import {
  transactionStorage,
  categoryStorage,
  fundSourceStorage,
} from '@/lib/storage';
import TransactionsClient from './TransactionsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transactions | AI Business Finance Tracker',
  description: 'Daftar riwayat transaksi pemasukan, pengeluaran, dan transfer bisnis.',
};

export default async function TransactionsPage() {
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
          queryKey: ['transactions', userId],
          queryFn: () => transactionStorage.getAll(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: ['categories', userId],
          queryFn: () => categoryStorage.getAll(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: ['fundSources', userId],
          queryFn: () => fundSourceStorage.getAll(userId),
        }),
      ]);
    } catch {
      // Graceful fallback to client fetching
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionsClient userId={userId} />
    </HydrationBoundary>
  );
}
