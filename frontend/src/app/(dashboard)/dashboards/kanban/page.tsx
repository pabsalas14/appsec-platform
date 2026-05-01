'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { Layers } from 'lucide-react';
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
      const response = await apiClient.get('/dashboard/releases-kanban');
      return response.data.data as { columns: KanbanColumn; total_cards: number };
    },
  });

  useEffect(() => {
    if (data?.columns) setColumns(data.columns);
  }, [data]);

  const moveMutation = useMutation({
    mutationFn: async (vars: { cardId: string; newStatus: string }) => {
      logger.info('release.move', { cardId: vars.cardId, newStatus: vars.newStatus });
      await apiClient.patch(`/service_releases/${vars.cardId}/move`, {
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
    <div className="min-h-screen bg-[#0d0f1a] text-[#e2e8f0] p-6 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-wide">7. Kanban Liberaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestión visual del flujo de trabajo de releases (Drag & Drop).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-hover border-b-4 border-[#e8365d] p-5 rounded-xl bg-[#141728]/50">
          <div className="flex items-center gap-2 mb-2 text-[#e8365d]">
            <Layers className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Tarjetas</span>
          </div>
          {isLoading ? <div className="h-8 w-12 bg-[#252a45] animate-pulse rounded" /> : <div className="text-3xl font-bold">{data?.total_cards ?? 0}</div>}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[1,2,3,4].map(i => <div key={i} className="h-96 bg-[#141728] border border-[#252a45] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {Object.entries(displayColumns).map(([status, cards]) => (
              <div key={status} className="bg-[#141728]/40 border border-[#252a45] rounded-xl flex flex-col min-h-[500px]">
                <div className="p-4 border-b border-[#252a45] bg-[#1c2035]/30 flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">{status}</h3>
                  <span className="px-2 py-0.5 bg-[#252a45] rounded text-[10px] text-slate-400">{cards.length}</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map(card => (
                      <div 
                        key={card.id} 
                        className="bg-[#1c2035] border border-[#252a45] p-4 rounded-lg shadow-lg hover:border-[#e8365d]/50 transition-all cursor-move group"
                      >
                        <p className="text-sm font-semibold text-slate-100 group-hover:text-[#e8365d] transition-colors">{card.nombre}</p>
                        <div className="mt-2 flex items-center justify-between">
                           <span className="text-[10px] px-2 py-0.5 bg-[#252a45] rounded text-slate-400">v{card.version}</span>
                           <span className="text-[10px] text-muted-foreground italic">ID: {card.id.slice(0,5)}</span>
                        </div>
                      </div>
                    ))}
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
