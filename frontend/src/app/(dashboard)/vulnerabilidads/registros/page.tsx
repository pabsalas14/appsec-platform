'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileSpreadsheet, Filter, Loader2, PanelRight, Printer, Settings2, X } from 'lucide-react';

import { VulnerabilidadBulkImportCard } from '@/components/modules/VulnerabilidadBulkImportCard';
import { VulnerabilidadPreviewSheet } from '@/components/modules/VulnerabilidadPreviewSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableRow,
  DataTableTh,
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from '@/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCelulas } from '@/hooks/useCelulas';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { useTableColumnVisibility } from '@/hooks/useTableColumnVisibility';
import { useVulnerabilidadBulkAction, useVulnerabilidadsList } from '@/hooks/useVulnerabilidads';
import { useVulnerabilidadFlujoConfig } from '@/hooks/useOperacionConfig';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { exportXLSX, printTableHtml } from '@/lib/export';
import { labelForEstatusId } from '@/lib/vulnerabilidadFlujo';
import { logger } from '@/lib/logger';
import { extractErrorMessage, formatDate } from '@/lib/utils';
import type { Vulnerabilidad } from '@/lib/schemas/vulnerabilidad.schema';

const SEVERIDAD_OPTS = [
  { value: '', label: 'Todas' },
  { value: 'Critica', label: 'Crítica' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Media', label: 'Media' },
  { value: 'Baja', label: 'Baja' },
];

const FUENTE_OPTS = [
  { value: '', label: 'Todas' },
  { value: 'SAST', label: 'SAST' },
  { value: 'DAST', label: 'DAST' },
  { value: 'SCA', label: 'SCA' },
  { value: 'CDS', label: 'CDS' },
  { value: 'MDA', label: 'MDA' },
  { value: 'TM', label: 'TM' },
  { value: 'MAST', label: 'MAST' },
  { value: 'Auditoria', label: 'Auditoría' },
  { value: 'Tercero', label: 'Tercero' },
];

const PAGE_SIZES = [
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

const DATA_COLUMNS = [
  'id',
  'titulo',
  'fuente',
  'severidad',
  'activo',
  'sla',
  'estado',
  'creado',
] as const;
type DataCol = (typeof DATA_COLUMNS)[number];

const COL_LABELS: Record<DataCol, string> = {
  id: 'ID',
  titulo: 'Título',
  fuente: 'Motor',
  severidad: 'Severidad',
  activo: 'Activo',
  sla: 'SLA',
  estado: 'Estado',
  creado: 'Creado',
};

function shortId(id: string) {
  return id.replace(/-/g, '').slice(0, 8);
}

function slaSummary(fecha: string | null | undefined) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  if (ms < 0) return 'Vencido';
  const days = Math.ceil(ms / 86400000);
  return `${days} d`;
}

function activoRuta(v: Vulnerabilidad) {
  if (v.repositorio_id) return `Repo ${shortId(v.repositorio_id)}`;
  if (v.activo_web_id) return `Web ${shortId(v.activo_web_id)}`;
  if (v.servicio_id) return `SVC ${shortId(v.servicio_id)}`;
  if (v.aplicacion_movil_id) return `Móvil ${shortId(v.aplicacion_movil_id)}`;
  return '—';
}

export default function VulnerabilidadsPage() {
  const { data: flujo, isLoading: flujoLoading } = useVulnerabilidadFlujoConfig();
  const { getParam, setParam, setParams, searchParams } = useUrlFilters();
  const [filterOpen, setFilterOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const listSp = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has('page')) p.set('page', '1');
    if (!p.has('page_size')) p.set('page_size', '20');
    if (!p.has('sort')) p.set('sort', 'created_at');
    if (!p.has('order')) p.set('order', 'desc');
    return p.toString();
  }, [searchParams]);

  const { data, isLoading, error } = useVulnerabilidadsList(listSp);
  const { data: user } = useCurrentUser();
  const { data: celulas } = useCelulas();
  const { data: orgs } = useOrganizacions();
  const bulkMut = useVulnerabilidadBulkAction();
  const { isVisible, toggle: toggleCol } = useTableColumnVisibility('vuln-registros-cols-v1', DATA_COLUMNS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const estatus = flujo?.estatus;
  const estadoOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...(estatus ?? []).map((e) => ({ value: e.id, label: e.label })),
    ],
    [estatus],
  );

  const curSort = getParam('sort') ?? 'created_at';
  const curOrder = getParam('order') ?? 'desc';

  const toggleSort = useCallback(
    (field: string) => {
      if (curSort === field) {
        setParams({ order: curOrder === 'asc' ? 'desc' : 'asc', sort: field, page: '1' });
      } else {
        setParams({ sort: field, order: 'desc', page: '1' });
      }
    },
    [curOrder, curSort, setParams],
  );

  const meta = data?.meta;
  const items = useMemo(() => data?.items ?? [], [data]);
  const totalPages = Math.max(1, meta?.total_pages ?? 1);
  const page = meta?.page ?? 1;

  const reinc = getParam('reincidencia') === 'true' || getParam('reincidencia') === '1';

  const visClass = useCallback(
    (col: DataCol, responsive: string) => (!isVisible(col) ? 'hidden' : responsive),
    [isVisible],
  );

  const allSelectedOnPage = items.length > 0 && items.every((i) => selected.has(i.id));

  const toggleSelectAllPage = useCallback(() => {
    if (!items.length) return;
    if (allSelectedOnPage) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const i of items) next.delete(i.id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const i of items) next.add(i.id);
        return next;
      });
    }
  }, [allSelectedOnPage, items]);

  const estadoBulkOptions = useMemo(
    () => (estatus ?? []).map((e) => ({ value: e.id, label: e.label })),
    [estatus],
  );

  const runBulkEstado = useCallback(() => {
    if (!bulkEstado.trim()) {
      toast.error('Elige un estatus');
      return;
    }
    bulkMut.mutate(
      { action: 'estado', ids: [...selected], estado: bulkEstado },
      {
        onSuccess: (d) => {
          toast.success(
            d.failed ? `Procesados ${d.processed}, con incidencias ${d.failed}` : `Actualizados: ${d.processed}`,
          );
          if (d.errors.length) logger.warn('vulnerabilidad.bulk.partial', { errors: d.errors });
          setSelected(new Set());
        },
        onError: (e) => {
          logger.error('vulnerabilidad.bulk.estado.failed', { error: e });
          toast.error(extractErrorMessage(e, 'No se pudo aplicar el estado'));
        },
      },
    );
  }, [bulkEstado, bulkMut, selected]);

  const runBulkAssignMe = useCallback(() => {
    if (!user?.id) {
      toast.error('Sesión sin usuario');
      return;
    }
    bulkMut.mutate(
      { action: 'responsable', ids: [...selected], responsable_id: user.id },
      {
        onSuccess: (d) => {
          toast.success(`Responsable actualizado en ${d.processed} filas`);
          setSelected(new Set());
        },
        onError: (e) => toast.error(extractErrorMessage(e, 'No se pudo asignar')),
      },
    );
  }, [bulkMut, selected, user?.id]);

  const runBulkDelete = useCallback(() => {
    bulkMut.mutate(
      { action: 'delete', ids: [...selected] },
      {
        onSuccess: (d) => {
          toast.success(`Eliminados (lógico): ${d.processed}`);
          setDeleteOpen(false);
          setSelected(new Set());
        },
        onError: (e) => toast.error(extractErrorMessage(e, 'No se pudo eliminar')),
      },
    );
  }, [bulkMut, selected]);

  const filterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    const q = getParam('q');
    if (q) chips.push({ key: 'q', label: `Buscar: ${q}` });
    const sev = getParam('severidad');
    if (sev) chips.push({ key: 'severidad', label: `Severidad: ${sev}` });
    const fu = getParam('fuente');
    if (fu) chips.push({ key: 'fuente', label: `Motor: ${fu}` });
    const st = getParam('estado');
    if (st) {
      const label = estatus?.find((e) => e.id === st)?.label ?? st;
      chips.push({ key: 'estado', label: `Estado: ${label}` });
    }
    const sla = getParam('sla');
    if (sla) chips.push({ key: 'sla', label: 'SLA: vencida' });
    if (reinc) chips.push({ key: 'reincidencia', label: 'Solo reincidencia' });
    const cel = getParam('celula_id');
    if (cel) {
      const nm = celulas?.find((c) => c.id === cel)?.nombre ?? cel.slice(0, 8);
      chips.push({ key: 'celula_id', label: `Célula: ${nm}` });
    }
    const org = getParam('organizacion_id');
    if (org) {
      const nm = orgs?.find((o) => o.id === org)?.nombre ?? org.slice(0, 8);
      chips.push({ key: 'organizacion_id', label: `Organización: ${nm}` });
    }
    return chips;
  }, [celulas, estatus, getParam, orgs, reinc]);

  const removeChip = (key: string) => {
    if (key === 'reincidencia') setParam('reincidencia', null);
    else if (key === 'q') setParam('q', null);
    else if (key === 'severidad') setParam('severidad', null);
    else if (key === 'fuente') setParam('fuente', null);
    else if (key === 'estado') setParam('estado', null);
    else if (key === 'sla') setParam('sla', null);
    else if (key === 'celula_id') setParam('celula_id', null);
    else if (key === 'organizacion_id') setParam('organizacion_id', null);
    setParam('page', '1');
  };

  const exportColumns = useMemo(
    () => [
      { key: 'id', header: 'ID (corto)', value: (row: Vulnerabilidad) => shortId(row.id) },
      { key: 'titulo', header: 'Título', value: (row: Vulnerabilidad) => row.titulo },
      { key: 'fuente', header: 'Motor', value: (row: Vulnerabilidad) => row.fuente },
      { key: 'severidad', header: 'Severidad', value: (row: Vulnerabilidad) => row.severidad },
      { key: 'estado', header: 'Estado', value: (row: Vulnerabilidad) => row.estado },
      { key: 'activo', header: 'Activo', value: (row: Vulnerabilidad) => activoRuta(row) },
      { key: 'sla', header: 'SLA', value: (row: Vulnerabilidad) => slaSummary(row.fecha_limite_sla) },
      { key: 'creado', header: 'Creado', value: (row: Vulnerabilidad) => formatDate(row.created_at) },
    ],
    [],
  );

  const onExportXlsx = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    void exportXLSX(`vulnerabilidades-${stamp}.xlsx`, exportColumns, items, 'Vulnerabilidades');
  }, [exportColumns, items]);

  const onPrint = useCallback(() => {
    printTableHtml('Catálogo de vulnerabilidades (vista actual)', exportColumns, items);
  }, [exportColumns, items]);

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title="Vulnerabilidades" description="Cargando…" />
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-24 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <p className="p-2 text-destructive">Error al cargar vulnerabilidades.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <VulnerabilidadPreviewSheet
        id={previewId}
        open={previewOpen}
        onOpenChange={(o) => {
          setPreviewOpen(o);
          if (!o) setPreviewId(null);
        }}
      />
        <PageHeader
        title="Catálogo de vulnerabilidades"
        description="Filtros, columnas configurables (spec 38), acciones masivas en la barra inferior (spec 37), exportación e impresión alineadas a la grilla, vista rápida lateral."
      />
      <div className="mb-6 max-w-5xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/vulnerabilidads/import"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 text-sm font-medium text-foreground hover:bg-white/[0.1]"
          >
            Asistente de importación (3 pasos)
          </Link>
        </div>
        <VulnerabilidadBulkImportCard />
      </div>
      {flujoLoading && <p className="text-xs text-muted-foreground">Cargando catálogo de estatus…</p>}

      <div className="mb-3 flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <Input
            placeholder="Buscar título, descripción, fuente…"
            value={getParam('q') ?? ''}
            onChange={(e) => setParam('q', e.target.value || null)}
            aria-label="Búsqueda"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filtros
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExportXlsx}
            className="gap-1.5"
            title="Columnas y fila visibles: página actual"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="gap-1.5"
            title="Vista de impresión con columnas actuales"
          >
            <Printer className="h-3.5 w-3.5" />
            PDF/Imprimir
          </Button>
        </div>
      </div>

      {filterChips.length > 0 && (
        <div className="mb-4 flex max-w-5xl flex-wrap gap-1.5">
          {filterChips.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-xs text-foreground"
            >
              {c.label}
              <button
                type="button"
                className="rounded p-0.5 hover:bg-muted"
                onClick={() => removeChip(c.key)}
                aria-label={`Quitar filtro ${c.key}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() =>
              setParams({
                q: null,
                severidad: null,
                sla: null,
                estado: null,
                fuente: null,
                reincidencia: null,
                page: '1',
              })
            }
          >
            Limpiar todo
          </button>
        </div>
      )}

      <div className="mb-3 flex max-w-5xl flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              Columnas
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 space-y-2 p-3" align="start">
            <p className="text-xs font-medium text-muted-foreground">Mostrar columnas (persistente en este navegador)</p>
            <div className="grid gap-2">
              {DATA_COLUMNS.map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={isVisible(c)} onChange={() => toggleCol(c)} />
                  {COL_LABELS[c]}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Los filtros se aplican al listado. Los resultados de exportación reflejan la página actual.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium">Severidad</label>
              <Select
                className="mt-1"
                value={getParam('severidad') ?? ''}
                onChange={(e) => setParam('severidad', e.target.value || null)}
                options={SEVERIDAD_OPTS}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Motor (fuente)</label>
              <Select
                className="mt-1"
                value={getParam('fuente') ?? ''}
                onChange={(e) => setParam('fuente', e.target.value || null)}
                options={FUENTE_OPTS}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado (D1)</label>
              <Select
                className="mt-1"
                value={getParam('estado') ?? ''}
                onChange={(e) => setParam('estado', e.target.value || null)}
                options={estadoOptions}
                disabled={!estatus?.length}
              />
            </div>
            <div>
              <label className="text-sm font-medium">SLA</label>
              <Select
                className="mt-1"
                value={getParam('sla') ?? ''}
                onChange={(e) => setParam('sla', e.target.value || null)}
                options={[
                  { value: '', label: 'Todas' },
                  { value: 'vencida', label: 'Vencida' },
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Organización (activo)</label>
              <Select
                className="mt-1"
                value={getParam('organizacion_id') ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setParams({ organizacion_id: v || null, celula_id: null, page: '1' });
                }}
                options={[
                  { value: '', label: 'Todas' },
                  ...(orgs ?? []).map((o) => ({ value: o.id, label: o.nombre })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Célula (activo)</label>
              <Select
                className="mt-1"
                value={getParam('celula_id') ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setParams({ celula_id: v || null, organizacion_id: null, page: '1' });
                }}
                options={[
                  { value: '', label: 'Todas' },
                  ...(celulas ?? []).map((c) => ({ value: c.id, label: c.nombre })),
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="rein"
                checked={reinc}
                onChange={(e) => setParam('reincidencia', e.target.checked ? 'true' : null)}
              />
              <label htmlFor="rein" className="text-sm text-muted-foreground">
                Solo reincidencia (CWE repetido)
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">Por página</label>
              <Select
                className="mt-1"
                value={getParam('page_size') ?? '20'}
                onChange={(e) => setParam('page_size', e.target.value)}
                options={PAGE_SIZES}
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setFilterOpen(false);
            }}
          >
            Aplicar
          </Button>
        </SheetContent>
      </Sheet>

      <Card>
        <CardContent className="p-0 sm:p-2">
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableTh className="w-10">
                  <Checkbox
                    checked={allSelectedOnPage}
                    onChange={toggleSelectAllPage}
                    aria-label="Seleccionar todos en esta página"
                  />
                </DataTableTh>
                <DataTableTh className={visClass('id', 'w-[1%] font-mono text-[10px]')}>ID</DataTableTh>
                <DataTableTh className={visClass('titulo', '')}>
                  <button
                    type="button"
                    data-testid="header-titulo"
                    className="font-semibold hover:underline"
                    onClick={() => toggleSort('titulo')}
                  >
                    Título
                    {curSort === 'titulo' ? (curOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </DataTableTh>
                <DataTableTh className={visClass('fuente', 'hidden md:table-cell')}>Motor</DataTableTh>
                <DataTableTh className={visClass('severidad', '')}>
                  <button
                    type="button"
                    className="font-semibold hover:underline"
                    onClick={() => toggleSort('severidad')}
                  >
                    Sev.
                    {curSort === 'severidad' ? (curOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </DataTableTh>
                <DataTableTh className={visClass('activo', 'hidden lg:table-cell')}>Activo</DataTableTh>
                <DataTableTh className={visClass('sla', 'hidden xl:table-cell')}>SLA</DataTableTh>
                <DataTableTh className={visClass('estado', 'hidden lg:table-cell')}>Estado</DataTableTh>
                <DataTableTh className={visClass('creado', 'hidden xl:table-cell')}>
                  <button
                    type="button"
                    className="font-semibold hover:underline"
                    onClick={() => toggleSort('created_at')}
                  >
                    Creado
                    {curSort === 'created_at' ? (curOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </DataTableTh>
                <DataTableTh className="w-[1%]"> </DataTableTh>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {items.map((item) => (
                <DataTableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setPreviewId(item.id);
                    setPreviewOpen(true);
                  }}
                >
                  <DataTableCell className="w-10">
                    <div
                      role="presentation"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Checkbox
                        checked={selected.has(item.id)}
                        onChange={() => {
                          setSelected((prev) => {
                            const n = new Set(prev);
                            if (n.has(item.id)) n.delete(item.id);
                            else n.add(item.id);
                            return n;
                          });
                        }}
                        aria-label={`Seleccionar ${shortId(item.id)}`}
                      />
                    </div>
                  </DataTableCell>
                  <DataTableCell className={`font-mono text-[10px] text-muted-foreground ${visClass('id', '')}`}>
                    {shortId(item.id)}
                  </DataTableCell>
                  <DataTableCell className={`max-w-[200px] ${visClass('titulo', '')}`}>
                    <span className="font-medium text-foreground group-hover:underline">
                      {item.titulo}
                    </span>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground md:hidden">
                      {item.fuente}
                    </p>
                  </DataTableCell>
                  <DataTableCell className={visClass('fuente', 'hidden text-sm md:table-cell')}>
                    <Badge variant="default">{item.fuente}</Badge>
                  </DataTableCell>
                  <DataTableCell className={visClass('severidad', '')}>
                    <Badge variant="severity" severityName={item.severidad.toLowerCase()}>
                      {item.severidad}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className={visClass('activo', 'hidden font-mono text-xs text-muted-foreground lg:table-cell')}>
                    {activoRuta(item)}
                  </DataTableCell>
                  <DataTableCell className={visClass('sla', 'hidden text-xs text-muted-foreground xl:table-cell whitespace-nowrap')}>
                    {slaSummary(item.fecha_limite_sla)}
                  </DataTableCell>
                  <DataTableCell className={visClass('estado', 'hidden lg:table-cell')}>
                    <span title={item.estado}>
                      <Badge variant="default">
                        {estatus?.length ? labelForEstatusId(estatus, item.estado) : item.estado}
                      </Badge>
                    </span>
                  </DataTableCell>
                  <DataTableCell className={visClass('creado', 'hidden text-xs text-muted-foreground xl:table-cell whitespace-nowrap')}>
                    {formatDate(item.created_at)}
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewId(item.id);
                          setPreviewOpen(true);
                        }}
                        title="Vista rápida"
                        aria-label="Vista rápida"
                      >
                        <PanelRight className="h-3.5 w-3.5" />
                      </Button>
                      <Link
                        href={`/vulnerabilidads/${item.id}`}
                        className="p-1.5 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ficha
                      </Link>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>

      {items.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Ningún registro con los filtros actuales.</p>
      )}

      {meta && totalPages > 1 && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-2"
          data-testid="vuln-pagination"
        >
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {meta.total} registros
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="prev-page"
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
            >
              Anterior
            </Button>
            <Input
              className="w-16"
              type="number"
              min={1}
              max={totalPages}
              placeholder="pág."
              defaultValue={String(page)}
              key={page}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!Number.isNaN(v) && v >= 1 && v <= totalPages) {
                    setParam('page', String(v));
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="next-page"
              disabled={page >= totalPages}
              onClick={() => setParam('page', String(page + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selected.size} hallazgos?</AlertDialogTitle>
            <AlertDialogDescription>
              Borrado lógico (soft delete). Requiere permiso <span className="font-mono">vulnerabilities.delete</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => runBulkDelete()}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">
              {selected.size} seleccionado{selected.size === 1 ? '' : 's'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[160px]">
                <Select
                  value={bulkEstado}
                  onChange={(e) => setBulkEstado(e.target.value)}
                  options={[{ value: '', label: 'Estado destino…' }, ...estadoBulkOptions]}
                  disabled={!estadoBulkOptions.length}
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={runBulkEstado}
                disabled={bulkMut.isPending || !bulkEstado}
              >
                {bulkMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Aplicar estado
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={runBulkAssignMe} disabled={bulkMut.isPending}>
                Asignarme
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={bulkMut.isPending}
              >
                Eliminar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Limpiar selección
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
