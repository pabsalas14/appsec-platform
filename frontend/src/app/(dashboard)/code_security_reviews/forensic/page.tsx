'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Network, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { formatDate, repoName, statusLabel } from '@/lib/scr-format';
import { Badge, Button, Card, CardContent, Input, Select, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui';
import type { CodeSecurityEvent, CodeSecurityReview } from '@/types';

type Envelope<T> = { status?: string; data?: T };

type ForensicRow = CodeSecurityEvent & {
  review: CodeSecurityReview;
};

type ForensicInsight = {
  authorEvents?: number;
  highRiskEvents?: number;
  commitEvents?: number;
  anomalies?: number;
};

type SearchType = 'author' | 'repo' | 'pattern' | 'file' | 'date';

export default function ScrForensicHubPage() {
  const [rows, setRows] = useState<ForensicRow[]>([]);
  const [searchType, setSearchType] = useState<SearchType>('author');
  const [query, setQuery] = useState('');
  const [repoFilter, setRepoFilter] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [selected, setSelected] = useState<ForensicRow | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<ForensicInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        setIsLoading(true);
        const response = await api.get<Envelope<ForensicRow[]>>('/code_security_reviews/events/global');
        setRows(response.data.data ?? []);
      } catch (error) {
        logger.error('scr.forensic.load_failed', { error: String(error) });
        toast.error(getApiErrorMessage(error, 'No se pudo cargar la investigación forense'));
      } finally {
        setIsLoading(false);
      }
    }

    void loadEvents();
  }, []);

  const repos = useMemo(
    () => Array.from(new Set(rows.map((row) => repoName(row.review.url_repositorio)).filter((repo) => repo !== 'N/D'))),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const cutoff =
      dateRange === 'all'
        ? null
        : new Date(Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000);
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (repoFilter && repoName(row.review.url_repositorio) !== repoFilter) return false;
      if (cutoff && new Date(row.event_ts) < cutoff) return false;
      if (!normalizedQuery) return true;

      const haystackByType: Record<SearchType, string> = {
        author: row.autor,
        repo: repoName(row.review.url_repositorio),
        pattern: row.indicadores.join(' '),
        file: row.archivo,
        date: formatDate(row.event_ts),
      };
      return haystackByType[searchType].toLowerCase().includes(normalizedQuery);
    });
  }, [dateRange, query, repoFilter, rows, searchType]);

  const authorStats = useMemo(() => {
    const counts = new Map<string, number>();
    filteredRows.forEach((row) => counts.set(row.autor, (counts.get(row.autor) ?? 0) + 1));
    const [author = 'N/D', count = 0] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] ?? [];
    return {
      author,
      count,
      repos: new Set(filteredRows.filter((row) => row.autor === author).map((row) => repoName(row.review.url_repositorio))).size,
      critical: filteredRows.filter((row) => {
        const risk = row.nivel_riesgo.toUpperCase();
        return row.autor === author && (risk === 'CRITICO' || risk === 'CRITICAL' || risk === 'ALTO' || risk === 'HIGH');
      }).length,
    };
  }, [filteredRows]);

  function exportResults() {
    window.location.href = '/api/v1/code_security_reviews/events/export?format=json';
  }

  async function openEvent(row: ForensicRow) {
    setSelected(row);
    setSelectedInsight(null);
    try {
      const [authorResponse, commitResponse, anomaliesResponse] = await Promise.allSettled([
        api.get<Envelope<{ analysis?: { total_events?: number; high_risk_events?: number } }>>(
          `/code_security_reviews/${row.review_id}/author-analysis/${encodeURIComponent(row.autor)}`,
        ),
        api.get<Envelope<{ events?: CodeSecurityEvent[] }>>(
          `/code_security_reviews/${row.review_id}/commit/${row.commit_hash}/details`,
        ),
        api.get<Envelope<{ total?: number }>>(`/code_security_reviews/${row.review_id}/anomalies`),
      ]);
      setSelectedInsight({
        authorEvents:
          authorResponse.status === 'fulfilled' ? authorResponse.value.data.data?.analysis?.total_events ?? 0 : undefined,
        highRiskEvents:
          authorResponse.status === 'fulfilled' ? authorResponse.value.data.data?.analysis?.high_risk_events ?? 0 : undefined,
        commitEvents: commitResponse.status === 'fulfilled' ? commitResponse.value.data.data?.events?.length ?? 0 : undefined,
        anomalies: anomaliesResponse.status === 'fulfilled' ? anomaliesResponse.value.data.data?.total ?? 0 : undefined,
      });
    } catch (error) {
      logger.error('scr.forensic.insight_failed', { error: String(error), eventId: row.id });
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">SCR / <span className="text-foreground">Investigación Forense</span></div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <Network className="h-6 w-6 text-primary" />
            Investigación Forense
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta eventos históricos por autor, repositorio, patrón, archivo o fecha.
          </p>
        </div>
        <Button variant="outline" onClick={exportResults}>
          <Download className="mr-2 h-4 w-4" />
          Exportar resultados
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="text-sm font-semibold">Búsqueda Forense</div>
          <p className="text-xs text-muted-foreground">
            Busca señales de actividad sospechosa en eventos forenses generados por el Detective Agent.
          </p>
          <div className="flex flex-wrap gap-2">
            <Select
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as SearchType)}
              options={[
                { value: 'author', label: 'Por Autor' },
                { value: 'repo', label: 'Por Repositorio' },
                { value: 'pattern', label: 'Por Patrón' },
                { value: 'file', label: 'Por Archivo' },
                { value: 'date', label: 'Por Fecha' },
              ]}
            />
            <div className="relative min-w-72 flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Autor, repo, indicador, archivo..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Select
              value={repoFilter}
              onChange={(event) => setRepoFilter(event.target.value)}
              options={[{ value: '', label: 'Todos los repos' }, ...repos.map((repo) => ({ value: repo, label: repo }))]}
            />
            <Select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
              options={[
                { value: '30', label: 'Últimos 30 días' },
                { value: '90', label: 'Últimos 90 días' },
                { value: '180', label: 'Últimos 6 meses' },
                { value: '365', label: 'Último año' },
                { value: 'all', label: 'Todo el historial' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Perfil del Autor</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500 bg-red-950 text-sm font-bold text-red-300">
                {authorStats.author.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{authorStats.author}</div>
                <div className="text-xs text-muted-foreground">Eventos: {authorStats.count}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Repos afectados</span><span>{authorStats.repos}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Eventos críticos</span><Badge variant="destructive">{authorStats.critical}</Badge></div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="mb-3 text-xs font-medium text-muted-foreground">Resumen de actividad</div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-background p-3 text-center"><div className="text-2xl font-bold">{filteredRows.length}</div><div className="text-xs text-muted-foreground">Eventos</div></div>
              <div className="rounded-lg bg-background p-3 text-center"><div className="text-2xl font-bold">{new Set(filteredRows.map((row) => row.autor)).size}</div><div className="text-xs text-muted-foreground">Autores</div></div>
              <div className="rounded-lg bg-background p-3 text-center"><div className="text-2xl font-bold">{new Set(filteredRows.map((row) => repoName(row.review.url_repositorio))).size}</div><div className="text-xs text-muted-foreground">Repos</div></div>
              <div className="rounded-lg bg-background p-3 text-center"><div className="text-2xl font-bold">{filteredRows.filter((row) => {
                const risk = row.nivel_riesgo.toUpperCase();
                return risk === 'CRITICO' || risk === 'CRITICAL' || risk === 'ALTO' || risk === 'HIGH';
              }).length}</div><div className="text-xs text-muted-foreground">Alto riesgo</div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-background text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium">Commit Hash</th>
                  <th className="px-3 py-2 text-left font-medium">Repositorio</th>
                  <th className="px-3 py-2 text-left font-medium">Mensaje</th>
                  <th className="px-3 py-2 text-left font-medium">Archivo</th>
                  <th className="px-3 py-2 text-left font-medium">Fecha / Hora</th>
                  <th className="px-3 py-2 text-left font-medium">Anomalías</th>
                  <th className="px-3 py-2 text-left font-medium">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Cargando eventos...</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No hay eventos forenses con los filtros actuales.</td></tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} onClick={() => void openEvent(row)} className="cursor-pointer border-b border-border hover:bg-muted/40">
                      <td className="px-3 py-2 font-mono text-primary">{row.commit_hash.slice(0, 8)}</td>
                      <td className="px-3 py-2">{repoName(row.review.url_repositorio)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.mensaje_commit ?? row.descripcion ?? 'N/D'}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{row.archivo}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(row.event_ts)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {row.indicadores.map((indicator) => <Badge key={indicator} variant="outline">{indicator}</Badge>)}
                        </div>
                      </td>
                      <td className="px-3 py-2"><Badge variant="severity" severityName={row.nivel_riesgo}>{statusLabel(row.nivel_riesgo)}</Badge></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Detalle forense</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="font-mono text-primary">{selected.commit_hash}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{formatDate(selected.event_ts)} · {selected.autor}</div>
                </div>
                <div className="grid gap-3">
                  <div><div className="text-xs text-muted-foreground">Escaneo</div><Link className="text-primary hover:underline" href={`/code_security_reviews/${selected.review.id}`}>{selected.review.titulo}</Link></div>
                  <div><div className="text-xs text-muted-foreground">Repositorio / archivo</div><div>{repoName(selected.review.url_repositorio)} / <span className="font-mono">{selected.archivo}</span></div></div>
                  <div><div className="text-xs text-muted-foreground">Acción</div><div>{selected.accion}</div></div>
                  <div><div className="text-xs text-muted-foreground">Riesgo</div><Badge variant="severity" severityName={selected.nivel_riesgo}>{selected.nivel_riesgo}</Badge></div>
                  <div><div className="text-xs text-muted-foreground">Indicadores</div><div className="mt-1 flex flex-wrap gap-1">{selected.indicadores.map((indicator) => <Badge key={indicator} variant="outline">{indicator}</Badge>)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Descripción</div><p className="text-muted-foreground">{selected.descripcion ?? 'Sin descripción.'}</p></div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="mb-2 text-xs font-semibold text-muted-foreground">Análisis conectado</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Eventos del autor:</span> {selectedInsight?.authorEvents ?? '...'}</div>
                      <div><span className="text-muted-foreground">Alto riesgo:</span> {selectedInsight?.highRiskEvents ?? '...'}</div>
                      <div><span className="text-muted-foreground">Eventos del commit:</span> {selectedInsight?.commitEvents ?? '...'}</div>
                      <div><span className="text-muted-foreground">Anomalías revisión:</span> {selectedInsight?.anomalies ?? '...'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
