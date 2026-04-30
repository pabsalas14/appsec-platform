'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  AvanceVsMetaChart,
  ExecutiveKpiCard,
  PostureRing,
  RankedBarChart,
  SlaSemaforoWidget,
} from '@/components/dashboard/executive';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HierarchyFiltersBarCard } from '@/components/dashboard/HierarchyFiltersBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/radix-select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  type ExecutiveDashboardResponse,
  useDashboardExecutive,
} from '@/hooks/useAppDashboardPanels';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { appendHierarchyQuery } from '@/lib/dashboardLinks';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';
import { logger } from '@/lib/logger';
import {
  AlertCircle,
  ClipboardCheck,
  Download,
  ExternalLink,
  Info,
  Lightbulb,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';

const TREND_PRESET: Record<string, number> = {
  m1: 1,
  m3: 3,
  m6: 6,
  m12: 12,
};

const TREND_PRESET_LABEL: Record<string, string> = {
  m1: '1 ventana (~30 días)',
  m3: 'Últimas 3 ventanas',
  m6: 'Últimas 6 ventanas',
  m12: 'Últimas 12 ventanas',
};

function formatFechaCorta(iso: string | undefined): string {
  if (!iso || iso === '—') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function auditEstadoDotClass(estado: string): string {
  const e = (estado || '').toLowerCase();
  if (e.includes('complet') || e.includes('cerrad')) return 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
  if (e.includes('progres') || e.includes('curso') || e.includes('activ')) return 'bg-amber-400';
  return 'bg-slate-500';
}

const FUENTE_CHIP: Record<string, string> = {
  SAST: 'bg-sky-500/20 text-sky-300',
  DAST: 'bg-orange-500/20 text-orange-300',
  SCA: 'bg-violet-500/20 text-violet-300',
  CDS: 'bg-emerald-500/20 text-emerald-300',
  MDA: 'bg-amber-500/20 text-amber-200',
  MAST: 'bg-rose-500/20 text-rose-300',
  TM: 'bg-cyan-500/20 text-cyan-200',
  Auditoria: 'bg-slate-500/30 text-slate-200',
  Tercero: 'bg-fuchsia-500/20 text-fuchsia-200',
};

function buildExecutiveCsv(payload: ExecutiveDashboardResponse): string {
  const lines: string[] = [];
  lines.push('Dashboard Ejecutivo — export');
  lines.push(`Riesgo;${payload.risk_level}`);
  lines.push(`Postura;${payload.security_posture}`);
  const k = payload.kpis;
  lines.push(`KPI;Avance programas;${k.programs_advancement}`);
  lines.push(`KPI;Vulnerabilidades críticas;${k.critical_vulns}`);
  lines.push(`KPI;Liberaciones activas;${k.active_releases}`);
  lines.push(`KPI;Temas emergentes;${k.emerging_themes}`);
  lines.push(`KPI;Auditorías (total);${k.audits}`);
  lines.push(
    'Serie;Período;Críticas;Altas;Medias;Bajas;Avance cierre %;Cerradas;Creadas;Liber. activas (stock);Temas (stock);Audits (stock);%SLA ok;%SLA riesgo;%SLA venc',
  );
  for (const row of payload.trend_data) {
    const r = row;
    lines.push(
      `Tendencia;${r.name};${r.criticas};${r.altas};${r.medias};${r.bajas};${r.avance_cierre ?? ''};${r.cerradas_en_periodo ?? ''};${r.creadas_en_periodo ?? ''};${r.kpi_activa_releases ?? ''};${r.kpi_temas_inventario ?? ''};${r.kpi_audits_inventario ?? ''};${r.pct_sla_ok ?? ''};${r.pct_sla_riesgo ?? ''};${r.pct_sla_venc ?? ''}`,
    );
  }
  lines.push('SLA;Etiqueta;Cantidad;%');
  for (const s of payload.sla_status) {
    lines.push(`SLA;${s.label};${s.count};${s.percentage}`);
  }
  lines.push('Auditoría;Nombre;Tipo;Responsable;Estado;Hallazgos;Pendientes;Fecha inicio;Fecha fin');
  for (const a of payload.audits) {
    const safe = (v: string) => `"${v.replace(/"/g, '""')}"`;
    lines.push(
      `Auditoría;${safe(a.nombre)};${safe(a.tipo)};${safe(a.responsable)};${safe(a.estado)};${a.hallazgos};${a.pendientes ?? ''};${safe(a.fecha_inicio ?? a.fecha)};${safe(a.fecha_fin ?? '')}`,
    );
  }
  return lines.join('\n');
}

const AUDIT_PAGE = 5;

export default function ExecutiveDashboardPage() {
  const router = useRouter();
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();
  const [trendKey, setTrendKey] = useState('m6');
  const [refMonth, setRefMonth] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(0);
  const [auditsSoloActivas, setAuditsSoloActivas] = useState(false);
  const trendMonths = TREND_PRESET[trendKey] ?? 6;

  const { data, isLoading, error, isFetching } = useDashboardExecutive(filters, {
    trendMonths,
    refMonth,
    auditsOffset: auditPage * AUDIT_PAGE,
    auditsLimit: AUDIT_PAGE,
    auditsSoloActivas,
  });
  const { data: currentUser } = useCurrentUser();
  const sub = data?.kpi_sub;
  const trends = data?.kpi_trends;
  const trendRows = useMemo(() => data?.trend_data ?? [], [data?.trend_data]);
  const firstBucket = trendRows[0];
  const lastBucket = trendRows[trendRows.length - 1];
  const critDelta = (lastBucket?.criticas ?? 0) - (firstBucket?.criticas ?? 0);
  const releaseRiskPct = data?.kpi_sub?.releases_riesgo_pct ?? 0;
  const avancePp = trends?.avance_cierre_pp;
  const breakdownCritical = useMemo(
    () =>
      (sub?.critical_by_fuente ?? []).slice(0, 6).map((row) => ({
        label: row.fuente,
        value: row.count,
        className: FUENTE_CHIP[row.fuente] ?? 'bg-slate-700/60 text-slate-200',
      })),
    [sub?.critical_by_fuente],
  );
  const rankedRepos = useMemo(
    () => (data?.top_repos ?? []).map((r) => ({ name: r.label, count: r.value })),
    [data?.top_repos],
  );
  const slaPct = useMemo(() => {
    const byStatus = Object.fromEntries(
      (data?.sla_status ?? []).map((row) => [row.status, row.percentage]),
    ) as Record<string, number>;
    return [byStatus.ok ?? 0, byStatus.warning ?? 0, byStatus.critical ?? 0] as const;
  }, [data?.sla_status]);
  const slaCounts = useMemo(() => {
    const byStatus = Object.fromEntries(
      (data?.sla_status ?? []).map((row) => [row.status, row.count]),
    ) as Record<string, number>;
    return [byStatus.ok ?? 0, byStatus.warning ?? 0, byStatus.critical ?? 0] as const;
  }, [data?.sla_status]);
  const auditTotal = data?.audits_total ?? 0;
  const auditTotalPages = Math.max(1, Math.ceil((auditTotal || 0) / AUDIT_PAGE));

  useEffect(() => {
    setAuditPage(0);
  }, [trendKey, refMonth, filters, auditsSoloActivas]);

  const exportSnapshot = () => {
    if (!data) return;
    try {
      const csv = buildExecutiveCsv(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-ejecutivo-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      logger.info('dashboard.executive.export', { trend_months: data.trend_months });
    } catch (e) {
      logger.error('dashboard.executive.export_failed', { error: String(e) });
    }
  };

  const go = (path: string) => () => {
    router.push(appendHierarchyQuery(path, filters));
  };
  const goWithParams = (path: string, params: Record<string, string | null | undefined>) => {
    const qp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') qp.set(k, v);
    }
    const base = qp.size > 0 ? `${path}?${qp.toString()}` : path;
    router.push(appendHierarchyQuery(base, filters));
  };

  const footerTime = useMemo(() => {
    if (data?.generated_at) {
      return new Date(data.generated_at).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        dateStyle: 'short',
        timeStyle: 'short',
      });
    }
    return new Date().toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }, [data?.generated_at]);

  const auditColumns = useMemo(
    () => [
      { key: 'nombre', label: 'Auditoría' },
      { key: 'tipo', label: 'Alcance / tipo' },
      { key: 'fecha_inicio', label: 'Inicio' },
      { key: 'fecha_fin', label: 'Fin' },
      { key: 'estado', label: 'Estado' },
      { key: 'pendientes', label: 'Requer. pend.' },
      { key: 'hallazgos', label: 'Hallazgos' },
    ],
    [],
  );

  if (error) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive"
        data-testid="error-state"
      >
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard ejecutivo</span>
      </div>
    );
  }

  return (
    <div className="px-2 pb-10 pt-4 md:px-6">
      <div className="mx-auto max-w-[1600px] text-[13px] leading-normal space-y-6">
        
        {/* Filtros Globales Arriba */}
        <div className="mb-4">
          <HierarchyFiltersBarCard
            title="Filtros globales (organización e inventario)"
            filters={filters}
            onChange={updateFilter}
            onClear={clearFilters}
            savedModulo={DASHBOARD_FILTER_MODULO.executive}
            onApplyFilters={applyFilters}
            cardClassName="border-white/[0.08] bg-slate-950/40 backdrop-blur-md shadow-none"
          />
        </div>

        {/* Cabecera y Postura */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase">AppSec — Ejecutivo</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Dashboard General Ejecutivo</h1>
              <p className="mt-1 text-sm text-muted-foreground">Jefatura de Ciberseguridad Aplicativa — visión unificada de programas, exposición, operación y cumplimiento</p>
              {currentUser ? (
                <p className="mt-1 text-xs text-muted-foreground" data-testid="executive-user-line">
                  {currentUser.full_name?.trim() || currentUser.username} · rol {currentUser.role}
                </p>
              ) : null}
            </div>

              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                {isLoading ? (
                  <Skeleton className="h-[120px] w-[120px] rounded-full" />
                ) : (
                  <button
                    type="button"
                    onClick={go('/vulnerabilidads/registros')}
                    className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-slate-900/50 p-4 transition-all hover:bg-slate-800/60 shadow-lg"
                    title="Abrir detalle de vulnerabilidades"
                  >
                    <PostureRing value={data?.security_posture ?? 0} label="POSTURA" sub="Riesgo global" size={100} />
                  {data?.risk_level ? (
                    <Badge
                      variant="outline"
                      className="mt-1 text-[10px]"
                      data-testid="risk-level-badge"
                    >
                      {data.risk_level}
                    </Badge>
                  ) : null}
                  <span className="mt-1 text-[10px] text-muted-foreground">Click para ver detalle</span>
                </button>
              )}

                <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                {isFetching && !isLoading ? (
                  <span className="text-xs text-muted-foreground">Sincronizando…</span>
                ) : null}
                <Select value={trendKey} onValueChange={setTrendKey}>
                  <SelectTrigger
                    className="h-9 w-[min(100%,220px)]"
                    aria-label="Periodo de tendencia"
                  >
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m1">Última ventana (~30 días)</SelectItem>
                    <SelectItem value="m3">Últimas 3 ventanas</SelectItem>
                    <SelectItem value="m6">Últimas 6 ventanas</SelectItem>
                    <SelectItem value="m12">Últimas 12 ventanas</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex flex-col">
                  <Label className="mb-0.5 text-[9px] uppercase text-slate-500">Anclar eje a mes (YYYY-MM)</Label>
                  <div className="flex items-center gap-1">
                    <input
                      type="month"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      value={refMonth ?? ''}
                      onChange={(e) => setRefMonth(e.target.value || null)}
                    />
                    {refMonth ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setRefMonth(null)}
                      >
                        Quitar
                      </Button>
                    ) : null}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={exportSnapshot}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                </div>
                <p className="pl-0.5 text-[10px] text-muted-foreground">
                  Tendencia: {TREND_PRESET_LABEL[trendKey] ?? trendKey}
                  {data?.trend_mode === 'calendar' && data.ref_month
                    ? ` · calendario hasta ${data.ref_month}`
                    : ' · ventanas deslizantes ~30d'}
                </p>
              </div>
            </div>
          </div>

          {/* Fila 1: KPIs (6 columnas) */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6" data-testid="kpi-row">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))
              : data && (
                  <>
                    <ExecutiveKpiCard
                      title="Avance global programas (motores)"
                      mainValue={`${data.kpis.programs_advancement}%`}
                      subtitle="Cierre / hallazgo por motor (mismo criterio que Programas)"
                      trendDirection={avancePp != null && avancePp >= 0 ? 'up' : 'down'}
                      trendValue={
                        avancePp == null
                          ? 'Sin serie base'
                          : `${avancePp >= 0 ? '+' : ''}${avancePp} pp (últ. vs 1.ª ventana)`
                      }
                      onClick={go('/dashboards/programs')}
                      icon={Target}
                      showBlueArc
                    />
                    <ExecutiveKpiCard
                      title="Vulnerabilidades críticas"
                      mainValue={data.kpis.critical_vulns}
                      subtitle="Carga crítica consolidada por alcance actual"
                      trendDirection={critDelta <= 0 ? 'up' : 'down'}
                      trendValue={`Δ críticas (1.ª → últ. ventana): ${critDelta > 0 ? '+' : ''}${critDelta}`}
                      onClick={go('/vulnerabilidads/registros?severidad=Critica')}
                      icon={ShieldAlert}
                      breakdown={breakdownCritical}
                    />
                    <ExecutiveKpiCard
                      title="Liberaciones activas"
                      mainValue={data.kpis.active_releases}
                      subtitle="Total de liberaciones en curso"
                      trendDirection={releaseRiskPct > 0 ? 'down' : 'up'}
                      trendValue={`${sub?.releases_riesgo_pct ?? 0}% en cola riesgo/aprobación`}
                      onClick={go('/service_releases')}
                      icon={Rocket}
                    />
                    <ExecutiveKpiCard
                      title="Liberaciones SLA Riesgo"
                      mainValue={sub != null ? sub.releases_sla_riesgo : 0}
                      subtitle="A punto de vencer"
                      trendDirection={(sub?.releases_sla_riesgo ?? 0) > 0 ? 'down' : 'up'}
                      trendValue={(sub?.releases_sla_riesgo ?? 0) > 0 ? 'Atención requerida' : 'Flujo sano'}
                      onClick={go('/service_releases')}
                      icon={AlertCircle}
                    />
                    <ExecutiveKpiCard
                      title="Temas emergentes abiertos"
                      mainValue={data.kpis.emerging_themes}
                      subtitle={
                        sub != null && sub.emerging_stale_7d > 0
                          ? `Sin movimiento >7d: ${sub.emerging_stale_7d}`
                          : 'Sin estancamiento >7d'
                      }
                      trendDirection={sub != null && sub.emerging_stale_7d > 0 ? 'down' : 'up'}
                      trendValue={
                        sub != null && sub.emerging_stale_7d > 0
                          ? 'Requiere seguimiento'
                          : 'Ritmo operativo estable'
                      }
                      onClick={go('/temas_emergentes')}
                      icon={Lightbulb}
                    />
                    <ExecutiveKpiCard
                      title="Auditorías (inventario)"
                      mainValue={data.kpis.audits}
                      subtitle={`Activas (no completadas): ${sub?.audits_not_completed ?? 0}`}
                      trendDirection="down"
                      trendValue={`Pendientes de cierre: ${sub?.audits_not_completed ?? 0}`}
                      onClick={go('/auditorias/registros')}
                      icon={ClipboardCheck}
                    />
                  </>
                )}
          </div>

          {/* Fila 2: Gráficas (60% / 40%) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
            <Card className="border-slate-700/50 bg-slate-900/50" data-testid="trend-card">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <span>Avance de cierre vs meta 100% (y severidades en último periodo)</span>
                    <span
                      title="% de hallazgos cerrados en el periodo respecto a creados en el mismo periodo. La línea roja punteada es la meta BRD."
                      className="inline-flex"
                    >
                      <Info className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                    </span>
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    {TREND_PRESET_LABEL[trendKey]} · {data?.trend_months ?? trendMonths} periodo(s) ·{' '}
                    {data?.trend_mode === 'calendar' && data?.ref_month
                      ? `calendario (hasta ${data.ref_month})`
                      : 'ventanas deslizantes ~30d'}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-72 w-full rounded-lg" />
                ) : data?.trend_data?.length ? (
                  <div>
                    <AvanceVsMetaChart data={data.trend_data} height={300} meta={100} />
                    {lastBucket ? (
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400">
                        <span className="text-slate-500">Último periodo (severidades creadas):</span>
                        <span className="rounded border border-rose-500/30 bg-rose-950/30 px-1.5 py-0.5 text-rose-200">
                          C {lastBucket.criticas}
                        </span>
                        <span className="rounded border border-orange-500/25 bg-orange-950/20 px-1.5 py-0.5 text-orange-200">
                          A {lastBucket.altas}
                        </span>
                        <span className="rounded border border-amber-500/20 bg-amber-950/20 px-1.5 py-0.5 text-amber-200">
                          M {lastBucket.medias}
                        </span>
                        <span className="rounded border border-lime-500/20 bg-lime-950/10 px-1.5 py-0.5 text-lime-200">
                          B {lastBucket.bajas}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="py-10 text-center text-sm text-slate-500">Sin datos de tendencia.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700/50 bg-slate-900/50" data-testid="top-repos-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-slate-100">Top repositorios (críticas)</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : rankedRepos.length ? (
                  <div className="space-y-3">
                    <RankedBarChart
                      data={rankedRepos}
                      onRowClick={(row) =>
                        goWithParams('/vulnerabilidads/registros', {
                          severidad: 'Critica',
                          q: row.name,
                        })
                      }
                    />
                    <Link
                      href={appendHierarchyQuery('/vulnerabilidads/registros', filters)}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                    >
                      Ver todos los repositorios <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ) : (
                  <p className="py-8 text-center text-xs text-slate-500">Sin repositorios con críticas.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fila 3: SLA y tabla (35% / 65%) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[35fr_65fr]">
            <Card className="border-slate-700/50 bg-slate-900/50" data-testid="sla-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-100">Semáforo global de SLAs (vulnerabilidades)</CardTitle>
                <p className="text-[11px] text-slate-500">Criterio D2 — vencido / en riesgo / a tiempo</p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : data?.sla_status?.length ? (
                  <SlaSemaforoWidget
                    onTime={slaCounts[0]}
                    atRisk={slaCounts[1]}
                    overdue={slaCounts[2]}
                    percentages={[slaPct[0], slaPct[1], slaPct[2]]}
                    onCardClick={(status) => {
                      if (status === 'critical') {
                        goWithParams('/vulnerabilidads/registros', { sla: 'vencida' });
                        return;
                      }
                      if (status === 'warning') {
                        goWithParams('/dashboards/vulnerabilities', {});
                        return;
                      }
                      goWithParams('/vulnerabilidads/registros', {});
                    }}
                  />
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-slate-700/50 bg-slate-900/50">
              <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm text-slate-100">Auditorías (paginado)</CardTitle>
                  <p className="text-[10px] text-slate-500">Orden: más reciente primero · {auditTotal} fila(s) en el alcance</p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="aud-solo" className="whitespace-nowrap text-[10px] text-slate-400">
                      Solo abiertas
                    </Label>
                    <Switch
                      id="aud-solo"
                      checked={auditsSoloActivas}
                      onCheckedChange={(c) => setAuditsSoloActivas(!!c)}
                    />
                  </div>
                  <Link
                    href={appendHierarchyQuery('/auditorias/registros', filters)}
                    className="inline-flex items-center justify-center gap-1 text-xs text-cyan-400 hover:underline"
                  >
                    Ver todas <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="text-slate-200">
                {isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : data?.audits?.length ? (
                  <div>
                  <div className="overflow-x-auto rounded-lg border border-slate-800/80">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          {auditColumns.map((c) => (
                            <TableHead
                              key={c.key}
                              className="text-xs font-medium text-slate-400"
                            >
                              {c.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.audits.map((a) => (
                          <TableRow
                            key={a.id}
                            className="border-slate-800/80 hover:bg-slate-800/40"
                          >
                            <TableCell className="max-w-[200px] truncate text-slate-100">{a.nombre}</TableCell>
                            <TableCell className="text-slate-300">{a.tipo}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-slate-400">
                              {formatFechaCorta(a.fecha_inicio ?? a.fecha)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-slate-400">
                              {a.fecha_fin && a.fecha_fin !== '—' ? formatFechaCorta(a.fecha_fin) : '—'}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className={cn('h-2 w-2 shrink-0 rounded-full', auditEstadoDotClass(a.estado))}
                                  aria-hidden
                                />
                                <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-slate-200">
                                  {a.estado}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-amber-200">
                              {a.pendientes ?? '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{a.hallazgos}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {auditTotal > AUDIT_PAGE ? (
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] text-slate-500">
                        Página {auditPage + 1} de {auditTotalPages} · {AUDIT_PAGE} por página
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-600 text-slate-200"
                          disabled={auditPage <= 0}
                          onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                        >
                          Anterior
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-600 text-slate-200"
                          disabled={auditPage >= auditTotalPages - 1}
                          onClick={() => setAuditPage((p) => p + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-slate-500">No hay auditorías.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <footer className="border-t border-slate-800/80 pt-3 text-center text-[11px] text-slate-500">
            Datos actualizados: {footerTime} · Zona: America/Mexico_City ·{' '}
            <span className="text-slate-600">Incluye filtros jerárquicos, periodo y mes de anclaje si aplica</span>
          </footer>
      </div>
    </div>
  );
}
