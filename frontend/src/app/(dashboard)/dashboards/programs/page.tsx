'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ChevronRight,
  Smartphone,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const GaugeChart = dynamic(
  () => import('@/components/charts/GaugeChart').then((m) => m.GaugeChart),
  { ssr: false, loading: () => <Skeleton className="h-44 w-full rounded-lg" /> },
);
const HistoricoMensualGrid = dynamic(
  () => import('@/components/charts/HistoricoMensualGrid').then((m) => m.HistoricoMensualGrid),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-lg" /> },
);

interface ProgramBreakdown {
  program: string;
  total_findings: number;
  closed_findings: number;
  completion_percentage: number;
}

interface ProgramsResponse {
  total_programs: number;
  avg_completion: number;
  programs_at_risk: number;
  program_breakdown: ProgramBreakdown[];
}

interface HeatmapEntry {
  month: number;
  value: number;
  total: number;
  closed: number;
}

interface HeatmapResponse {
  heatmap: Record<string, HeatmapEntry[]>;
}

/** Programación anual por motor (MAST queda fuera: indicadores + ejecuciones mensuales). */
const PROGRAM_TYPES = ['SAST', 'DAST', 'SCA', 'CDS', 'MDA'];

const PROGRAM_LABELS: Record<string, string> = {
  SAST: 'Seguridad en Aplicaciones (SAST)',
  DAST: 'Pruebas Dinámicas (DAST)',
  SCA: 'Análisis de Composición (SCA)',
  CDS: 'Defensa de Código (CDS)',
  MDA: 'Análisis Móvil (MDA)',
};

const PROGRAM_COLORS: Record<string, string> = {
  SAST: '#3b82f6',
  DAST: '#ef4444',
  SCA: '#a855f7',
  CDS: '#10b981',
  MDA: '#f59e0b',
};

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Rutas CRUD por motor; SCA/CDS/MDA comparten el módulo de código fuente hasta tener pantallas dedicadas. */
const PROGRAM_CRUD_ROUTES: Record<string, string> = {
  SAST: '/programa_sasts',
  DAST: '/programa_dasts',
  SCA: '/programa_source_codes',
  CDS: '/programa_source_codes',
  MDA: '/programa_source_codes',
};

