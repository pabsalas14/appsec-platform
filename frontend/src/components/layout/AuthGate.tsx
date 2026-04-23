"use client";

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { useCurrentUser } from '@/hooks/useCurrentUser';

/**
 * Gate that redirects unauthenticated visitors to /login. Pages inside the
 * (dashboard) group assume the session is valid.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.replace('/login');
    }
  }, [user, isLoading, isError, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
