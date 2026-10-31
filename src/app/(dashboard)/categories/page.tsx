import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/components/providers/query-provider';
import { createClient } from '@/lib/supabase/server';
import {
  transactionStorage,
  categoryStorage,
} from '@/lib/storage';
import CategoriesClient from './CategoriesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories | AI Business Finance Tracker',
  description: 'Kelola kategori pemasukan dan pengeluaran bisnis serta subkategori hierarkis.',
};

export default async function CategoriesPage() {
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
          queryKey: ['categories', userId],
          queryFn: () => categoryStorage.getAll(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: ['transactions', userId],
          queryFn: () => transactionStorage.getAll(userId),
        }),
      ]);
    } catch {
      // Graceful fallback to client fetching
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CategoriesClient userId={userId} />
    </HydrationBoundary>
  );
}
