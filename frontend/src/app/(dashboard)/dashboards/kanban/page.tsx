'use client';

import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Layers, Package } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { HierarchyFiltersBarCard } from '@/components/dashboard/HierarchyFiltersBar';
import {
  Badge,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui';
import api from '@/lib/api';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';
import { ESTADOS_SERVICE_RELEASE } from '@/lib/schemas/service_release.schema';
import { cn, extractErrorMessage, formatDate } from '@/lib/utils';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { useDashboardReleasesKanban } from '@/hooks/useAppDashboardPanels';
import { useServiceReleaseOperacionConfig } from '@/hooks/useOperacionConfig';
import { useServiceRelease } from '@/hooks/useServiceReleases';
import { useServicios } from '@/hooks/useServicios';
import { logger } from '@/lib/logger';

type KanbanCard = { id: string; nombre: string; version: string };

function statusSortIndex(s: string): number {
  const i = ESTADOS_SERVICE_RELEASE.indexOf(s as (typeof ESTADOS_SERVICE_RELEASE)[number]);
  return i === -1 ? 999 : i;
}

function DroppableColumn({
  status,
  count,
  children,
}: {
  status: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${status}`,
    data: { type: 'column', status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[480px] w-72 shrink-0 flex-col rounded-xl border border-dashboard-border bg-dashboard-surface/40',
        isOver && 'ring-2 ring-dashboard-accent/50',
      )}
    >
      <div className="flex items-center justify-between border-b border-dashboard-border bg-dashboard-elevated/30 p-4">
        <h3 className="dashboard-section-label max-w-[200px] truncate text-slate-300 dark:text-slate-300" title={status}>
          {status}
        </h3>
        <span className="rounded bg-dashboard-border px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">{children}</div>
    </div>
  );
}

function DraggableReleaseCard({
  card,
  sourceStatus,
  onOpenDetail,
}: {
  card: KanbanCard;
  sourceStatus: string;
  onOpenDetail: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { type: 'card', card, sourceStatus },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex gap-1 rounded-lg border border-dashboard-border bg-dashboard-elevated shadow-lg transition-all',
        'hover:border-dashboard-accent/50',
        isDragging && 'opacity-60 ring-2 ring-dashboard-accent/40',
      )}
    >
      <button
        type="button"
        className="touch-none shrink-0 rounded-l-lg border-r border-dashboard-border bg-dashboard-surface/80 p-2 text-muted-foreground hover:text-foreground"
        {...listeners}
        {...attributes}
        aria-label="Arrastrar para cambiar de columna"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 rounded-r-lg p-3 text-left"
        onClick={onOpenDetail}
      >
        <p className="text-sm font-semibold text-dashboard-on-strong">{card.nombre}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="rounded bg-dashboard-border px-2 py-0.5 text-xs text-muted-foreground">v{card.version ?? '—'}</span>
          <span className="text-xs italic text-muted-foreground">Abrir detalle</span>
        </div>
      </button>
    </div>
  );
}

function CardOverlay({ card }: { card: KanbanCard }) {
  return (
    <div className="cursor-grabbing rounded-lg border border-dashboard-accent/50 bg-dashboard-elevated p-4 shadow-xl ring-2 ring-dashboard-accent/40">
      <div className="flex items-start gap-2">
        <Package className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-accent" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dashboard-on-strong">{card.nombre}</p>
          <span className="text-xs text-muted-foreground">v{card.version ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}

function ReleaseDetailPanel({
  releaseId,
  columnEstado,
  onClose,
}: {
  releaseId: string;
  columnEstado: string;
  onClose: () => void;
}) {
  const { data: servicios } = useServicios();
  const detail = useServiceRelease(releaseId || undefined);

  const servicioNombre = useMemo(() => {
    const row = detail.data;
    if (!row) return null;
    return servicios?.find((s) => s.id === row.servicio_id)?.nombre ?? row.servicio_id.slice(0, 8);
  }, [detail.data, servicios]);

  const ctxPreview = useMemo(() => {
    const c = detail.data?.contexto_liberacion;
    if (!c || typeof c !== 'object') return null;
    try {
      return JSON.stringify(c, null, 2);
    } catch {
      return null;
    }
  }, [detail.data?.contexto_liberacion]);

  return (
    <Sheet open={Boolean(releaseId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[min(100vw,440px)] overflow-y-auto border-dashboard-border bg-dashboard-canvas text-dashboard-on-strong sm:max-w-[440px]"
      >
        <SheetHeader className="border-b border-dashboard-border pb-4 text-left">
          <SheetTitle className="text-lg text-foreground">Detalle de liberación</SheetTitle>
          <SheetDescription className="font-mono text-xs text-muted-foreground">{releaseId}</SheetDescription>
        </SheetHeader>

        {detail.isLoading && <p className="mt-6 text-sm text-muted-foreground">Cargando…</p>}
        {detail.isError && (
          <p className="mt-6 text-sm text-destructive">No se pudo cargar el registro (¿permisos o ID inválido?).</p>
        )}
        {detail.data && (
          <div className="mt-6 space-y-6 text-sm">
            <div className="space-y-2">
              <p className="dashboard-section-label">Estado en tablero</p>
              <Badge variant="outline" className="max-w-full whitespace-normal text-left">
                {columnEstado}
              </Badge>
            </div>
            <div>
              <p className="dashboard-section-label">Nombre</p>
              <p className="mt-1 font-medium text-foreground">{detail.data.nombre}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="dashboard-section-label">Versión</p>
                <p className="mt-1 font-mono">{detail.data.version}</p>
              </div>
              <div>
                <p className="dashboard-section-label">Estado (API)</p>
                <p className="mt-1 text-xs">{detail.data.estado_actual}</p>
              </div>
            </div>
            <div>
              <p className="dashboard-section-label">Servicio</p>
              <p className="mt-1">{servicioNombre}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="dashboard-section-label">Entrada etapa</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {detail.data.fecha_entrada ? formatDate(detail.data.fecha_entrada) : '—'}
                </p>
              </div>
              <div>
                <p className="dashboard-section-label">Actualizado</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(detail.data.updated_at)}</p>
              </div>
            </div>
            <div>
              <p className="dashboard-section-label">Jira</p>
              <p className="mt-1 text-xs">{detail.data.jira_referencia ?? '—'}</p>
            </div>
            {detail.data.descripcion && (
              <div>
                <p className="dashboard-section-label">Descripción</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{detail.data.descripcion}</p>
              </div>
            )}
            {ctxPreview && (
              <div>
                <p className="dashboard-section-label">
                  Contexto (JSON)
                </p>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-dashboard-border bg-dashboard-surface p-3 font-mono text-xs text-muted-foreground">
                  {ctxPreview}
                </pre>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Gatekeepers SAST/DAST/SCA, excepciones y bitácora completa están planificados en backlog de operación;
              aquí se muestran los datos persistidos del Service Release.
            </p>
            <Link
              href="/service_releases/registros"
              className="inline-flex w-full items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-elevated py-2 text-xs font-medium hover:bg-dashboard-border/80"
              onClick={onClose}
            >
              Ir a registros para editar
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function KanbanDashboardPage() {
  const qc = useQueryClient();
  const { data: operacionCfg } = useServiceReleaseOperacionConfig();
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();
  const [search, setSearch] = useState('');
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailColumnEstado, setDetailColumnEstado] = useState('');

  const kanbanQuery = useDashboardReleasesKanban(filters);
  const data = kanbanQuery.data;

  const filteredColumns = useMemo(() => {
    const cols = data?.columns ?? {};
    const q = search.trim().toLowerCase();
    if (!q) return cols;
    const out: Record<string, KanbanCard[]> = {};
    for (const [status, cards] of Object.entries(cols)) {
      const filtered = cards.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.version ?? '').toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      );
      out[status] = filtered;
    }
    return out;
  }, [data?.columns, search]);

  const sortedStatuses = useMemo(() => {
    const keys = Object.keys(filteredColumns);
    const orden = operacionCfg?.kanban?.columnas_orden;
    if (Array.isArray(orden) && orden.length > 0) {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const s of orden) {
        if (typeof s === 'string' && keys.includes(s)) {
          out.push(s);
          seen.add(s);
        }
      }
      for (const k of [...keys].sort((a, b) => statusSortIndex(a) - statusSortIndex(b))) {
        if (!seen.has(k)) out.push(k);
      }
      return out;
    }
    return [...keys].sort((a, b) => statusSortIndex(a) - statusSortIndex(b));
  }, [filteredColumns, operacionCfg]);

  const findSourceStatus = (cardId: string): string | undefined => {
    const cols = data?.columns ?? {};
    for (const [st, cards] of Object.entries(cols)) {
      if (cards.some((c) => c.id === cardId)) return st;
    }
    return undefined;
  };

  const moveMutation = useMutation({
    mutationFn: async (vars: { cardId: string; newStatus: string }) => {
      await api.patch(`/service_releases/${vars.cardId}/move`, { column: vars.newStatus });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dashboard', 'releases-kanban'] });
      void qc.invalidateQueries({ queryKey: ['service_releases'] });
      logger.info('dashboard.kanban.move.ok');
    },
    onError: (e) => {
      logger.error('dashboard.kanban.move.failed', { error: String(e) });
      toast.error(extractErrorMessage(e, 'No se pudo mover la liberación'));
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (e: DragStartEvent) => {
    const cardId = String(e.active.id);
    const src = findSourceStatus(cardId);
    const card = data?.columns[src ?? '']?.find((c) => c.id === cardId);
    if (card) setActiveCard(card);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;

    const cardId = String(active.id);
    const sourceStatus = findSourceStatus(cardId);
    if (!sourceStatus) return;

    const overData = over.data.current as { type?: string; status?: string } | undefined;
    let targetStatus: string | undefined;
    if (overData?.type === 'column' && overData.status) {
      targetStatus = overData.status;
    } else if (String(over.id).startsWith('col:')) {
      targetStatus = String(over.id).slice('col:'.length);
    }

    if (!targetStatus || targetStatus === sourceStatus) return;

    moveMutation.mutate({ cardId, newStatus: targetStatus });
  };

  const handleDragCancel = () => setActiveCard(null);

  const totalVisible = useMemo(
    () => Object.values(filteredColumns).reduce((acc, cards) => acc + cards.length, 0),
    [filteredColumns],
  );

  const openDetail = (cardId: string, columnEstado: string) => {
    setDetailId(cardId);
    setDetailColumnEstado(columnEstado);
  };

  return (
    <div className="min-h-screen bg-dashboard-canvas p-6 font-sans text-dashboard-on-strong">
      <ReleaseDetailPanel
        releaseId={detailId ?? ''}
        columnEstado={detailColumnEstado}
        onClose={() => setDetailId(null)}
      />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">Kanban de liberaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastra desde el asa · Clic en la tarjeta para ver detalle (spec operación).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboards/releases"
            className="inline-flex items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-elevated px-3 py-1.5 text-xs font-medium text-foreground hover:bg-dashboard-border/80"
          >
            Dashboard tabla
          </Link>
          <Link
            href="/service_releases/registros"
            className="inline-flex items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-elevated px-3 py-1.5 text-xs font-medium text-foreground hover:bg-dashboard-border/80"
          >
            Registros
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <HierarchyFiltersBarCard
          title="Filtros organizacionales"
          filters={filters}
          onChange={updateFilter}
          onClear={clearFilters}
          savedModulo={DASHBOARD_FILTER_MODULO.releases}
          onApplyFilters={applyFilters}
          className="bg-dashboard-surface border-dashboard-border"
        />
        <div className="rounded-xl border border-dashboard-border bg-dashboard-surface/50 p-4">
          <label className="dashboard-section-label">Buscar</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, versión o ID…"
            className="mt-2 w-full rounded-lg border border-dashboard-border bg-dashboard-canvas px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-dashboard-accent/40"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="glass-hover rounded-xl border-b-4 border-dashboard-accent bg-dashboard-surface/50 p-5">
          <div className="mb-2 flex items-center gap-2 text-dashboard-accent">
            <Layers className="h-4 w-4" />
            <span className="dashboard-section-label">
              Tarjetas (vista actual)
            </span>
          </div>
          {kanbanQuery.isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-dashboard-border" />
          ) : (
            <div className="text-3xl font-bold">{totalVisible}</div>
          )}
        </div>
      </div>

      {kanbanQuery.error && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar el tablero. Revisa permisos de dashboard o vuelve a intentar.
        </div>
      )}

      {kanbanQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-xl border border-dashboard-border bg-dashboard-surface" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {sortedStatuses.map((status) => {
              const cards = filteredColumns[status] ?? [];
              return (
                <DroppableColumn key={status} status={status} count={cards.length}>
                  {cards.map((card) => (
                    <DraggableReleaseCard
                      key={card.id}
                      card={card}
                      sourceStatus={status}
                      onOpenDetail={() => openDetail(card.id, status)}
                    />
                  ))}
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>{activeCard ? <CardOverlay card={activeCard} /> : null}</DragOverlay>
        </DndContext>
      )}

      {moveMutation.isPending && (
        <p className="mt-4 text-center text-xs text-muted-foreground">Actualizando estado…</p>
      )}
    </div>
  );
}
