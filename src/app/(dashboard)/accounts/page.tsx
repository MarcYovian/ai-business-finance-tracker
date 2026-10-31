import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/components/providers/query-provider';
import { createClient } from '@/lib/supabase/server';
import {
  transactionStorage,
  fundSourceStorage,
} from '@/lib/storage';
import AccountsClient from './AccountsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accounts & Wallets | AI Business Finance Tracker',
  description: 'Kelola rekening bank, e-wallet, kas operasional, dan transfer antar akun bisnis.',
};

export default async function AccountsPage() {
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
          queryKey: ['fundSources', userId],
          queryFn: () => fundSourceStorage.getAll(userId),
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
      <AccountsClient userId={userId} />
    </HydrationBoundary>
  );
}
