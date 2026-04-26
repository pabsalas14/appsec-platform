'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

interface KanbanCard {
  id: string;
  nombre: string;
  version: string;
}

interface KanbanColumn {
  [status: string]: KanbanCard[];
}

export default function KanbanDashboardPage() {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<KanbanColumn>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-kanban'],
    queryFn: async () => {
      logger.info('dashboard.kanban.fetch');
      const response = await apiClient.get('/api/v1/dashboard/releases-kanban');
      return response.data.data as { columns: KanbanColumn; total_cards: number };
    },
  });

  useEffect(() => {
    if (data?.columns) setColumns(data.columns);
  }, [data]);

  const moveMutation = useMutation({
    mutationFn: async (vars: { cardId: string; newStatus: string }) => {
      logger.info('release.move', { cardId: vars.cardId, newStatus: vars.newStatus });
      await apiClient.patch(`/api/v1/service-releases/${vars.cardId}/move`, {
        estado_actual: vars.newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-kanban'] });
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el kanban</span>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeStatus = Object.keys(columns).find(status =>
      columns[status].find(card => card.id === String(active.id))
    );
    const overStatus = Object.keys(columns).find(status =>
      columns[status].find(card => card.id === String(over.id))
    ) || Object.keys(columns)[0];

    if (activeStatus && overStatus && activeStatus !== overStatus) {
      moveMutation.mutate({
        cardId: String(active.id),
        newStatus: overStatus,
      });
    }
  };

  const displayColumns = isLoading ? {} : columns;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Kanban</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de liberaciones por estado (drag &amp; drop)
          </p>
        </div>
      </div>

      {/* Total Cards */}
      <Card data-testid="total-cards-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Total de Tarjetas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-1/2" />
          ) : (
            <div className="text-3xl font-bold">{data?.total_cards || 0}</div>
          )}
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="kanban-board">
            {Object.entries(displayColumns).map(([status, cards]) => (
              <Card key={status} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {status} ({cards.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SortableContext
                    items={cards.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {cards.map(card => (
                      <div
                        key={card.id}
                        className="p-3 bg-muted rounded cursor-move hover:shadow-md transition-shadow"
                        data-testid={`kanban-card-${card.id}`}
                      >
                        <p className="text-sm font-medium truncate">{card.nombre}</p>
                        <p className="text-xs text-muted-foreground">v{card.version}</p>
                      </div>
                    ))}
                  </SortableContext>
                </CardContent>
              </Card>
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
