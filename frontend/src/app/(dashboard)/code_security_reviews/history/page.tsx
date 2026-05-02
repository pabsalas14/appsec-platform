'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, GitCompare } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import {
  downloadJson,
  formatDate,
  formatDuration,
  formatUsd,
  getConfigString,
  repoName,
  scanModeLabel,
  severityCounts,
  statusLabel,
} from '@/lib/scr-format';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui';
import type { CodeSecurityFinding, CodeSecurityReview } from '@/types';

type Envelope<T> = { status?: string; data?: T };

type ReviewRow = CodeSecurityReview & {
  findings: CodeSecurityFinding[];
};

type Filters = {
  search: string;
  status: string;
  repo: string;
  provider: string;
};

const initialFilters: Filters = { search: '', status: '', repo: '', provider: '' };

export default function CodeSecurityReviewHistoryPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selected, setSelected] = useState<ReviewRow | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const reviewsResponse = await api.get<Envelope<CodeSecurityReview[]>>('/code_security_reviews/');
        const reviews = reviewsResponse.data.data ?? [];
        const withFindings = await Promise.all(
          reviews.map(async (review) => {
            const response = await api.get<Envelope<CodeSecurityFinding[]>>(`/code_security_reviews/${review.id}/findings`);
            return { ...review, findings: response.data.data ?? [] };
          }),
        );
        setRows(withFindings);
      } catch (error) {
        logger.error('scr.history.load_failed', { error: String(error) });
        toast.error(getApiErrorMessage(error, 'No se pudo cargar el historial SCR'));
      } finally {
        setIsLoading(false);
      }
    }

    void loadHistory();
  }, []);

  const repos = useMemo(
    () => Array.from(new Set(rows.map((row) => repoName(row.url_repositorio)).filter((repo) => repo !== 'N/D'))),
    [rows],
  );
  const providers = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => getConfigString(row, ['llm_provider', 'provider']))
            .filter((provider): provider is string => Boolean(provider)),
        ),
      ),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (search) {
          const searchable = [row.titulo, row.url_repositorio ?? '', row.github_org_slug ?? '', row.scan_mode].join(' ').toLowerCase();
          if (!searchable.includes(search)) return false;
        }
        if (filters.status && row.estado !== filters.status) return false;
        if (filters.repo && repoName(row.url_repositorio) !== filters.repo) return false;
        if (filters.provider && getConfigString(row, ['llm_provider', 'provider']) !== filters.provider) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filters, rows]);

  const selectedCompareRows = useMemo(
    () => Array.from(compareIds).map((id) => rows.find((row) => row.id === id)).filter((row): row is ReviewRow => Boolean(row)),
    [compareIds, rows],
  );

  function toggleCompare(row: ReviewRow) {
    setCompareIds((current) => {
      const next = new Set(current);
      if (next.has(row.id)) {
        next.delete(row.id);
        return next;
      }
      if (next.size >= 2) {
        toast.error('Solo puedes comparar 2 escaneos a la vez');
        return next;
      }
      const existing = Array.from(next).map((id) => rows.find((item) => item.id === id)).filter(Boolean);
      if (existing.length > 0 && repoName(existing[0]?.url_repositorio) !== repoName(row.url_repositorio)) {
        toast.error('Selecciona escaneos del mismo repositorio para comparar');
        return next;
      }
      next.add(row.id);
      return next;
    });
  }

  function exportHistory() {
    downloadJson('scr-historial.json', filteredRows);
  }

  function exportReview(row: ReviewRow, format: 'json' | 'pdf') {
    window.location.href = `/api/v1/code_security_reviews/${row.id}/export?format=${format}`;
  }

  function exportComparisonPdf() {
    if (selectedCompareRows.length !== 2) return;
    const [base, target] = selectedCompareRows;
    window.location.href = `/api/v1/code_security_reviews/compare/export?format=pdf&base_review_id=${base.id}&target_review_id=${target.id}`;
  }

  async function rerunScan(row: ReviewRow) {
    try {
      const response = await api.post<Envelope<CodeSecurityReview>>('/code_security_reviews/', {
        titulo: `${row.titulo} - re-escaneo`,
        descripcion: row.descripcion,
        estado: 'PENDING',
        progreso: 0,
        rama_analizar: row.rama_analizar,
        url_repositorio: row.url_repositorio,
        scan_mode: row.scan_mode,
        repositorio_id: row.repositorio_id,
        github_org_slug: row.github_org_slug,
        scan_batch_id: row.scan_batch_id,
        scr_config: row.scr_config ?? {},
      });
      const created = response.data.data;
      if (created?.id) {
        await api.post(`/code_security_reviews/${created.id}/analyze`);
      }
      toast.success('Re-escaneo encolado');
    } catch (error) {
      logger.error('scr.history.rerun_failed', { error: String(error), reviewId: row.id });
      toast.error('No se pudo re-escanear');
    }
  }

  return (
    <div className="space-y-0">
      <div className="border-b border-border bg-card/70 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">SCR / <span className="text-foreground">Historial de Escaneos</span></div>
            <h1 className="mt-1 text-xl font-semibold">Historial de Escaneos</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {compareIds.size === 2 && (
              <Button size="sm" onClick={() => setCompareOpen(true)}>
                <GitCompare className="mr-2 h-4 w-4" />
                Comparar seleccionados
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportHistory}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV/JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/50 px-4 py-3">
        <Input
          className="w-64"
          placeholder="Buscar por repositorio, nombre..."
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <Select
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          options={[
            { value: '', label: 'Todos los estatus' },
            { value: 'COMPLETED', label: 'Completado' },
            { value: 'FAILED', label: 'Fallido' },
            { value: 'ANALYZING', label: 'En ejecución' },
            { value: 'PENDING', label: 'Pendiente' },
          ]}
        />
        <Select
          value={filters.repo}
          onChange={(event) => setFilters({ ...filters, repo: event.target.value })}
          options={[{ value: '', label: 'Todos los repos' }, ...repos.map((repo) => ({ value: repo, label: repo }))]}
        />
        <Select
          value={filters.provider}
          onChange={(event) => setFilters({ ...filters, provider: event.target.value })}
          options={[{ value: '', label: 'Todos los proveedores' }, ...providers.map((provider) => ({ value: provider, label: provider }))]}
        />
        <div className="ml-auto text-xs text-muted-foreground">Selecciona 2 escaneos del mismo repo para comparar</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-background text-muted-foreground">
            <tr className="border-b border-border">
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 text-left font-medium">Nombre del Escaneo</th>
              <th className="px-3 py-2 text-left font-medium">Repositorio(s)</th>
              <th className="px-3 py-2 text-left font-medium">Modalidad</th>
              <th className="px-3 py-2 text-left font-medium">Proveedor LLM</th>
              <th className="px-3 py-2 text-center font-medium">C</th>
              <th className="px-3 py-2 text-center font-medium">H</th>
              <th className="px-3 py-2 text-center font-medium">M</th>
              <th className="px-3 py-2 text-center font-medium">L</th>
              <th className="px-3 py-2 text-left font-medium">Duración</th>
              <th className="px-3 py-2 text-right font-medium">Costo USD</th>
              <th className="px-3 py-2 text-left font-medium">Estatus</th>
              <th className="px-3 py-2 text-left font-medium">Fecha</th>
              <th className="px-3 py-2 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={14} className="py-12 text-center text-muted-foreground">Cargando historial...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={14} className="py-12 text-center text-muted-foreground">No hay escaneos con los filtros actuales.</td></tr>
            ) : (
              filteredRows.map((row) => {
                const counts = severityCounts(row.findings);
                const provider = getConfigString(row, ['llm_provider', 'provider']) ?? 'N/D';
                const model = getConfigString(row, ['llm_model', 'model']) ?? 'N/D';
                return (
                  <tr
                    key={row.id}
                    className={cn('border-b border-border hover:bg-muted/40', compareIds.has(row.id) && 'bg-primary/10')}
                  >
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={compareIds.has(row.id)} onChange={() => toggleCompare(row)} />
                    </td>
                    <td className="cursor-pointer px-3 py-2" onClick={() => setSelected(row)}>
                      <div className="font-medium text-foreground">{row.titulo}</div>
                      <div className="text-muted-foreground">{row.id.slice(0, 8)}</div>
                    </td>
                    <td className="cursor-pointer px-3 py-2" onClick={() => setSelected(row)}>
                      <div>{repoName(row.url_repositorio)}</div>
                      {row.github_org_slug && <div className="text-muted-foreground">{row.github_org_slug}</div>}
                    </td>
                    <td className="cursor-pointer px-3 py-2 text-muted-foreground" onClick={() => setSelected(row)}>{scanModeLabel(row.scan_mode)}</td>
                    <td className="cursor-pointer px-3 py-2" onClick={() => setSelected(row)}><div>{provider}</div><div className="text-muted-foreground">{model}</div></td>
                    <td className="px-3 py-2 text-center"><Badge variant="severity" severityName="critical">{counts.critical}</Badge></td>
                    <td className="px-3 py-2 text-center"><Badge variant="severity" severityName="high">{counts.high}</Badge></td>
                    <td className="px-3 py-2 text-center"><Badge variant="severity" severityName="medium">{counts.medium}</Badge></td>
                    <td className="px-3 py-2 text-center"><Badge variant="severity" severityName="low">{counts.low}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDuration(row.duration_ms)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatUsd(row.estimated_cost_usd)}</td>
                    <td className="px-3 py-2"><Badge variant={row.estado === 'FAILED' ? 'destructive' : 'success'}>{statusLabel(row.estado)}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(row.created_at)}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button className="text-primary hover:underline" onClick={() => exportReview(row, 'pdf')}>PDF</button>
                        <span className="text-muted-foreground">|</span>
                        <button className="text-muted-foreground hover:text-foreground" onClick={() => exportReview(row, 'json')}>JSON</button>
                        <span className="text-muted-foreground">|</span>
                        <Link className="text-blue-400 hover:underline" href={`/code_security_reviews/${row.id}`}>Ver</Link>
                        {row.estado === 'COMPLETED' && (
                          <>
                            <span className="text-muted-foreground">|</span>
                            <button className="text-emerald-400 hover:underline" onClick={() => void rerunScan(row)}>Re-escanear</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.titulo}</SheetTitle>
                <div className="text-xs text-muted-foreground">{selected.id.slice(0, 8)} · {formatDate(selected.created_at)}</div>
              </SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Repositorio(s)" value={repoName(selected.url_repositorio)} />
                  <InfoCard label="Modalidad" value={scanModeLabel(selected.scan_mode)} />
                  <InfoCard label="Proveedor LLM" value={`${getConfigString(selected, ['llm_provider', 'provider']) ?? 'N/D'} · ${getConfigString(selected, ['llm_model', 'model']) ?? 'N/D'}`} />
                  <InfoCard label="Estatus" value={statusLabel(selected.estado)} />
                  <InfoCard label="Duración" value={formatDuration(selected.duration_ms)} />
                  <InfoCard label="Costo USD" value={formatUsd(selected.estimated_cost_usd)} />
                  <InfoCard label="Tokens LLM" value={`${selected.total_tokens_used ?? 0}`} />
                </div>
                <div>
                  <div className="mb-2 font-medium">Distribución de Hallazgos</div>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(severityCounts(selected.findings)).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-border bg-background p-3 text-center">
                        <div className="text-2xl font-bold">{value}</div>
                        <div className="text-xs capitalize text-muted-foreground">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/code_security_reviews/${selected.id}?tab=findings`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
                  >
                    Ver Hallazgos
                  </Link>
                  <Button variant="outline" className="flex-1" onClick={() => exportReview(selected, 'pdf')}>Exportar PDF</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Comparación de Escaneos</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {selectedCompareRows.map((row) => {
              const counts = severityCounts(row.findings);
              return (
                <Card key={row.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="font-semibold">{row.titulo}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(row.created_at)}</div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div><div className="text-lg font-bold text-red-400">{counts.critical}</div><div>C</div></div>
                      <div><div className="text-lg font-bold text-orange-400">{counts.high}</div><div>H</div></div>
                      <div><div className="text-lg font-bold text-yellow-400">{counts.medium}</div><div>M</div></div>
                      <div><div className="text-lg font-bold text-green-400">{counts.low}</div><div>L</div></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={exportComparisonPdf} disabled={selectedCompareRows.length !== 2}>
              <Download className="mr-2 h-4 w-4" />
              Exportar comparación PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground">{value}</div>
    </div>
  );
}
