'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { FileSpreadsheet, Filter, PanelRight, Printer, X } from 'lucide-react';

import { VulnerabilidadPreviewSheet } from '@/components/modules/VulnerabilidadPreviewSheet';
import {
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
  Skeleton,
} from '@/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useVulnerabilidadsList } from '@/hooks/useVulnerabilidads';
import { useVulnerabilidadFlujoConfig } from '@/hooks/useOperacionConfig';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { exportXLSX, printTableHtml } from '@/lib/export';
import { labelForEstatusId } from '@/lib/vulnerabilidadFlujo';
import { formatDate } from '@/lib/utils';
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
    return chips;
  }, [estatus, getParam, reinc]);

  const removeChip = (key: string) => {
    if (key === 'reincidencia') setParam('reincidencia', null);
    else if (key === 'q') setParam('q', null);
    else if (key === 'severidad') setParam('severidad', null);
    else if (key === 'fuente') setParam('fuente', null);
    else if (key === 'estado') setParam('estado', null);
    else if (key === 'sla') setParam('sla', null);
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
        description="Filtros compactos (drawer), chips activos, exportación XLS/impresión coherente con la grilla, vista rápida lateral."
      />
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
                <DataTableTh className="w-[1%] font-mono text-[10px]">ID</DataTableTh>
                <DataTableTh>
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
                <DataTableTh className="hidden md:table-cell">Motor</DataTableTh>
                <DataTableTh>
                  <button
                    type="button"
                    className="font-semibold hover:underline"
                    onClick={() => toggleSort('severidad')}
                  >
                    Sev.
                    {curSort === 'severidad' ? (curOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </DataTableTh>
                <DataTableTh className="hidden lg:table-cell">Activo</DataTableTh>
                <DataTableTh className="hidden xl:table-cell">SLA</DataTableTh>
                <DataTableTh className="hidden lg:table-cell">Estado</DataTableTh>
                <DataTableTh className="hidden xl:table-cell">
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
                  <DataTableCell className="font-mono text-[10px] text-muted-foreground">
                    {shortId(item.id)}
                  </DataTableCell>
                  <DataTableCell className="max-w-[200px]">
                    <span className="font-medium text-foreground group-hover:underline">
                      {item.titulo}
                    </span>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground md:hidden">
                      {item.fuente}
                    </p>
                  </DataTableCell>
                  <DataTableCell className="hidden text-sm md:table-cell">
                    <Badge variant="default">{item.fuente}</Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="severity" severityName={item.severidad.toLowerCase()}>
                      {item.severidad}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                    {activoRuta(item)}
                  </DataTableCell>
                  <DataTableCell className="hidden text-xs text-muted-foreground xl:table-cell whitespace-nowrap">
                    {slaSummary(item.fecha_limite_sla)}
                  </DataTableCell>
                  <DataTableCell className="hidden lg:table-cell">
                    <span title={item.estado}>
                      <Badge variant="default">
                        {estatus?.length ? labelForEstatusId(estatus, item.estado) : item.estado}
                      </Badge>
                    </span>
                  </DataTableCell>
                  <DataTableCell className="hidden text-xs text-muted-foreground xl:table-cell whitespace-nowrap">
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
    </PageWrapper>
  );
}
