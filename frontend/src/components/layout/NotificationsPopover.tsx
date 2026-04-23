"use client";

import { Bell, Check } from 'lucide-react';
import { useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Separator,
} from '@/components/ui';
import { cn } from '@/lib/utils';

export type Notification = {
  id: string;
  title: string;
  body?: string;
  at: string;
  read?: boolean;
};

const MOCK: Notification[] = [
  {
    id: '1',
    title: 'Welcome to the framework',
    body: 'This panel is a stub — wire it to SSE or polling when ready.',
    at: 'just now',
  },
  {
    id: '2',
    title: 'New audit entry',
    body: 'An admin updated a system setting.',
    at: '2m ago',
  },
  {
    id: '3',
    title: 'Backup completed',
    body: 'Daily backup finished successfully.',
    at: '1h ago',
    read: true,
  },
];

export function NotificationsPopover() {
  const [items, setItems] = useState<Notification[]>(MOCK);
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Open notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <ul>
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/50',
                    !n.read && 'bg-primary/[0.03]',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{n.title}</div>
                      {n.body && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>
                      )}
                      <div className="mt-1 text-[11px] text-muted-foreground/80">{n.at}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
