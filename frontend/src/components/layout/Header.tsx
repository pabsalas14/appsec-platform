"use client";

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CommandPaletteTrigger } from '@/components/layout/CommandPalette';
import { SearchCommand, SearchCommandTrigger } from '@/components/SearchCommand';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { RateLimitIndicator } from '@/components/rate-limit/RateLimitIndicator';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserMenu } from '@/components/layout/UserMenu';
import { useRateLimit } from '@/hooks/useRateLimit';

export function Header() {
  const { rateLimitInfo } = useRateLimit();

  return (
    <>
      <SearchCommand />
      <div className="px-6 pt-2">
        <RateLimitIndicator rateLimitInfo={rateLimitInfo} />
      </div>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md">
        <div className="min-w-0 flex-1 truncate">
          <Breadcrumbs />
        </div>
        <SearchCommandTrigger />
        <CommandPaletteTrigger />
        <div className="flex items-center gap-1">
          <NotificationsPopover />
          <ThemeToggle />
        </div>
        <UserMenu />
      </header>
    </>
  );
}
