'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, FileText, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import {
  confidencePercent,
  downloadJson,
  formatDate,
  repoName,
  severityCounts,
  severityLabel,
  statusLabel,
} from '@/lib/scr-format';
import { Badge, Button, Card, CardContent, Input, Select, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui';
import type { CodeSecurityFinding, CodeSecurityReview } from '@/types';

type Envelope<T> = { status?: string; data?: T };

type FindingRow = CodeSecurityFinding & {
  review: CodeSecurityReview;
};

type Filters = {
  search: string;
  severity: string;
  status: string;
  pattern: string;
  repo: string;
};

const initialFilters: Filters = {
  search: '',
  severity: '',
  status: '',
  pattern: '',
  repo: '',
};

const severityOptions = [
  { value: 'CRITICO', label: 'Critical' },
  { value: 'ALTO', label: 'High' },
  { value: 'MEDIO', label: 'Medium' },
  { value: 'BAJO', label: 'Low' },
];

export default function ScrFindingsHubPage() {
  const [rows, setRows] = useState<FindingRow[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selected, setSelected] = useState<FindingRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('IN_REVIEW');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFindings() {
      try {
        setIsLoading(true);
        const response = await api.get<Envelope<FindingRow[]>>('/code_security_reviews/findings/global');
        setRows(response.data.data ?? []);
      } catch (error) {
        logger.error('scr.findings.load_failed', { error: String(error) });
        toast.error(getApiErrorMessage(error, 'No se pudieron cargar los hallazgos SCR'));
      } finally {
        setIsLoading(false);
      }
    }

    void loadFindings();
  }, []);

  const repos = useMemo(
    () => Array.from(new Set(rows.map((row) => repoName(row.review.url_repositorio)).filter((repo) => repo !== 'N/D'))),
    [rows],
  );
  const patterns = useMemo(() => Array.from(new Set(rows.map((row) => row.tipo_malicia))).sort(), [rows]);
  const statuses = useMemo(() => Array.from(new Set(rows.map((row) => row.estado))).sort(), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const search = filters.search.trim().toLowerCase();
      if (search) {
        const searchable = [
          row.tipo_malicia,
          row.archivo,
          row.descripcion,
          row.review.titulo,
          row.review.url_repositorio ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(search)) return false;
      }
      if (filters.severity && row.severidad !== filters.severity) return false;
      if (filters.status && row.estado !== filters.status) return false;
      if (filters.pattern && row.tipo_malicia !== filters.pattern) return false;
      if (filters.repo && repoName(row.review.url_repositorio) !== filters.repo) return false;
      return true;
    });
  }, [filters, rows]);

  const counts = severityCounts(filteredRows);

  function clearFilters() {
    setFilters(initialFilters);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportRows(format: 'json' | 'csv', onlySelected = false) {
    if (!onlySelected) {
      window.location.href = `/api/v1/code_security_reviews/findings/export?format=${format}`;
      return;
    }
    const sourceRows = onlySelected ? filteredRows.filter((row) => selectedIds.has(row.id)) : filteredRows;
    const payload = sourceRows.map((row) => ({
      id: row.id,
      review_id: row.review_id,
      escaneo: row.review.titulo,
      repositorio: repoName(row.review.url_repositorio),
      archivo: row.archivo,
      lineas: `${row.linea_inicio}-${row.linea_fin}`,
      severidad: row.severidad,
      patron: row.tipo_malicia,
      estado: row.estado,
      analista: row.assignee_email ?? '',
      confianza: row.confianza,
      descripcion: row.descripcion,
    }));
    if (format === 'json') {
      downloadJson('scr-hallazgos.json', payload);
      return;
    }
    const header = Object.keys(payload[0] ?? { id: '' });
    const csv = [header.join(','), ...payload.map((row) => header.map((key) => JSON.stringify(row[key as keyof typeof row] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scr-hallazgos.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function runBulkAction(action: 'status' | 'assign' | 'fp') {
    const selectedRows = rows.filter((row) => selectedIds.has(row.id));
    if (selectedRows.length === 0) return;
    const byReview = selectedRows.reduce<Record<string, string[]>>((acc, row) => {
      acc[row.review_id] = [...(acc[row.review_id] ?? []), row.id];
      return acc;
    }, {});
    try {
      if (action === 'status') {
        await Promise.all(
          Object.entries(byReview).map(([reviewId, findingIds]) =>
            api.patch(`/code_security_reviews/${reviewId}/findings/bulk/status`, {
              finding_ids: findingIds,
              new_status: bulkStatus,
            }),
          ),
        );
        setRows((current) => current.map((row) => (selectedIds.has(row.id) ? { ...row, estado: bulkStatus } : row)));
      }
      if (action === 'assign') {
        const email = window.prompt('Email del analista a asignar');
        if (!email) return;
        await Promise.all(
          Object.entries(byReview).map(([reviewId, findingIds]) =>
            api.patch(`/code_security_reviews/${reviewId}/findings/bulk/assign`, {
              finding_ids: findingIds,
              assignee_email: email,
            }),
          ),
        );
        setRows((current) =>
          current.map((row) => (selectedIds.has(row.id) ? { ...row, assignee_email: email, assignee_name: email } : row)),
        );
      }
      if (action === 'fp') {
        const reason = window.prompt('Motivo del falso positivo', 'FALSE_ALARM');
        if (!reason) return;
        await Promise.all(
          Object.entries(byReview).map(([reviewId, findingIds]) =>
            api.post(`/code_security_reviews/${reviewId}/findings/bulk/false-positive`, {
              finding_ids: findingIds,
              reason,
            }),
          ),
        );
        setRows((current) => current.map((row) => (selectedIds.has(row.id) ? { ...row, estado: 'FALSE_POSITIVE' } : row)));
      }
      setSelectedIds(new Set());
      toast.success('Acción masiva aplicada');
    } catch (error) {
      logger.error('scr.findings.bulk_action_failed', { error: String(error), action });
      toast.error('No se pudo aplicar la acción masiva');
    }
  }

  return (
    <div className="space-y-0">
      <div className="border-b border-border bg-card/70 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">SCR / <span className="text-foreground">Hallazgos</span></div>
            <h1 className="mt-1 text-xl font-semibold">Hallazgos SCR</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportRows('csv')}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportRows('json')}>
              <FileText className="mr-2 h-4 w-4" />
              Reporte JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-card/50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar hallazgo, archivo, función..."
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </div>
          <Button
            variant={filters.severity === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, severity: '' })}
          >
            Todas
          </Button>
          {severityOptions.map((option) => (
            <Button
              key={option.value}
              variant={filters.severity === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, severity: option.value })}
            >
              {option.label}
            </Button>
          ))}
          <Select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            options={[{ value: '', label: 'Todos los estatus' }, ...statuses.map((status) => ({ value: status, label: statusLabel(status) }))]}
          />
          <Select
            value={filters.pattern}
            onChange={(event) => setFilters({ ...filters, pattern: event.target.value })}
            options={[{ value: '', label: 'Todos los patrones' }, ...patterns.map((pattern) => ({ value: pattern, label: pattern }))]}
          />
          <Select
            value={filters.repo}
            onChange={(event) => setFilters({ ...filters, repo: event.target.value })}
            options={[{ value: '', label: 'Todos los repos' }, ...repos.map((repo) => ({ value: repo, label: repo }))]}
          />
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>

      <div className="border-b border-border bg-background px-4 py-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4">
            <span>Mostrando <strong className="text-foreground">{filteredRows.length}</strong> hallazgos</span>
            <span className="text-red-400">{counts.critical} Critical</span>
            <span className="text-orange-400">{counts.high} High</span>
            <span className="text-yellow-400">{counts.medium} Medium</span>
            <span className="text-green-400">{counts.low} Low</span>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
              onChange={(event) => setSelectedIds(event.target.checked ? new Set(filteredRows.map((row) => row.id)) : new Set())}
            />
            Seleccionar todos
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b border-border text-muted-foreground">
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 text-left font-medium">Severidad</th>
              <th className="px-3 py-2 text-left font-medium">Patrón</th>
              <th className="px-3 py-2 text-left font-medium">Repositorio / Archivo</th>
              <th className="px-3 py-2 text-left font-medium">Función / Línea</th>
              <th className="px-3 py-2 text-left font-medium">Estatus</th>
              <th className="px-3 py-2 text-left font-medium">Analista</th>
              <th className="px-3 py-2 text-left font-medium">Detectado</th>
              <th className="px-3 py-2 text-left font-medium">Confianza</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Cargando hallazgos...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No hay hallazgos con los filtros actuales.</td></tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className={cn('cursor-pointer border-b border-border hover:bg-muted/40', selected?.id === row.id && 'bg-primary/10')}
                  onClick={() => setSelected(row)}
                >
                  <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelection(row.id)} />
                  </td>
                  <td className="px-3 py-2"><Badge variant="severity" severityName={row.severidad}>{severityLabel(row.severidad)}</Badge></td>
                  <td className="px-3 py-2"><Badge variant="outline">{row.tipo_malicia}</Badge></td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{repoName(row.review.url_repositorio)}</div>
                    <div className="font-mono text-muted-foreground">{row.archivo}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.linea_inicio}-{row.linea_fin}</td>
                  <td className="px-3 py-2"><Badge variant="secondary">{statusLabel(row.estado)}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{row.assignee_name || row.assignee_email || 'Sin asignar'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(row.created_at ?? row.review.created_at)}</td>
                  <td className="px-3 py-2 text-foreground">{confidencePercent(row.confianza)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card px-4 py-3">
          <span className="text-sm"><strong>{selectedIds.size}</strong> hallazgos seleccionados</span>
          <div className="flex flex-wrap gap-2">
            <Select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value)}
              options={[
                { value: 'IN_REVIEW', label: 'En revisión' },
                { value: 'IN_CORRECTION', label: 'En corrección' },
                { value: 'CORRECTED', label: 'Corregido' },
                { value: 'VERIFIED', label: 'Certificado' },
                { value: 'CLOSED', label: 'Cerrado' },
              ]}
            />
            <Button variant="outline" size="sm" onClick={() => void runBulkAction('assign')}>Asignar</Button>
            <Button variant="outline" size="sm" onClick={() => void runBulkAction('status')}>Cambiar estatus</Button>
            <Button variant="outline" size="sm" onClick={() => exportRows('json', true)}>Exportar selección</Button>
            <Button variant="outline" size="sm" onClick={() => void runBulkAction('fp')}>Marcar FP</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Limpiar</Button>
          </div>
        </div>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.tipo_malicia}</SheetTitle>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="severity" severityName={selected.severidad}>{severityLabel(selected.severidad)}</Badge>
                  <Badge variant="secondary">{statusLabel(selected.estado)}</Badge>
                  <Badge variant="outline">{confidencePercent(selected.confianza)}</Badge>
                  <Badge variant="outline">{selected.assignee_name || selected.assignee_email || 'Sin asignar'}</Badge>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <Card><CardContent className="space-y-2 p-4">
                  <div className="text-xs text-muted-foreground">Escaneo</div>
                  <Link href={`/code_security_reviews/${selected.review.id}`} className="font-medium text-primary hover:underline">
                    {selected.review.titulo}
                  </Link>
                  <div className="text-xs text-muted-foreground">{repoName(selected.review.url_repositorio)} / {selected.archivo}:{selected.linea_inicio}-{selected.linea_fin}</div>
                </CardContent></Card>
                <section>
                  <h3 className="mb-2 font-semibold">Detalle técnico</h3>
                  <p className="text-muted-foreground">{selected.descripcion}</p>
                </section>
                {selected.codigo_snippet && (
                  <section>
                    <h3 className="mb-2 font-semibold">Código</h3>
                    <pre className="overflow-auto rounded-md border border-border bg-background p-3 text-xs">{selected.codigo_snippet}</pre>
                  </section>
                )}
                {selected.impacto && <section><h3 className="mb-2 font-semibold">Impacto</h3><p className="text-muted-foreground">{selected.impacto}</p></section>}
                {selected.remediacion_sugerida && <section><h3 className="mb-2 font-semibold">Remediación</h3><p className="text-muted-foreground">{selected.remediacion_sugerida}</p></section>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
