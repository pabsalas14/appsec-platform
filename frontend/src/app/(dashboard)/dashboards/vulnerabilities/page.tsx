'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bug,
  ChevronRight,
  Home,
  Layers,
  Shield,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Types ─────────────────────────────────────────────────────────────

interface EngineStat {
  motor: string;
  count: number;
  trend: number;
}

interface ChildEntity {
  id: string;
  name: string;
  count: number;
}

interface VulnSummary {
  total: number;
  by_engine: EngineStat[];
  by_severity: Record<string, number>;
  trend: Array<{ period: string; count: number }>;
  pipeline: Record<string, number>;
}

interface VulnRowDetail {
  id: string;
  motor: string;
  severidad: string;
  titulo: string;
  descripcion?: string;
  fecha_deteccion: string | null;
  sla: string | null;
  estado: string;
}

interface VulnerabilitiesResponse {
  summary: VulnSummary;
  children: ChildEntity[];
  children_type: string | null;
  vulnerabilities?: VulnRowDetail[];
  total_vulnerabilities?: number;
  by_severity?: Record<string, number>;
  sla_status?: Record<string, number>;
  overdue_count?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────

const LEVELS = [
  { id: 0, label: 'NIVEL 1', name: 'Global', icon: Home },
  { id: 1, label: 'NIVEL 2', name: 'Dirección', icon: Layers },
  { id: 2, label: 'NIVEL 3', name: 'Subdirección', icon: Layers },
  { id: 3, label: 'NIVEL 4', name: 'Gerencia', icon: Layers },
  { id: 4, label: 'NIVEL 5', name: 'Organización', icon: Layers },
  { id: 5, label: 'NIVEL 6', name: 'Célula', icon: Layers },
  { id: 6, label: 'NIVEL 7', name: 'Repositorio', icon: Bug },
] as const;

const ENGINE_COLORS: Record<string, string> = {
  SAST: '#3b82f6',
  DAST: '#ef4444',
  SCA: '#a855f7',
  CDS: '#10b981',
  MDA: '#f59e0b',
  MAST: '#ec4899',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICA: '#dc2626',
  ALTA: '#ea580c',
  MEDIA: '#ca8a04',
  BAJA: '#2563eb',
  INFORMATIVA: '#6b7280',
};

const SEVERITY_BG: Record<string, string> = {
  CRITICA: 'bg-red-500/10 text-red-500 border-red-500/30',
  ALTA: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  MEDIA: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  BAJA: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
};

// ─── Subcomponents ─────────────────────────────────────────────────────

function LevelSidebar({
  currentLevel,
  path,
  onLevelClick,
}: {
  currentLevel: number;
  path: { name: string; level: number }[];
  onLevelClick: (level: number) => void;
}) {
  return (
    <div className="hidden lg:flex flex-col gap-1 w-44 shrink-0">
      {LEVELS.map((level) => {
        const Icon = level.icon;
        const isActive = level.id === currentLevel;
        const isReachable = level.id <= currentLevel;
        const pathItem = path.find((p) => p.level === level.id);
        return (
          <button
            key={level.id}
            type="button"
            disabled={!isReachable}
            onClick={() => onLevelClick(level.id)}
            className={cn(
              'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-all',
              isActive
                ? 'border-primary bg-primary/10 shadow-sm'
                : isReachable
                  ? 'border-border/60 bg-card hover:bg-accent/40 hover:border-border'
                  : 'border-border/30 bg-muted/20 opacity-50 cursor-not-allowed',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 mt-0.5 shrink-0',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {level.label}
              </div>
              <div
                className={cn(
                  'text-xs font-semibold truncate',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {pathItem?.name ?? level.name}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EngineCard({ engine, count, trend }: EngineStat) {
  const color = ENGINE_COLORS[engine] ?? '#6b7280';
  const sparkData = Array.from({ length: 7 }, (_, i) => ({
    x: i,
    y: Math.max(0, Math.round(count * (0.6 + Math.sin(i / 1.5) * 0.3))),
  }));
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {engine.slice(0, 2)}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Motor</div>
              <div className="text-sm font-bold">{engine}</div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] gap-0.5',
              trend >= 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30',
            )}
          >
            <TrendingUp className="h-3 w-3" />
            {trend >= 0 ? '+' : ''}
            {trend}%
          </Badge>
        </div>
        <div className="text-2xl font-bold tabular-nums">{count.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground mb-2">Hallazgos activos</div>
        <div className="h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`grad-${engine}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="y" stroke={color} fill={`url(#grad-${engine})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', color)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                trend.positive ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30',
              )}
            >
              {trend.positive ? '+' : ''}
              {trend.value}%
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="text-xs font-medium mt-1">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function SeverityBreakdown({ data }: { data: Record<string, number> }) {
  const order = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'];
  const total = order.reduce((s, k) => s + (data[k] ?? 0), 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Distribución por severidad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={order.map((k) => ({ name: k, value: data[k] ?? 0 }))}
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {order.map((k, i) => (
                    <Cell key={i} fill={SEVERITY_COLORS[k]} stroke="transparent" />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {order.map((sev) => {
              const v = data[sev] ?? 0;
              const pct = total ? Math.round((v / total) * 100) : 0;
              return (
                <div key={sev}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className={cn('font-medium', `text-[${SEVERITY_COLORS[sev]}]`)} style={{ color: SEVERITY_COLORS[sev] }}>
                      {sev}
                    </span>
                    <span className="tabular-nums font-semibold">{v.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: SEVERITY_COLORS[sev] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendChart({ data }: { data: Array<{ period: string; count: number }> }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Tendencia mensual de hallazgos</CardTitle>
        <Badge variant="outline" className="text-[10px]">12 meses</Badge>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <RechartsTooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                fill="url(#trendGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ChildrenList({
  title,
  items,
  onClick,
}: {
  title: string;
  items: ChildEntity[];
  onClick: (item: ChildEntity) => void;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Badge variant="outline" className="text-[10px]">
          Top {Math.min(items.length, 10)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.slice(0, 10).map((item, idx) => {
            const pct = (item.count / max) * 100;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onClick(item)}
                className="group w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors"
              >
                <div className="text-xs text-muted-foreground tabular-nums w-5">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold tabular-nums">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-6">
              Sin elementos para este nivel
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineStrip({ pipeline }: { pipeline: Record<string, number> }) {
  const stages = [
    { key: 'Abierta', label: 'Abierta', color: 'bg-red-500', icon: AlertTriangle },
    { key: 'En Progreso', label: 'En Progreso', color: 'bg-amber-500', icon: Activity },
    { key: 'Remediada', label: 'Remediada', color: 'bg-blue-500', icon: Shield },
    { key: 'Cerrada', label: 'Cerrada', color: 'bg-emerald-500', icon: CheckCircle2 },
  ];
  const total = stages.reduce((s, st) => s + (pipeline[st.key] ?? 0), 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Pipeline de remediación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map((s) => {
            const v = pipeline[s.key] ?? 0;
            const pct = total ? Math.round((v / total) * 100) : 0;
            const Icon = s.icon;
            return (
              <div key={s.key} className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={cn('h-7 w-7 rounded-md flex items-center justify-center text-white', s.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium">{s.label}</span>
                </div>
                <div className="text-xl font-bold tabular-nums">{v.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">{pct}% del total</div>
                <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full', s.color)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EngineBarChart({ engines }: { engines: EngineStat[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Comparativo por motor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engines}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="motor" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <RechartsTooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {engines.map((e, i) => (
                  <Cell key={i} fill={ENGINE_COLORS[e.motor] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────

type FilterKey =
  | 'direccion_id'
  | 'subdireccion_id'
  | 'gerencia_id'
  | 'organizacion_id'
  | 'celula_id'
  | 'repositorio_id';

const LEVEL_FILTER: FilterKey[] = [
  'direccion_id',
  'subdireccion_id',
  'gerencia_id',
  'organizacion_id',
  'celula_id',
  'repositorio_id',
];

const CHILD_LABEL: Record<string, string> = {
  direccion: 'Direcciones',
  subdireccion: 'Subdirecciones',
  gerencia: 'Gerencias',
  organizacion: 'Organizaciones',
  celula: 'Células',
  repositorio: 'Repositorios',
  vulnerabilidad: 'Vulnerabilidades en repositorio',
};

export default function VulnerabilitiesDashboardPage() {
  const [path, setPath] = useState<{ name: string; level: number; id: string }[]>([
    { name: 'Global', level: 0, id: 'root' },
  ]);

  const currentLevel = path.length - 1;
  const filters: Partial<Record<FilterKey, string>> = {};
  path.forEach((p, idx) => {
    if (idx === 0) return;
    const key = LEVEL_FILTER[idx - 1];
    if (key) filters[key] = p.id;
  });

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-vulnerabilities', filters],
    queryFn: async () => {
      logger.info('dashboard.vulnerabilities.fetch', { level: currentLevel });
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
      const response = await apiClient.get(`/dashboard/vulnerabilities?${params.toString()}`);
      return response.data.data as VulnerabilitiesResponse;
    },
  });

  const handleChildClick = (item: ChildEntity) => {
    if (currentLevel >= 6) return;
    setPath([...path, { name: item.name, level: currentLevel + 1, id: item.id }]);
  };

  const handleLevelClick = (level: number) => {
    if (level >= path.length) return;
    setPath(path.slice(0, level + 1));
  };

  const summary = data?.summary;
  const totalCritica = summary?.by_severity?.CRITICA ?? 0;
  const totalCerrada = summary?.pipeline?.Cerrada ?? 0;
  const slaVencidos = data?.overdue_count ?? 0;
  const levelIdx = Math.min(currentLevel, 6);

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-6">
      {/* Left sidebar: niveles */}
      <LevelSidebar
        currentLevel={currentLevel}
        path={path.map((p) => ({ name: p.name, level: p.level }))}
        onLevelClick={handleLevelClick}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {path.map((p, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  <button
                    type="button"
                    onClick={() => handleLevelClick(i)}
                    className={cn(
                      'hover:text-primary transition-colors',
                      i === currentLevel && 'text-foreground font-semibold',
                    )}
                  >
                    {p.name}
                  </button>
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              Dashboard de Vulnerabilidades · {LEVELS[levelIdx].name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Drill-down jerárquico de 7 niveles · {LEVELS[levelIdx].label}
            </p>
          </div>
          {currentLevel > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLevelClick(currentLevel - 1)}
            >
              ← Volver al nivel anterior
            </Button>
          )}
        </div>

        {/* Engine cards row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Core Engines
            </h2>
            <Badge variant="outline" className="text-[10px]">
              5 motores (V2) + MAST
            </Badge>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {summary?.by_engine
                ?.filter((e) => ['SAST', 'DAST', 'SCA', 'CDS', 'MDA', 'MAST'].includes(e.motor))
                .map((e) => <EngineCard key={e.motor} {...e} />)}
            </div>
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Total Hallazgos Activos"
            value={summary?.total ?? 0}
            icon={Bug}
            color="bg-rose-500/10 text-rose-500"
            trend={{ value: 8, positive: false }}
          />
          <KpiCard
            label="Críticas Activas"
            hint="Severidad CRÍTICA"
            value={totalCritica}
            icon={AlertTriangle}
            color="bg-red-500/10 text-red-500"
            trend={{ value: 12, positive: false }}
          />
          <KpiCard
            label="SLA Vencidos"
            hint="Estimado D2 (7%)"
            value={slaVencidos}
            icon={Activity}
            color="bg-amber-500/10 text-amber-500"
            trend={{ value: 3, positive: true }}
          />
          <KpiCard
            label="Hallazgos Cerrados"
            hint="Estado: Cerrada"
            value={totalCerrada}
            icon={CheckCircle2}
            color="bg-emerald-500/10 text-emerald-500"
            trend={{ value: 15, positive: true }}
          />
        </div>

        {/* Charts row */}
        {!isLoading && summary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TrendChart data={summary.trend} />
            </div>
            <div>
              <SeverityBreakdown data={summary.by_severity} />
            </div>
          </div>
        )}

        {/* Pipeline strip */}
        {!isLoading && summary && <PipelineStrip pipeline={summary.pipeline} />}

        {/* Engine compare + Children */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EngineBarChart engines={summary?.by_engine ?? []} />
            {data?.children_type === 'vulnerabilidad' ? (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Vulnerabilidades en repositorio</CardTitle>
                </CardHeader>
                <CardContent>
                  {(data.vulnerabilities?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No se encontraron vulnerabilidades abiertas para este repositorio.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Motor</TableHead>
                          <TableHead>Severidad</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Detección</TableHead>
                          <TableHead>SLA</TableHead>
                          <TableHead>Estatus</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.vulnerabilities?.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell className="font-mono text-xs">{v.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-xs">{v.motor}</TableCell>
                            <TableCell className="text-xs">{v.severidad}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs">{v.titulo}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {v.fecha_deteccion ?? '—'}
                            </TableCell>
                            <TableCell className="text-xs">{v.sla?.slice(0, 10) ?? '—'}</TableCell>
                            <TableCell className="text-xs">{v.estado}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : data?.children_type ? (
              <ChildrenList
                title={CHILD_LABEL[data.children_type] ?? 'Detalle'}
                items={data.children}
                onClick={handleChildClick}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
