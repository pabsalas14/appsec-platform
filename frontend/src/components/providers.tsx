"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ReactNode, useEffect, useState } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { ReactQueryDevtoolsLazy } from '@/components/ReactQueryDevtoolsLazy';
import { logger } from '@/lib/logger';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logger.error('window.error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logger.error('window.unhandledrejection', {
        message: typeof reason === 'string' ? reason : (reason as { message?: string })?.message,
        reason: typeof reason === 'object' ? JSON.stringify(reason) : String(reason),
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              },
            }}
          />
          {process.env.NODE_ENV === 'development' ? (
            <ReactQueryDevtoolsLazy initialIsOpen={false} />
          ) : null}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
