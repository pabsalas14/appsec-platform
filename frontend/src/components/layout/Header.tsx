"use client";

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CommandPaletteTrigger } from '@/components/layout/CommandPalette';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserMenu } from '@/components/layout/UserMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="min-w-0 flex-1 truncate">
        <Breadcrumbs />
      </div>
      <CommandPaletteTrigger />
      <div className="flex items-center gap-1">
        <NotificationsPopover />
        <ThemeToggle />
      </div>
      <UserMenu />
    </header>
  );
}
