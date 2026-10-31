'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { getQueryClient } from '@/lib/get-query-client';

export { getQueryClient };

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
