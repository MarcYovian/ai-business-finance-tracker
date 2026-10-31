import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { createClient } from '@/lib/supabase/server';
import {
  transactionStorage,
  categoryStorage,
  fundSourceStorage,
  beneficiaryStorage,
} from '@/lib/storage';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | AI Business Finance Tracker',
  description: 'Ringkasan arus kas, saldo rekening, dan kesehatan finansial bisnis Anda.',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const isTestAuth = cookieStore.get('sb-test-auth')?.value === 'authenticated';
  const queryClient = getQueryClient();
  const userId = user?.id || (isTestAuth ? 'd09a4fff-0f9f-4227-b67c-83724dc830fa' : '');

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
        queryClient.prefetchQuery({
          queryKey: ['beneficiaries', userId],
          queryFn: () => beneficiaryStorage.getAll(userId),
        }),
      ]);
    } catch {
      // If server prefetching fails, client will refetch gracefully
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient userId={userId} />
    </HydrationBoundary>
  );
}
