import type { ReactNode } from 'react';

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
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </CommandPalette>
      </TooltipProvider>
    </AuthGate>
  );
}
