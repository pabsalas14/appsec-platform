'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronRight,
  Filter,
  TrendingDown,
  TrendingUp,
  Search,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
} from 'recharts';

import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { useVulnerabilidadsList } from '@/hooks/useVulnerabilidads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, PageWrapper } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface MotorCount {
  motor: string;
  total: number;
  closed: number;
  percentage: number;
  active?: number;
  criticas_activas?: number;
  altas_activas?: number;
  trend_mom?: number;
}

interface SeverityCount {
  severity: string;
  count: number;
  percentage: number;
}

interface ConcentradoData {
  motors: MotorCount[];
  severities: SeverityCount[];
  total_vulnerabilities: number;
  total_active: number;
  pipeline_stages: Record<string, number>;
}

const MOTORS = ['SAST', 'SCA', 'CDS', 'DAST', 'MDA', 'MAST'] as const;

const MOTOR_COLORS: Record<string, string> = {
  SAST: '#3b82f6',
  SCA: '#a855f7',
  CDS: '#10b981',
  DAST: '#ef4444',
  MDA: '#f59e0b',
  MAST: '#ec4899',
};

const SEVERITY_COLORS: Record<string, { bg: string; fg: string; border: string; chart: string }> = {
  CRITICA: {
    bg: 'bg-red-500/10',
    fg: 'text-red-500',
    border: 'border-red-500/30',
    chart: '#dc2626',
  },
  Critica: {
    bg: 'bg-red-500/10',
    fg: 'text-red-500',
    border: 'border-red-500/30',
    chart: '#dc2626',
  },
  ALTA: {
    bg: 'bg-orange-500/10',
    fg: 'text-orange-500',
    border: 'border-orange-500/30',
    chart: '#ea580c',
  },
  Alta: {
    bg: 'bg-orange-500/10',
    fg: 'text-orange-500',
    border: 'border-orange-500/30',
    chart: '#ea580c',
  },
  MEDIA: {
    bg: 'bg-yellow-500/10',
    fg: 'text-yellow-500',
    border: 'border-yellow-500/30',
    chart: '#ca8a04',
  },
  Media: {
    bg: 'bg-yellow-500/10',
    fg: 'text-yellow-500',
    border: 'border-yellow-500/30',
    chart: '#ca8a04',
  },
  BAJA: {
    bg: 'bg-blue-500/10',
    fg: 'text-blue-500',
    border: 'border-blue-500/30',
    chart: '#2563eb',
  },
  Baja: {
    bg: 'bg-blue-500/10',
    fg: 'text-blue-500',
    border: 'border-blue-500/30',
    chart: '#2563eb',
  },
};

/** Tarjetas UI usan CRITICA; API usa Critica (BRD). */
function severidadApiDesdeUi(uiKey: string): string {
  const m: Record<string, string> = {
    CRITICA: 'Critica',
    ALTA: 'Alta',
    MEDIA: 'Media',
    BAJA: 'Baja',
  };
  return m[uiKey] ?? uiKey;
}

function etiquetaSla(fechaIso: string | null | undefined): 'Vencida' | 'En riesgo' | 'En tiempo' {
  if (!fechaIso) return 'En tiempo';
  const fin = new Date(fechaIso);
  if (Number.isNaN(fin.getTime())) return 'En tiempo';
  const now = Date.now();
  if (fin.getTime() < now) return 'Vencida';
  const dias = (fin.getTime() - now) / 86400000;
  if (dias <= 3) return 'En riesgo';
  return 'En tiempo';
}

function activoResumen(v: {
  repositorio_id?: string | null;
  activo_web_id?: string | null;
  servicio_id?: string | null;
}): string {
  const id = v.repositorio_id ?? v.activo_web_id ?? v.servicio_id;
  if (!id) return '—';
  return `${id.slice(0, 8)}…`;
}

