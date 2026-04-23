import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Build a QueryClient tuned for tests:
 * - retry disabled so failures surface immediately
 * - gcTime 0 avoids cross-test cache pollution
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function QueryWrapper({
  children,
  client,
}: {
  children: ReactNode;
  client?: QueryClient;
}) {
  const qc = client ?? createTestQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

/**
 * Drop-in replacement for RTL's render that mounts the tree inside
 * a fresh QueryClientProvider.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient },
) {
  const client = options?.queryClient ?? createTestQueryClient();
  return {
    queryClient: client,
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
      ...options,
    }),
  };
}
