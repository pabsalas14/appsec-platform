'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';

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
import { useVulnerabilidadsList } from '@/hooks/useVulnerabilidads';
import { useVulnerabilidadFlujoConfig } from '@/hooks/useOperacionConfig';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { labelForEstatusId } from '@/lib/vulnerabilidadFlujo';
import { formatDate } from '@/lib/utils';

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

export default function VulnerabilidadsPage() {
  const { data: flujo, isLoading: flujoLoading } = useVulnerabilidadFlujoConfig();
  const { getParam, setParam, setParams, searchParams } = useUrlFilters();

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
  const items = data?.items ?? [];
  const totalPages = Math.max(1, meta?.total_pages ?? 1);
  const page = meta?.page ?? 1;

  const reinc = getParam('reincidencia') === 'true' || getParam('reincidencia') === '1';

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
      <PageHeader
        title="Vulnerabilidades"
        description="Módulo 9: listado con búsqueda, filtros, orden y paginación en servidor (BRD P19–P20). Comparte la vista por URL."
      />
      {flujoLoading && <p className="text-xs text-muted-foreground">Cargando catálogo de estatus…</p>}
      <div className="mb-4 flex max-w-5xl flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-0 flex-1 lg:min-w-[200px]">
          <label className="text-sm font-medium">Buscar</label>
          <Input
            className="mt-1"
            placeholder="Título, descripción, fuente…"
            value={getParam('q') ?? ''}
            onChange={(e) => setParam('q', e.target.value || null)}
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium">Severidad</label>
          <Select
            className="mt-1"
            value={getParam('severidad') ?? ''}
            onChange={(e) => setParam('severidad', e.target.value || null)}
            options={SEVERIDAD_OPTS}
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium">Motor (fuente)</label>
          <Select
            className="mt-1"
            value={getParam('fuente') ?? ''}
            onChange={(e) => setParam('fuente', e.target.value || null)}
            options={FUENTE_OPTS}
          />
        </div>
        <div className="w-full sm:min-w-[200px] sm:flex-1">
          <label className="text-sm font-medium">Estado (D1)</label>
          <Select
            className="mt-1"
            value={getParam('estado') ?? ''}
            onChange={(e) => setParam('estado', e.target.value || null)}
            options={estadoOptions}
            disabled={!estatus?.length}
          />
        </div>
        <div className="w-full sm:w-48">
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
        <div className="flex items-center gap-2 pt-6">
          <Checkbox
            id="rein"
            checked={reinc}
            onChange={(e) => setParam('reincidencia', e.target.checked ? 'true' : null)}
          />
          <label htmlFor="rein" className="text-sm text-muted-foreground">
            Solo reincidencia (CWE repetido)
          </label>
        </div>
        <div className="w-full sm:w-36">
          <label className="text-sm font-medium">Por página</label>
          <Select
            className="mt-1"
            value={getParam('page_size') ?? '20'}
            onChange={(e) => setParam('page_size', e.target.value)}
            options={PAGE_SIZES}
          />
        </div>
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          onClick={() =>
            setParams({
              q: null,
              severidad: null,
              sla: null,
              estado: null,
              fuente: null,
              reincidencia: null,
              page: null,
            })
          }
        >
          Limpiar filtros
        </button>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-2">
          <DataTable>
            <DataTableHead>
              <tr>
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
                <DataTableRow key={item.id}>
                  <DataTableCell className="max-w-[220px]">
                    <Link
                      href={`/vulnerabilidads/${item.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.titulo}
                    </Link>
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
                  <DataTableCell className="text-right text-xs text-muted-foreground">→</DataTableCell>
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
