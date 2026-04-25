"use client";

import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check, Loader2 } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Separator,
} from '@/components/ui';
import {
  useMarcarTodasNotificacionesLeidas,
  useNotificacions,
  useUpdateNotificacion,
} from '@/hooks/useNotificacions';
import { cn } from '@/lib/utils';
import type { Notificacion } from '@/lib/schemas/notificacion.schema';

function atLabel(n: Notificacion) {
  try {
    return formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: es });
  } catch {
    return n.created_at;
  }
}

export function NotificationsPopover() {
  const { data: items = [], isLoading, isError } = useNotificacions();
  const markAll = useMarcarTodasNotificacionesLeidas();
  const update = useUpdateNotificacion();
  const unread = items.filter((n) => !n.leida).length;

  const onMarkOne = (n: Notificacion) => {
    if (n.leida) return;
    update.mutate({ id: n.id, leida: true });
  };

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
          <span className="text-sm font-semibold">Notificaciones</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {markAll.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Marcar todas
            </button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-80">
          {isLoading && (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {isError && (
            <div className="p-6 text-center text-sm text-destructive">No se pudo cargar el centro de avisos.</div>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Sin notificaciones</div>
          )}
          {!isLoading && !isError && items.length > 0 && (
            <ul>
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/50',
                    !n.leida && 'bg-primary/[0.03]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onMarkOne(n)}
                    className="w-full text-left"
                    disabled={update.isPending}
                  >
                    <div className="flex items-start gap-2">
                      {!n.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{n.titulo}</div>
                        {n.cuerpo && <div className="mt-0.5 text-xs text-muted-foreground">{n.cuerpo}</div>}
                        <div className="mt-1 text-[11px] text-muted-foreground/80">{atLabel(n)}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
