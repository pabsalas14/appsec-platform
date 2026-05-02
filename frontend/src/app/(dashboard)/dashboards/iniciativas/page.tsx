'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  MessageCircle,
  Target,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import type { Iniciativa } from '@/lib/schemas/iniciativa.schema';
import type { HitoIniciativa } from '@/lib/schemas/hito_iniciativa.schema';
import { extractErrorMessage } from '@/lib/utils';
import { useIniciativas } from '@/hooks/useIniciativas';

interface ActualizacionRow {
  id: string;
  titulo: string;
  contenido: string;
  iniciativa_id: string;
  created_at: string;
}

function normEstado(s: string): string {
  return s.trim().toLowerCase();
}

function DetailPanel({
  initiativeId,
  onClose,
}: {
  initiativeId: string;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['iniciativa-panel-detail', initiativeId],
    queryFn: async () => {
      logger.info('iniciativa.panel.detail.fetch', { id: initiativeId });
      const [iniRes, hitosRes, actRes] = await Promise.all([
        apiClient.get<{ data: Iniciativa }>(`/iniciativas/${initiativeId}`),
        apiClient.get<{ data: HitoIniciativa[] }>(`/hito_iniciativas/`, {
          params: { iniciativa_id: initiativeId },
        }),
        apiClient.get<{ data: ActualizacionRow[] }>(`/actualizacion_iniciativas/`),
      ]);
      const iniciativa = iniRes.data.data;
      const hitos = hitosRes.data.data ?? [];
      const actualizaciones = (actRes.data.data ?? []).filter((a) => a.iniciativa_id === initiativeId);
      const completed = hitos.filter((h) => normEstado(h.estado ?? '') === 'completado').length;
      const pct =
        hitos.length === 0 ? 0 : Math.round((completed / hitos.length) * 100);
      return { iniciativa, hitos, actualizaciones, pctHitos: pct };
    },
    enabled: Boolean(initiativeId),
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-lg">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-lg font-semibold">Detalle de iniciativa</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{extractErrorMessage(error, 'No se pudo cargar el detalle.')}</p>
        ) : data ? (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground">Iniciativa</p>
              <p className="text-xl font-semibold">{data.iniciativa.titulo}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{data.iniciativa.tipo}</Badge>
                <Badge variant="secondary">{data.iniciativa.estado}</Badge>
              </div>
              {data.iniciativa.descripcion ? (
                <p className="mt-3 text-sm text-muted-foreground">{data.iniciativa.descripcion}</p>
              ) : null}
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Avance hitos</p>
              <p className="text-2xl font-bold text-primary">{data.pctHitos}%</p>
              <p className="text-xs text-muted-foreground">
                {data.hitos.filter((h) => normEstado(h.estado ?? '') === 'completado').length} de{' '}
                {data.hitos.length} hitos completados
              </p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4" /> Fechas
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Inicio:{' '}
                  {data.iniciativa.fecha_inicio
                    ? new Date(data.iniciativa.fecha_inicio).toLocaleString('es-ES')
                    : '—'}
                </p>
                <p>
                  Fin estimada:{' '}
                  {data.iniciativa.fecha_fin_estimada
                    ? new Date(data.iniciativa.fecha_fin_estimada).toLocaleString('es-ES')
                    : '—'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4" /> Hitos
              </h3>
              {data.hitos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin hitos registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {data.hitos.map((h) => (
                    <li key={h.id} className="rounded-md border border-border p-2 text-sm">
                      <span className="font-medium">{h.nombre}</span>
                      {h.peso != null ? (
                        <span className="ml-2 text-xs text-muted-foreground">peso {h.peso}</span>
                      ) : null}
                      <span className="ml-2 text-muted-foreground">({h.estado})</span>
                      {h.fecha_objetivo ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {new Date(h.fecha_objetivo).toLocaleDateString('es-ES')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="h-4 w-4" /> Actualizaciones
              </h3>
              {data.actualizaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actualizaciones.</p>
              ) : (
                <ul className="space-y-2">
                  {data.actualizaciones.map((a) => (
                    <li key={a.id} className="rounded-md border border-border p-2 text-sm">
                      <p className="font-medium">{a.titulo}</p>
                      <p className="text-muted-foreground">{a.contenido}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString('es-ES')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href="/iniciativas/registros"
              className="inline-flex w-full items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Ir a registros <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function InitiativesDashboardPage() {
  const { data: iniciativas, isLoading: listLoading, isError: listError, error: listErr } =
    useIniciativas();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'titulo' | 'estado' | 'fecha_inicio' | 'created_at'>(
    'created_at',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('resumen');

  const { data: hitosGlobal } = useQuery({
    queryKey: ['hito_iniciativas-dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: HitoIniciativa[] }>(`/hito_iniciativas/`);
      return data.data ?? [];
    },
  });

  const kpis = useMemo(() => {
    const rows = iniciativas ?? [];
    const total = rows.length;
    let completed = 0;
    let inProgress = 0;
    let atRisk = 0;
    const now = Date.now();
    for (const r of rows) {
      const e = normEstado(r.estado);
      if (e.includes('complet')) completed += 1;
      else if (e.includes('progreso') || e === 'en curso') inProgress += 1;
      if (r.fecha_fin_estimada) {
        const end = new Date(r.fecha_fin_estimada).getTime();
        if (!Number.isNaN(end) && end < now && !e.includes('complet')) atRisk += 1;
      }
    }
    const completionPct = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, atRisk, completionPct };
  }, [iniciativas]);

  const sortedRows = useMemo(() => {
    const rows = iniciativas ?? [];
    const copy = [...rows];
    copy.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortField === 'titulo') {
        av = a.titulo;
        bv = b.titulo;
      } else if (sortField === 'estado') {
        av = a.estado;
        bv = b.estado;
      } else if (sortField === 'fecha_inicio') {
        av = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : 0;
        bv = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : 0;
      } else {
        av = a.created_at ? new Date(a.created_at).getTime() : 0;
        bv = b.created_at ? new Date(b.created_at).getTime() : 0;
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const na = typeof av === 'number' ? av : 0;
      const nb = typeof bv === 'number' ? bv : 0;
      return sortOrder === 'asc' ? na - nb : nb - na;
    });
    return copy;
  }, [iniciativas, sortField, sortOrder]);

  const tablaRows = useMemo(() => {
    const iniIds = new Set((iniciativas ?? []).map((i) => i.id));
    const byIni = new Map<string, HitoIniciativa[]>();
    for (const h of hitosGlobal ?? []) {
      if (!iniIds.has(h.iniciativa_id)) continue;
      const arr = byIni.get(h.iniciativa_id) ?? [];
      arr.push(h);
      byIni.set(h.iniciativa_id, arr);
    }
    return (iniciativas ?? []).map((row) => {
      const hs = byIni.get(row.id) ?? [];
      const done = hs.filter((h) => normEstado(h.estado ?? '') === 'completado').length;
      const pct = hs.length ? Math.round((done / hs.length) * 100) : 0;
      return { row, pct, done, total: hs.length };
    });
  }, [iniciativas, hitosGlobal]);

  const timelineEvents = useMemo(() => {
    const iniMap = new Map((iniciativas ?? []).map((i) => [i.id, i.titulo]));
    const ev = (hitosGlobal ?? [])
      .filter((h) => iniMap.has(h.iniciativa_id) && h.fecha_objetivo)
      .map((h) => ({
        id: h.id,
        tituloIni: iniMap.get(h.iniciativa_id) ?? '',
        hito: h.nombre,
        fecha: new Date(h.fecha_objetivo!).getTime(),
        estado: h.estado,
      }))
      .sort((a, b) => a.fecha - b.fecha)
      .slice(0, 25);
    return ev;
  }, [hitosGlobal, iniciativas]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <span className="ml-2 text-muted-foreground">⬍</span>;
    return <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (listError) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive"
        data-testid="error-state"
      >
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>{extractErrorMessage(listErr, 'Error al cargar el dashboard de iniciativas')}</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Iniciativas</h1>
          <p className="mt-1 text-muted-foreground">
            Seguimiento de tus iniciativas, hitos y avance (datos de tus registros).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/iniciativas/registros"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Registros
          </Link>
          <Link
            href="/hito_iniciativas"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Hitos
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" /> Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                {listLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{kpis.total}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {listLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">{kpis.completed}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-600" /> En progreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {listLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-blue-600">{kpis.inProgress}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Riesgo / atraso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {listLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-amber-600">{kpis.atRisk}</div>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cierre estimado</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {listLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <p>
                  Porcentaje con estado de completado (aprox.):{' '}
                  <span className="font-mono text-foreground">{kpis.completionPct}%</span>
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tabla" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tabla de iniciativas</CardTitle>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Progreso hitos</TableHead>
                      <TableHead>Hitos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tablaRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          Sin iniciativas. Crea una en Registros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tablaRows.map(({ row, pct, done, total }) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.titulo}</TableCell>
                          <TableCell>{row.estado}</TableCell>
                          <TableCell>{pct}%</TableCell>
                          <TableCell>
                            {done}/{total}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" /> Próximos hitos (por fecha objetivo)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {listLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : timelineEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin hitos con fecha objetivo.</p>
              ) : (
                timelineEvents.map((ev) => (
                  <div key={ev.id} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">{ev.tituloIni}</p>
                    <p className="text-muted-foreground">{ev.hito}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.fecha).toLocaleString('es-ES')} — {ev.estado}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Listado</CardTitle>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('titulo')}>
                        Título <SortIcon field="titulo" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('estado')}>
                        Estado <SortIcon field="estado" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('fecha_inicio')}>
                        Inicio <SortIcon field="fecha_inicio" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                        Alta <SortIcon field="created_at" />
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((init) => (
                      <TableRow key={init.id}>
                        <TableCell className="font-medium">{init.titulo}</TableCell>
                        <TableCell>{init.estado}</TableCell>
                        <TableCell>
                          {init.fecha_inicio
                            ? new Date(init.fecha_inicio).toLocaleDateString('es-ES')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {init.created_at
                            ? new Date(init.created_at).toLocaleDateString('es-ES')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm text-primary"
                            onClick={() => setSelectedId(init.id)}
                          >
                            Ver <ChevronRight className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedId ? <DetailPanel initiativeId={selectedId} onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}