function MotorCard({
  motor,
  data,
  selected,
  onClick,
}: {
  motor: string;
  data: MotorCount | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  const color = MOTOR_COLORS[motor] ?? '#6b7280';
  const total = data?.total ?? 0;
  const closed = data?.closed ?? 0;
  const open = data?.active ?? Math.max(0, total - closed);
  const crit = data?.criticas_activas ?? 0;
  const alt = data?.altas_activas ?? 0;
  const resto = Math.max(0, open - crit - alt);
  const sevDist = [
    { name: 'Crít', value: crit, color: '#dc2626' },
    { name: 'Alta', value: alt, color: '#ea580c' },
    { name: 'Resto', value: resto, color: '#64748b' },
  ];
  const pctCerradas = data?.percentage ?? 0;
  const trendMom = data?.trend_mom ?? 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left rounded-xl border-2 bg-dashboard-surface p-3 transition-all',
        'hover:shadow-lg hover:-translate-y-0.5',
        selected ? 'border-primary shadow-md' : 'border-dashboard-border/70',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {motor.slice(0, 2)}
          </div>
          <span className="text-sm font-bold">{motor}</span>
        </div>
        <Badge variant="outline" className="text-[9px] tabular-nums border-dashboard-border text-dashboard-muted">
          {pctCerradas}% cerradas
          {trendMom !== 0 ? (
            <span className="ml-1 inline-flex items-center gap-0.5">
              {trendMom > 0 ? (
                <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5 text-red-500" />
              )}
              {Math.abs(trendMom)}%
            </span>
          ) : null}
        </Badge>
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>
        {total.toLocaleString()}
      </div>
      <div className="text-[10px] text-muted-foreground mb-2">Hallazgos totales</div>
      <div className="h-12 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sevDist}>
            <XAxis dataKey="name" hide />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {sevDist.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-1 mt-1">
        {sevDist.map((s) => (
          <div key={s.name} className="text-center">
            <div className="text-[9px] font-bold tabular-nums" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[8px] text-muted-foreground">{s.name}</div>
          </div>
        ))}
      </div>
    </button>
  );
}

function SeverityCard({
  severity,
  data,
  selected,
  onClick,
}: {
  severity: string;
  data: SeverityCount | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  const colors = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.BAJA;
  const count = data?.count ?? 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left rounded-xl border-2 p-4 transition-all',
        'hover:shadow-lg hover:-translate-y-0.5',
        colors.bg,
        selected ? 'border-primary shadow-md' : colors.border,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn('h-5 w-5', colors.fg)} />
          <span className={cn('text-sm font-bold uppercase', colors.fg)}>{severity}</span>
        </div>
      </div>
      <div className={cn('text-3xl font-bold tabular-nums', colors.fg)}>
        {count.toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground">{data?.percentage ?? 0}% del total de hallazgos</div>
    </button>
  );
}

function VulnDetailTable({
  title,
  motor,
  severity,
}: {
  title: string;
  motor?: string;
  severity?: string;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const listSp = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('page', '1');
    qs.set('page_size', '15');
    qs.set('sort', 'updated_at');
    qs.set('order', 'desc');
    if (motor) qs.set('fuente', motor);
    if (severity) qs.set('severidad', severidadApiDesdeUi(severity));
    if (debouncedQ.length > 0) qs.set('q', debouncedQ);
    return qs.toString();
  }, [motor, severity, debouncedQ]);

  const { data: listResult, isLoading, isError } = useVulnerabilidadsList(listSp);
  const rows = listResult?.items ?? [];
  const meta = listResult?.meta;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-7 h-7 w-44 text-xs border-dashboard-border bg-dashboard-surface"
              placeholder="Buscar en resultados…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Buscar hallazgos"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {isLoading && (
            <div className="space-y-2 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          )}
          {isError && (
            <p className="py-8 text-center text-sm text-destructive">No se pudo cargar el listado de hallazgos.</p>
          )}
          {!isLoading && !isError && rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin hallazgos para este filtro{debouncedQ ? ' y la búsqueda actual' : ''}.
            </p>
          )}
          {!isLoading && !isError && rows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 text-[10px] uppercase">ID</TableHead>
                  <TableHead className="text-[10px] uppercase">Título</TableHead>
                  <TableHead className="w-24 text-[10px] uppercase">Severidad</TableHead>
                  <TableHead className="w-20 text-[10px] uppercase">Motor</TableHead>
                  <TableHead className="text-[10px] uppercase">Activo</TableHead>
                  <TableHead className="w-24 text-[10px] uppercase">SLA</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const sevKey = r.severidad.toUpperCase();
                  const sevColor = SEVERITY_COLORS[sevKey] ?? SEVERITY_COLORS[r.severidad] ?? SEVERITY_COLORS.BAJA;
                  const sla = etiquetaSla(r.fecha_limite_sla);
                  const slaColor =
                    sla === 'Vencida'
                      ? 'bg-red-500/10 text-red-500 border-red-500/30'
                      : sla === 'En riesgo'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
                  return (
                    <TableRow key={r.id} className="hover:bg-accent/30">
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/vulnerabilidads/${r.id}`}
                          className="text-primary hover:underline"
                        >
                          {r.id.slice(0, 8)}…
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs max-w-[220px]">
                        <Link href={`/vulnerabilidads/${r.id}`} className="hover:text-primary line-clamp-2">
                          {r.titulo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[9px]', sevColor.bg, sevColor.fg, sevColor.border)}>
                          {r.severidad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-block h-5 px-2 rounded-md text-[10px] font-bold text-white leading-5"
                          style={{ backgroundColor: MOTOR_COLORS[r.fuente] ?? '#6b7280' }}
                        >
                          {r.fuente}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{activoResumen(r)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[9px]', slaColor)}>
                          {sla}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/vulnerabilidads/${r.id}`} className="inline-flex text-muted-foreground hover:text-primary">
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!isLoading && !isError && meta && rows.length > 0 ? (
            <p className="text-[11px] text-dashboard-muted mt-3 text-center">
              Mostrando {rows.length} de {meta.total} hallazgos (página {meta.page} / {meta.total_pages})
            </p>
          ) : null}
          {!isLoading && !isError && (motor || severity) ? (
            <div className="mt-3 flex justify-center">
              <Link
                href={
                  motor
                    ? `/vulnerabilidads/registros?fuente=${encodeURIComponent(motor)}`
                    : `/vulnerabilidads/registros?severidad=${encodeURIComponent(severidadApiDesdeUi(severity!))}`
                }
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todos en registros de hallazgos
              </Link>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConcentradoDashboardPage() {
  const [selectedMotor, setSelectedMotor] = useState<string>('SAST');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('CRITICA');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-concentrado'],
    queryFn: async () => {
      logger.info('dashboard.concentrado.fetch');
      const response = await apiClient.get('/dashboard/concentrado');
      return response.data.data as ConcentradoData;
    },
  });

  const findMotor = (m: string) => data?.motors?.find((mo) => mo.motor === m);
  const findSeverity = (s: string) => {
    return data?.severities?.find(
      (sev) => sev.severity?.toUpperCase() === s.toUpperCase() || sev.severity === s,
    );
  };

  return (
    <PageWrapper className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Dashboard de Vulnerabilidades"
        description={`Vista consolidada por motor y severidad · ${data?.total_vulnerabilities?.toLocaleString() ?? 0} hallazgos totales`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 border-dashboard-border">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {data?.total_active?.toLocaleString() ?? 0} activos
            </Badge>
            <Button variant="outline" size="sm" className="h-8 text-xs border-dashboard-border">
              <Filter className="h-3 w-3 mr-1" />
              Filtros
            </Button>
          </div>
        }
      />

      {/* DIMENSIÓN POR MOTOR */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-dashboard-muted">
            Dimensión por Motor
          </h2>
          <Badge variant="outline" className="text-[10px]">
            {data?.motors?.length ?? 0} motores
          </Badge>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {MOTORS.map((m) => (
              <MotorCard
                key={m}
                motor={m}
                data={findMotor(m)}
                selected={selectedMotor === m}
                onClick={() => setSelectedMotor(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detalle por motor */}
      <VulnDetailTable
        title={`Detalle de Vulnerabilidades · Motor: ${selectedMotor}`}
        motor={selectedMotor}
      />

      {/* DIMENSIÓN POR SEVERIDAD */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-dashboard-muted">
            Dimensión por Severidad
          </h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map((s) => (
              <SeverityCard
                key={s}
                severity={s}
                data={findSeverity(s)}
                selected={selectedSeverity === s}
                onClick={() => setSelectedSeverity(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detalle por severidad */}
      <VulnDetailTable
        title={`Detalle de Vulnerabilidades · Severidad: ${selectedSeverity}`}
        severity={selectedSeverity}
      />
    </PageWrapper>
  );
}
