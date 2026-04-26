'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Package, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReleaseKanbanData {
  id: string;
  nombre: string;
  version: string;
  estado_actual: string;
  servicio_id: string;
  servicio_nombre?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  fecha_entrada?: string;
  etapas_count: number;
  etapas_completadas: number;
}

interface ReleaseKanbanCardProps {
  release: ReleaseKanbanData;
  overlay?: boolean;
}

export function ReleaseKanbanCard({ release, overlay }: ReleaseKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: release.id,
    data: { type: 'release', release },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completionPercent = release.etapas_count > 0 
    ? Math.round((release.etapas_completadas / release.etapas_count) * 100) 
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group rounded-lg border border-border bg-card p-3 shadow-sm text-left',
        'hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing',
        (isDragging || overlay) && 'opacity-70 ring-2 ring-primary/50 shadow-lg',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-sm font-semibold text-foreground">
              {release.nombre}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">v{release.version}</span>
        </div>
      </div>

      {/* Service info */}
      {release.servicio_nombre && (
        <div className="mb-2 text-xs text-muted-foreground truncate">
          Servicio: {release.servicio_nombre}
        </div>
      )}

      {/* Progress bar */}
      {release.etapas_count > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              Etapas
            </span>
            <span className="text-xs font-semibold text-foreground">
              {release.etapas_completadas}/{release.etapas_count}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-1 text-xs">
        <Zap className="h-3 w-3 text-yellow-500" />
        <span className="text-muted-foreground">{release.estado_actual}</span>
      </div>
    </div>
  );
}
