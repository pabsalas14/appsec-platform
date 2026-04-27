'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  PageHeader,
  PageWrapper,
} from '@/components/ui';
import {
  useDeleteNotificacion,
  useMarcarTodasNotificacionesLeidas,
  useNotificacions,
  useUpdateNotificacion,
} from '@/hooks/useNotificacions';
import { cn } from '@/lib/utils';
import type { Notificacion } from '@/lib/schemas/notificacion.schema';

type FilterType = 'all' | 'unread' | 'read';

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: es });
  } catch {
    return dateStr;
  }
}

function NotifRow({ n, onMarkRead, onDelete }: {
  n: Notificacion;
  onMarkRead: (n: Notificacion) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-5 py-4 border-b border-border/60 last:border-b-0 transition-colors hover:bg-muted/40',
        !n.leida && 'bg-primary/[0.03]',
      )}
    >
      <div className="mt-1 shrink-0">
        {n.leida ? (
          <Bell className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="mt-0.5 inline-flex h-2 w-2 rounded-full bg-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !n.leida && 'font-semibold')}>{n.titulo}</p>
        {n.cuerpo && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.cuerpo}</p>
        )}
        <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {!n.leida && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Marcar como leída"
            onClick={() => onMarkRead(n)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Eliminar">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar notificación?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(n.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function NotificacionsPage() {
  const { data: items = [], isLoading, isError } = useNotificacions();
  const markOne = useUpdateNotificacion();
  const markAll = useMarcarTodasNotificacionesLeidas();
  const deleteOne = useDeleteNotificacion();
  const [filter, setFilter] = useState<FilterType>('all');

  const unreadCount = items.filter((n) => !n.leida).length;

  const filtered = items.filter((n) => {
    if (filter === 'unread') return !n.leida;
    if (filter === 'read') return n.leida;
    return true;
  });

  const handleMarkRead = (n: Notificacion) => {
    if (n.leida) return;
    markOne.mutate({ id: n.id, leida: true });
  };

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    markAll.mutate(undefined, {
      onSuccess: (res) => toast.success(`${res.marked_read} notificaciones marcadas como leídas`),
    });
  };

  const handleDelete = (id: string) => {
    deleteOne.mutate(id, {
      onSuccess: () => toast.success('Notificación eliminada'),
      onError: () => toast.error('No se pudo eliminar'),
    });
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Centro de Notificaciones"
        description="Alertas del sistema: SLA, actividades, temas emergentes y más."
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              disabled={markAll.isPending}
            >
              {markAll.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Marcar todas como leídas
            </Button>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b pb-0">
        {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              filter === f
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {f === 'all' && 'Todas'}
            {f === 'unread' && (
              <span className="flex items-center gap-2">
                No leídas
                {unreadCount > 0 && (
                  <Badge variant="default" className="h-4 px-1.5 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </span>
            )}
            {f === 'read' && 'Leídas'}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && (
            <div className="py-12 text-center text-sm text-destructive">
              Error al cargar las notificaciones.
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Bell className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                {filter === 'all' && 'Sin notificaciones'}
                {filter === 'unread' && 'No hay notificaciones sin leer'}
                {filter === 'read' && 'No hay notificaciones leídas'}
              </p>
            </div>
          )}
          {!isLoading && !isError && filtered.length > 0 &&
            filtered.map((n) => (
              <NotifRow
                key={n.id}
                n={n}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
        </CardContent>
      </Card>

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando {filtered.length} de {items.length} notificaciones
        </p>
      )}
    </PageWrapper>
  );
}
