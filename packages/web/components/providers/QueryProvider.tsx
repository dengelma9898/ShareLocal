'use client';

// React Query Provider für ShareLocal
// Verwaltet API Caching und State Management

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale Time: Daten sind 5 Minuten "fresh"
            staleTime: 5 * 60 * 1000,
            // Cache Time: Daten bleiben 10 Minuten im Cache
            gcTime: 10 * 60 * 1000,
            // Retry: 1x bei Fehler
            retry: 1,
            // Refetch on Window Focus: Aktualisiert beim Tab-Wechsel
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

