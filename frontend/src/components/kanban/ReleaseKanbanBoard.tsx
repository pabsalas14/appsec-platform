'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { PageHeader, PageWrapper, Badge } from '@/components/ui';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Zap } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { ReleaseKanbanColumn } from './ReleaseKanbanColumn';
import { ReleaseKanbanCard } from './ReleaseKanbanCard';

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

interface KanbanBoardData {
  columnas: KanbanColumnData[];
  total_releases: number;
  metadata: Record<string, unknown>;
}

export function ReleaseKanbanBoard() {
  const [data, setData] = useState<KanbanBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRelease, setActiveRelease] = useState<ReleaseKanbanData | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const queryClient = useQueryClient();

  // Cargar datos del kanban
  const loadKanban = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard/releases-kanban');
      if (response.data?.data) {
        setData(response.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando el kanban');
      // Log error for debugging
    } finally {
      setLoading(false);
    }
  };

  // Cargar inicial
  useEffect(() => {
    loadKanban();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Aplanar todos los releases para búsqueda por ID
  const allReleases = useMemo(() => {
    if (!data) return {};
    const map: Record<string, ReleaseKanbanData> = {};
    for (const col of data.columnas) {
      for (const release of col.releases) {
        map[release.id] = release;
      }
    }
    return map;
  }, [data]);

  const handleDragStart = (e: DragStartEvent) => {
    const release = allReleases[e.active.id];
    if (release) {
      setActiveRelease(release);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveRelease(null);
    const { active, over } = event;
    if (!over) return;

    const activeRelease = allReleases[active.id];
    if (!activeRelease) return;

    const overData = over.data.current as
      | { type?: string; columnId?: string; status?: string }
      | undefined;

    if (overData?.type !== 'column' || !overData.columnId) return;

    const targetColumn = data?.columnas.find((c) => c.id === overData.columnId);
    if (!targetColumn || targetColumn.estado_correspondiente === activeRelease.estado_actual) {
      return;
    }

    try {
      setIsMoving(true);
      await api.patch(`/dashboard/service-releases/${activeRelease.id}/move`, {
        column_id: targetColumn.id,
        nueva_etapa: targetColumn.estado_correspondiente,
      });

      // Recargar datos
      await loadKanban();
      queryClient.invalidateQueries({ queryKey: ['releases-kanban'] });
    } catch (err) {
      logger.error('kanban.release_move_failed', { err: String(err) });
      setError('Error moviendo el release');
    } finally {
      setIsMoving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper className="space-y-6 p-6">
        <PageHeader title="Kanban de Liberaciones" description="Cargando..." />
        <div className="flex items-center justify-center h-96">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Kanban de Liberaciones"
        description="Arrastra los releases entre columnas para cambiar su estado"
      >
        {data && (
          <div className="flex gap-4">
            <Badge variant="outline">{data.total_releases} Total</Badge>
          </div>
        )}
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isMoving && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-200">
          <Zap className="h-4 w-4 shrink-0 animate-spin" />
          Moviendo release...
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {data?.columnas.map((column) => (
            <ReleaseKanbanColumn
              key={column.id}
              column={column}
              releases={column.releases}
            />
          ))}
        </div>
        <DragOverlay>
          {activeRelease ? <ReleaseKanbanCard release={activeRelease} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </PageWrapper>
  );
}
