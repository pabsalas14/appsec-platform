'use client';

import { useDroppable } from '@dnd-kit/core';
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

interface KanbanColumnData {
  id: string;
  nombre: string;
  color: string;
  estado_correspondiente: string;
  releases: ReleaseKanbanData[];
  release_count: number;
  orden: number;
}

interface ReleaseKanbanColumnProps {
  column: KanbanColumnData;
  releases: ReleaseKanbanData[];
}

import { ReleaseKanbanCard } from './ReleaseKanbanCard';

export function ReleaseKanbanColumn({ column, releases }: ReleaseKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id, status: column.estado_correspondiente },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col gap-3 rounded-lg border-2 p-4 min-w-[320px] max-w-[320px] bg-card',
        isOver ? 'border-primary/50 bg-primary/5' : 'border-border',
        'transition-colors duration-200',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-sm text-foreground">{column.nombre}</h3>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
          {releases.length}
        </span>
      </div>

      {/* Description */}
      {column.estado_correspondiente && (
        <p className="text-xs text-muted-foreground mb-3">
          {column.estado_correspondiente}
        </p>
      )}

      {/* Releases */}
      <div className="flex flex-col gap-3 flex-1">
        {releases.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No hay releases
          </div>
        ) : (
          releases.map((release) => (
            <ReleaseKanbanCard key={release.id} release={release} />
          ))
        )}
      </div>
    </div>
  );
}