function getStatusLabel(pct: number): { label: string; cls: string } {
  if (pct >= 80) return { label: 'En meta', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' };
  if (pct >= 60) return { label: 'En progreso', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' };
  return { label: 'En riesgo', cls: 'bg-red-500/15 text-red-500 border-red-500/30' };
}

function MiniHeatmap({ months, color }: { months: HeatmapEntry[]; color: string }) {
  const filled = Array.from({ length: 12 }, (_, i) => {
    const m = months.find((mo) => mo.month === i + 1);
    return m?.value ?? 0;
  });
  return (
    <div data-testid="d3-mini-heatmap" className="grid grid-cols-12 gap-0.5">
      {filled.map((v, i) => (
        <div
          key={i}
          className="h-3 rounded-sm"
          style={{
            backgroundColor: v > 0 ? color : undefined,
            opacity: v > 0 ? Math.max(0.2, v / 100) : 0.15,
            background: v === 0 ? 'hsl(var(--muted))' : undefined,
          }}
          title={`${MONTH_NAMES[i]}: ${v}%`}
        />
      ))}
    </div>
  );
}

function ProgramCard({
  program,
  data,
  heatmap,
  onClick,
  selected,
}: {
  program: string;
  data: ProgramBreakdown | undefined;
  heatmap: HeatmapEntry[];
  onClick: () => void;
  selected: boolean;
}) {
  const pct = data?.completion_percentage ?? 0;
  const color = PROGRAM_COLORS[program] ?? '#6b7280';
  const status = getStatusLabel(pct);
  const currentMonth = heatmap[heatmap.length - 1]?.value ?? 0;
  return (
    <button
      data-testid={`d3-program-card-${program.toLowerCase()}`}
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left rounded-xl p-4 transition-all',
        'hover:-translate-y-0.5',
        selected ? 'glass-hover border-b-4 border-primary shadow-md' : 'glass-card border-b-4 border-transparent hover:border-slate-700',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
            Programa
          </div>
          <h3 className="text-sm font-bold truncate">{PROGRAM_LABELS[program] ?? program}</h3>
        </div>
        <Badge variant="outline" className={cn('text-[9px]', status.cls)}>
          {status.label}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <GaugeChart value={pct} size="sm" showPercent color={color} />
        <div className="flex-1 min-w-0 space-y-1">
          <div>
            <div className="text-[10px] text-muted-foreground">Mes actual</div>
            <div className="text-lg font-bold tabular-nums" style={{ color }}>
              {currentMonth}%
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {data?.closed_findings ?? 0} / {data?.total_findings ?? 0} cerradas
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">
          Histórico mensual
        </div>
        <MiniHeatmap months={heatmap} color={color} />
      </div>
      <div className="mt-3 flex items-center justify-end text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
        Ver detalle <ChevronRight className="h-3 w-3 ml-0.5" />
      </div>
    </button>
  );
}

function ProgramDetailPanel({
  program,
  data,
  heatmap,
  onClose,
}: {
  program: string;
  data: ProgramBreakdown | undefined;
  heatmap: HeatmapEntry[];
  onClose: () => void;
}) {
  const pct = data?.completion_percentage ?? 0;
  const color = PROGRAM_COLORS[program] ?? '#6b7280';
  const trendData = heatmap.map((m) => ({
    month: MONTH_NAMES[m.month - 1],
    avance: m.value,
    meta: 100,
  }));
  const totalScans = heatmap.reduce((s, m) => s + (m.total ?? 0), 0);
  const totalClosed = heatmap.reduce((s, m) => s + (m.closed ?? 0), 0);
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
            Detalle del Programa
          </div>
          <CardTitle className="text-base">{PROGRAM_LABELS[program] ?? program}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Análisis del programa de seguridad seleccionado.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center py-2">
          <GaugeChart value={pct} size="lg" showPercent color={color} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/60 bg-card/40 p-2">
            <div className="text-[10px] text-muted-foreground uppercase">Total</div>
            <div className="text-lg font-bold tabular-nums">{data?.total_findings ?? 0}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/40 p-2">
            <div className="text-[10px] text-muted-foreground uppercase">Cerradas</div>
            <div className="text-lg font-bold tabular-nums text-emerald-500">
              {data?.closed_findings ?? 0}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" />
            Actividades del Mes
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-md bg-blue-500/5 border border-blue-500/20">
              <span className="text-xs">Escaneos completados</span>
              <span className="text-xs font-bold tabular-nums">
                {Math.max(1, Math.round(totalScans / 12))}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-xs">Hallazgos remediados</span>
              <span className="text-xs font-bold tabular-nums text-emerald-500">
                {Math.max(1, Math.round(totalClosed / 12))}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-amber-500/5 border border-amber-500/20">
              <span className="text-xs">Pendientes de revisión</span>
              <span className="text-xs font-bold tabular-nums text-amber-500">
                {Math.max(0, (data?.total_findings ?? 0) - (data?.closed_findings ?? 0))}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold mb-2">Histórico de Avance</div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={9} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 100]} />
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line type="monotone" dataKey="meta" stroke="#888" strokeDasharray="4 4" dot={false} />
                <Line
                  type="monotone"
                  dataKey="avance"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Link
          href={PROGRAM_CRUD_ROUTES[program] ?? '/dashboards/programs'}
          className="inline-flex w-full items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          Ir al módulo del programa
          <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function ProgramsDashboardPage() {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const { data: programsData, isLoading: programsLoading } = useQuery({
    queryKey: ['dashboard-programs'],
    queryFn: async () => {
      logger.info('dashboard.programs.fetch');
      const response = await apiClient.get('/dashboard/programs');
      return response.data.data as ProgramsResponse;
    },
  });

  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: ['dashboard-programs-heatmap'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/programs/heatmap');
      return response.data.data as HeatmapResponse;
    },
  });

  const isLoading = programsLoading || heatmapLoading;

  const findProgram = (p: string) =>
    programsData?.program_breakdown?.find((b) => b.program === p);
  const heatmapFor = (p: string) => heatmapData?.heatmap?.[p] ?? [];

  const monthlyChart = MONTH_NAMES.map((name, idx) => {
    const entry: Record<string, string | number> = { month: name, meta: 100 };
    for (const ptype of PROGRAM_TYPES) {
      const m = heatmapData?.heatmap?.[ptype]?.find((h) => h.month === idx + 1);
      if (m) entry[ptype] = m.value;
    }
    return entry;
  });

  return (
    <div data-testid="d3-page" className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Consolidado de Programas
            </span>
          </div>
          <h1 data-testid="d3-title" className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
            Dashboard de Programas Anuales
          </h1>
          <p className="text-xs text-muted-foreground">
            Avance anual por motor (SAST…MDA). MAST no es programa anual: usar Indicadores y Ejecuciones móviles; los
            hallazgos MAST siguen en los tableros de vulnerabilidades.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            {programsData?.total_programs ?? 0} programas
          </Badge>
          <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30">
            <TrendingUp className="h-3 w-3" />
            Avg {programsData?.avg_completion ?? 0}%
          </Badge>
          {(programsData?.programs_at_risk ?? 0) > 0 && (
            <Badge variant="outline" className="gap-1 text-red-500 border-red-500/30">
              <AlertCircle className="h-3 w-3" />
              {programsData?.programs_at_risk} en riesgo
            </Badge>
          )}
        </div>
      </div>

      <Card className="border-dashboard-border bg-dashboard-surface/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary shrink-0" />
            MAST (móvil) — operación mensual
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            No forma parte del ciclo de programas anuales. Captura KPIs mes a mes en{' '}
            <Link href="/indicadores" className="font-medium text-primary underline-offset-4 hover:underline">
              Indicadores
            </Link>
            , registra ejecuciones en{' '}
            <Link href="/ejecucion_masts" className="font-medium text-primary underline-offset-4 hover:underline">
              Ejecuciones MAST
            </Link>
            . Si cargas hallazgos con fuente MAST, aparecen en{' '}
            <Link href="/dashboards/vulnerabilities" className="font-medium text-primary underline-offset-4 hover:underline">
              Dashboard de vulnerabilidades
            </Link>{' '}
            y en{' '}
            <Link href="/vulnerabilidads/registros?fuente=MAST" className="font-medium text-primary underline-offset-4 hover:underline">
              Registros filtrados por MAST
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Link
            href="/indicadores"
            className="inline-flex h-9 items-center justify-center rounded-md border border-dashboard-border bg-transparent px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Indicadores
          </Link>
          <Link
            href="/ejecucion_masts"
            className="inline-flex h-9 items-center justify-center rounded-md border border-dashboard-border bg-transparent px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Ejecuciones MAST
          </Link>
          <Link
            href="/vulnerabilidads/registros?fuente=MAST"
            className="inline-flex h-9 items-center justify-center rounded-md border border-dashboard-border bg-transparent px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Hallazgos MAST
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1">
        <div className="space-y-4 min-w-0">
          {isLoading ? (
            <div data-testid="d3-program-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          ) : (
            <div data-testid="d3-program-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PROGRAM_TYPES.map((program) => (
                <ProgramCard
                  key={program}
                  program={program}
                  data={findProgram(program)}
                  heatmap={heatmapFor(program)}
                  selected={selectedProgram === program}
                  onClick={() => setSelectedProgram(program === selectedProgram ? null : program)}
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Actividad del Mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium">Escaneos Completados</p>
                      <p className="text-[10px] text-muted-foreground">Últimos 30 días</p>
                    </div>
                    <span className="text-lg font-bold text-blue-500 tabular-nums">
                      {Math.round(
                        (programsData?.program_breakdown?.reduce((s, p) => s + p.total_findings, 0) ??
                          0) / 12,
                      )}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium">Hallazgos Remediados</p>
                      <p className="text-[10px] text-muted-foreground">Últimos 30 días</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-500 tabular-nums">
                      {Math.round(
                        (programsData?.program_breakdown?.reduce((s, p) => s + p.closed_findings, 0) ??
                          0) / 12,
                      )}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium">Pendientes Revisión</p>
                      <p className="text-[10px] text-muted-foreground">Backlog activo</p>
                    </div>
                    <span className="text-lg font-bold text-amber-500 tabular-nums">
                      {programsData?.program_breakdown?.reduce(
                        (s, p) => s + (p.total_findings - p.closed_findings),
                        0,
                      ) ?? 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Avance Mensual vs Meta (100%)</CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  12 meses
                </Badge>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-56 w-full" />
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChart}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 100]} />
                        <RechartsTooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                          formatter={(v) => `${v}%`}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="meta" stroke="#888" strokeDasharray="5 5" dot={false} name="Meta" />
                        {PROGRAM_TYPES.map((p) => (
                          <Line
                            key={p}
                            type="monotone"
                            dataKey={p}
                            stroke={PROGRAM_COLORS[p]}
                            strokeWidth={2}
                            dot={{ fill: PROGRAM_COLORS[p], r: 2 }}
                            name={p}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sección: Actividad Mensual con 4 Históricos */}
          <div className="col-span-full">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actividad Mensual por Programa</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Histórico de completitud mensual (12 meses)</p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {['SAST', 'DAST', 'Threat Modeling', 'Source Code'].map((label, idx) => {
                      const programs = ['SAST', 'DAST', 'SAST', 'DAST'];
                      const heatmapEntries = idx < 2 ? (heatmapData?.heatmap?.[programs[idx]] ?? []) : [];
                      const monthData = (heatmapEntries || []).map((h: HeatmapEntry) => ({
                        month: h.month,
                        value: h.value ?? 0,
                      }));
                      return (
                        <div key={label}>
                          <HistoricoMensualGrid
                            months={monthData.length > 0 ? monthData : Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: 0 }))}
                            title={label}
                            className="p-3 rounded-lg border border-border/50 bg-card/30"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Sheet open={!!selectedProgram} onOpenChange={(open) => !open && setSelectedProgram(null)}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l border-white/10 bg-slate-950/95 backdrop-blur-xl">
            {selectedProgram && (
              <div className="h-full px-4 py-6">
                <ProgramDetailPanel
                  program={selectedProgram}
                  data={findProgram(selectedProgram)}
                  heatmap={heatmapFor(selectedProgram)}
                  onClose={() => setSelectedProgram(null)}
                />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
