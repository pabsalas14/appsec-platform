import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { AuthGate } from '@/components/layout/AuthGate';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { TooltipProvider } from '@/components/ui';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <TooltipProvider delayDuration={200}>
        <CommandPalette>
          <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
            <Suspense
              fallback={
                <aside
                  className="relative flex h-full w-60 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur"
                  aria-hidden
                />
              }
            >
              <Sidebar />
            </Suspense>
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto">
                <Suspense
                  fallback={
                    <div className="min-h-[30vh] animate-pulse rounded-md bg-muted/15 p-6 text-sm text-muted-foreground">
                      Cargando vista…
                    </div>
                  }
                >
                  {children}
                </Suspense>
              </main>
            </div>
          </div>
        </CommandPalette>
      </TooltipProvider>
    </AuthGate>
  );
}
