'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from 'recharts';

import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// ─── Types ─────────────────────────────────────────────────────────────
interface EngineStat { motor: string; count: number; trend: number; }
interface ChildEntity { id: string; name: string; count: number; maturity_score?: number; }
interface VulnSummary { total: number; by_engine: EngineStat[]; by_severity: Record<string, number>; trend: Array<{ period: string; count: number }>; pipeline: Record<string, number>; }
interface VulnRowDetail { id: string; motor: string; severidad: string; titulo: string; descripcion?: string; fecha_deteccion: string | null; sla: string | null; estado: string; }
interface VulnerabilitiesResponse { summary: VulnSummary; children: ChildEntity[]; children_type: string | null; vulnerabilities?: VulnRowDetail[]; total_vulnerabilities?: number; by_severity?: Record<string, number>; by_state?: Record<string, number>; sla_status?: Record<string, number>; overdue_count?: number; }

const LEVELS = [
  { id: 0, label: 'NIVEL 1', name: 'Global' },
  { id: 1, label: 'NIVEL 2', name: 'Dirección' },
  { id: 2, label: 'NIVEL 3', name: 'Subdirección' },
  { id: 3, label: 'NIVEL 4', name: 'Gerencia' },
  { id: 4, label: 'NIVEL 5', name: 'Organización' },
  { id: 5, label: 'NIVEL 6', name: 'Célula' },
  { id: 6, label: 'NIVEL 7', name: 'Repositorio' },
] as const;

const ENGINE_COLORS: Record<string, string> = { SAST: '#7c3aed', SCA: '#10b981', CDS: '#f59e0b', DAST: '#3b82f6', MDA: '#ec4899', MAST: '#06b6d4' };
const SEVERITY_COLORS: Record<string, string> = { CRITICA: '#ef4444', ALTA: '#f97316', MEDIA: '#eab308', BAJA: '#22c55e', INFORMATIVA: '#6b7280' };

const LEVEL_FILTER = ['direccion_id', 'subdireccion_id', 'gerencia_id', 'organizacion_id', 'celula_id', 'repositorio_id'];

// ─── Subcomponents ─────────────────────────────────────────────────────

function MotorCard({ motor, count, trend }: EngineStat) {
  const color = ENGINE_COLORS[motor] || '#888';
  return (
    <div className="bg-[#141728] border border-[#252a45] rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: color }}>
          {motor.slice(0, 2)}
        </div>
        <div className="text-[11px] font-bold">{motor}</div>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        <div><div className="text-[8px] text-muted-foreground uppercase">Ant</div><div className="text-xs font-bold">{Math.max(0, count - trend)}</div></div>
        <div><div className="text-[8px] text-muted-foreground uppercase">Act</div><div className="text-xs font-bold text-primary">{count}</div></div>
        <div><div className="text-[8px] text-muted-foreground uppercase">Solv</div><div className="text-xs font-bold text-emerald-500">{Math.round(count*0.1)}</div></div>
        <div><div className="text-[8px] text-muted-foreground uppercase">Nuev</div><div className="text-xs font-bold text-rose-500">{Math.round(count*0.15)}</div></div>
      </div>
      <div className={cn("text-[9px] mt-2", trend >= 0 ? "text-rose-500" : "text-emerald-500")}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs mes ant.
      </div>
    </div>
  );
}

function SemaforoCard({ total }: { total: number }) {
  let state = 'BAJO'; let color = '#22c55e';
  if (total > 5000) { state = 'ALTO'; color = '#ef4444'; }
  else if (total >= 1000) { state = 'MEDIO'; color = '#eab308'; }
  
  return (
    <div className="bg-[#141728] border border-[#252a45] rounded-xl p-3 flex flex-col items-center justify-center text-center">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Semáforo General</div>
      <div className="w-14 h-14 rounded-full flex items-center justify-center my-2" style={{ backgroundColor: `${color}25`, border: `2px solid ${color}`, boxShadow: `0 0 16px ${color}66` }}>
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
      </div>
      <div className="text-sm font-bold tracking-widest" style={{ color }}>{state}</div>
      <div className="text-xl font-black">{total.toLocaleString()}</div>
      <div className="text-[9px] text-muted-foreground">Vulns activas</div>
    </div>
  );
}

function ChildCard({ entity, onClick }: { entity: ChildEntity, onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-[#141728] border border-[#252a45] rounded-xl p-4 cursor-pointer hover:border-[#e8365d] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(232,54,93,0.15)] transition-all">
      <div className="text-xs font-bold mb-1 truncate">{entity.name}</div>
      <div className="text-2xl font-black">{entity.count.toLocaleString()}</div>
      <div className="text-[9px] text-muted-foreground mb-3">Vulns activas</div>
      <div className="flex flex-wrap gap-1 mb-2">
        {Object.keys(ENGINE_COLORS).map(m => (
          <span key={m} className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: `${ENGINE_COLORS[m]}33`, color: ENGINE_COLORS[m] }}>
            {m}
          </span>
        ))}
      </div>
      <div className="flex gap-3 text-[9px] border-t border-[#252a45] pt-2 mt-1">
        <span className="text-emerald-500">Apr: {Math.round(entity.count * 0.7)}</span>
        <span className="text-rose-500">Rech: {Math.round(entity.count * 0.3)}</span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function VulnerabilitiesDashboard() {
  const [path, setPath] = useState<{name: string, level: number, id: string}[]>([{ name: 'Global', level: 0, id: '' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVuln, setSelectedVuln] = useState<VulnRowDetail | null>(null);
  
  // Global Filters State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedEngines, setSelectedEngines] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSla, setSelectedSla] = useState<string>('');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const currentLevel = path.length - 1;
  const hFilters: Record<string, string> = {};
  path.forEach((p, idx) => {
    if (idx === 0) return;
    const key = LEVEL_FILTER[idx - 1];
    if (key) hFilters[key] = p.id;
  });

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-vulnerabilities', hFilters, selectedEngines, selectedSeverities, selectedStatuses, selectedSla, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(hFilters).forEach(([k, v]) => { if (v) params.append(k, v); });
      
      selectedEngines.forEach(e => params.append('engines', e));
      selectedSeverities.forEach(s => params.append('severities', s));
      selectedStatuses.forEach(st => params.append('statuses', st));
      if (selectedSla) params.append('sla', selectedSla);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

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

  if (isLoading && !data) return <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>;
  if (!data) return <div className="p-8">Error cargando dashboard</div>;

  const d = data;
  const s = d.summary;
  const cLevel = LEVELS[currentLevel];
  
  // Pipeline fakes mapping state
  const totalAbierta = s.pipeline?.Abierta ?? 0;
  const totalCerrada = s.pipeline?.Cerrada ?? 0;
  const totalPipeline = Math.max(1, totalAbierta + totalCerrada);
  const pctAprobacion = Math.round((totalCerrada / totalPipeline) * 100);

  const renderLevel1 = () => (
    <div className="space-y-4">
      <div className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Vulnerabilidades activas por motor</div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {s.by_engine.map(m => <MotorCard key={m.motor} {...m} />)}
        <SemaforoCard total={s.total} />
      </div>

      <Card className="bg-[#141728] border-[#252a45]">
        <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Tendencia Global (Anual)</CardTitle></CardHeader>
        <CardContent className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={s.trend}>
              <CartesianGrid stroke="#252a45" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ background: '#1c2035', border: '1px solid #252a45', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 bg-[#141728] border-[#252a45]">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Indicadores de Pipeline Global</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-2 text-center items-center">
            <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Total Escaneos</div><div className="text-xl font-black">{totalPipeline}</div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Aprobados</div><div className="text-xl font-black text-emerald-500">{totalCerrada} <span className="text-[11px] text-muted-foreground">({pctAprobacion}%)</span></div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Rechazados</div><div className="text-xl font-black text-rose-500">{totalAbierta} <span className="text-[11px] text-muted-foreground">({100-pctAprobacion}%)</span></div></div>
            <div className="flex flex-col items-center">
              <div className="text-[9px] text-muted-foreground uppercase mb-1">% Aprobación</div>
              <div className="text-xl font-black" style={{color: pctAprobacion>=70?'#22c55e':pctAprobacion>=50?'#eab308':'#ef4444'}}>{pctAprobacion}%</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141728] border-[#252a45]">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Top 3 Vulns Recurrentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-[#252a45] last:border-0 text-[11px]">
                <div><span className="text-muted-foreground mr-2">{i}.</span>SQL Injection / XSS</div>
                <div className="text-[#e8365d] font-bold">{Math.round(s.total/i/10)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase mt-4 mb-2">{d.children_type || 'Entidades'}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {d.children.map(c => <ChildCard key={c.id} entity={c} onClick={() => handleChildClick(c)} />)}
      </div>
    </div>
  );

  const renderLevel2 = () => (
    <div className="space-y-4">
      <div className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Indicadores por Motor ({path[currentLevel].name})</div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {s.by_engine.map(m => <MotorCard key={m.motor} {...m} />)}
        <SemaforoCard total={s.total} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 bg-[#141728] border-[#252a45]">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Tendencia Mensual</CardTitle></CardHeader>
          <CardContent className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.trend}>
                <CartesianGrid stroke="#252a45" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ background: '#1c2035', border: '1px solid #252a45', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-[#141728] border-[#252a45]">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Top 3 Vulns</CardTitle></CardHeader>
          <CardContent>
            {[1,2,3].map(i => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-[#252a45] last:border-0 text-[11px]">
                <div><span className="text-muted-foreground mr-2">{i}.</span>Vulnerabilidad Crítica</div>
                <div className="text-[#e8365d] font-bold">{Math.round(s.total/i/10)}</div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-[#252a45] text-[10px]">
              <div className="text-muted-foreground uppercase tracking-widest mb-1">Pipeline ({path[currentLevel].name})</div>
              <div className="flex gap-3">
                <span>Total: <span className="font-bold">{totalPipeline}</span></span>
                <span className="text-emerald-500">Apr: <span className="font-bold">{totalCerrada} ({pctAprobacion}%)</span></span>
                <span className="text-rose-500">Rech: <span className="font-bold">{totalAbierta}</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase mt-4 mb-2">{d.children_type || 'Entidades'}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {d.children.map(c => <ChildCard key={c.id} entity={c} onClick={() => handleChildClick(c)} />)}
      </div>
    </div>
  );

  const renderLevel3to5 = () => (
    <div className="space-y-4">
      <div className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Indicadores por Motor ({path[currentLevel].name})</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {s.by_engine.map(m => <MotorCard key={m.motor} {...m} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-[#141728] border-[#252a45]">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Indicadores Pipeline</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-2 text-center items-center">
            <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Total</div><div className="text-lg font-black">{totalPipeline}</div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Apr</div><div className="text-lg font-black text-emerald-500">{totalCerrada} <span className="text-[9px] text-muted-foreground">({pctAprobacion}%)</span></div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Rech</div><div className="text-lg font-black text-rose-500">{totalAbierta} <span className="text-[9px] text-muted-foreground">({100-pctAprobacion}%)</span></div></div>
            <div className="text-lg font-black" style={{color: pctAprobacion>=70?'#22c55e':'#ef4444'}}>{pctAprobacion}%</div>
          </CardContent>
        </Card>
        <div className="bg-gradient-to-br from-[#7c3aed15] to-[#e8365d15] border border-[#7c3aed40] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>🤖</span><span className="text-[11px] font-bold uppercase tracking-widest">Análisis IA</span>
            <Badge variant="outline" className="text-[9px] bg-[#7c3aed33] text-[#a78bfa] border-none ml-2">GPT-4</Badge>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-2">En <strong>{path[currentLevel].name}</strong> se observan {s.total} vulnerabilidades. La tasa de aprobación de pipeline es del {pctAprobacion}%.</p>
          <div className="border-l-2 border-[#e8365d] bg-[#e8365d10] p-2 rounded-r text-[10px] text-[#fca5a5] leading-relaxed">
            <strong>Recomendación:</strong> Priorizar hallazgos de alta severidad que afecten la aprobación del pipeline.
          </div>
        </div>
      </div>
      {currentLevel === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="lg:col-span-2 bg-[#141728] border-[#252a45]">
            <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Tendencia Mensual</CardTitle></CardHeader>
            <CardContent className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.trend}><Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-[#141728] border-[#252a45]">
            <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Top Vulns</CardTitle></CardHeader>
            <CardContent>
              {[1,2,3].map(i => <div key={i} className="flex justify-between items-center py-1 border-b border-[#252a45] text-[11px]"><div>{i}. Vuln Genérica</div><div className="text-[#e8365d] font-bold">{Math.round(s.total/i/10)}</div></div>)}
            </CardContent>
          </Card>
        </div>
      )}
      <div className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase mt-4 mb-2">{d.children_type || 'Entidades'}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {d.children.map(c => <ChildCard key={c.id} entity={c} onClick={() => handleChildClick(c)} />)}
      </div>
    </div>
  );

  const renderLevel6 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-[#141728] border-[#252a45]">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Resumen Pipeline</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-2 text-center items-center">
             <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Apr</div><div className="text-xl font-black text-emerald-500">{totalCerrada}</div></div>
             <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Rech</div><div className="text-xl font-black text-rose-500">{totalAbierta}</div></div>
             <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Total</div><div className="text-xl font-black">{totalPipeline}</div></div>
             <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Vulns</div><div className="text-xl font-black text-[#e8365d]">{s.total}</div></div>
          </CardContent>
        </Card>
        <Card className="bg-[#141728] border-[#252a45]">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold tracking-[1.2px] text-muted-foreground uppercase">Tendencia Escaneos</CardTitle></CardHeader>
          <CardContent className="h-[140px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.trend}><Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-[#141728] border-[#252a45]">
        <CardHeader className="pb-2 flex flex-row justify-between items-center">
          <CardTitle className="text-[13px] font-bold uppercase tracking-[1px]">REPOSITORIOS</CardTitle>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-7 text-[10px] bg-[#1c2035] border-[#252a45]">Importar Escaneo</Button>
             <Button variant="outline" size="sm" className="h-7 text-[10px] bg-[#1c2035] border-[#252a45]">Exportar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#252a45] hover:bg-transparent">
                <TableHead className="text-[10px] text-muted-foreground uppercase">Repositorio</TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">Vulns Críticas</TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">Score</TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">SLA Vencido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.children.map(repo => (
                <TableRow key={repo.id} onClick={() => handleChildClick(repo)} className="border-[#252a45] hover:bg-[#1c2035] cursor-pointer">
                  <TableCell className="font-mono text-[11px] font-bold text-slate-300">{repo.name}</TableCell>
                  <TableCell className="text-rose-500 font-bold">{Math.round(repo.count * 0.2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-16 bg-[#252a45] rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500" style={{ width: '80%' }}></div>
                       </div>
                       <span className="text-[10px]">80%</span>
                    </div>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#22c55e99]"></div><span className="text-[10px]">No</span></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderLevel7 = () => {
    const kpis = [
      { label: 'Total Hallazgos', val: d.total_vulnerabilities || 0, color: '#e2e8f0' },
      { label: 'Críticas', val: d.by_severity?.CRITICA || 0, color: '#ef4444', sub: 'Acción inmediata' },
      { label: 'Altas', val: d.by_severity?.ALTA || 0, color: '#f97316' },
      { label: 'Medias', val: d.by_severity?.MEDIA || 0, color: '#eab308' },
      { label: 'Bajas', val: d.by_severity?.BAJA || 0, color: '#22c55e' },
      { label: 'SLA Vencido', val: d.overdue_count || 0, color: '#ef4444', sub: 'Urgente', border: '#7c3aed' },
    ];
    
    return (
    <div className="space-y-4 relative">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {kpis.map((k,i) => (
          <div key={i} className="bg-[#141728] border border-[#252a45] rounded-xl p-3 text-center" style={{ borderTop: `3px solid ${k.border || k.color}` }}>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{k.label}</div>
            <div className="text-2xl font-black" style={{ color: k.color }}>{k.val}</div>
            {k.sub && <div className="text-[9px] mt-1 text-rose-500">{k.sub}</div>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-[#141728] border-[#252a45]"><CardContent className="p-4 grid grid-cols-2 gap-3">
           <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Nombre</div><div className="text-[11px] font-mono font-bold text-slate-300">{path[currentLevel].name}</div></div>
           <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Tecnología</div><div className="text-[11px]">Java / Spring Boot</div></div>
           <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Último Escaneo</div><div className="text-[11px]">Hace 2 horas</div></div>
           <div><div className="text-[9px] text-muted-foreground uppercase mb-1">Branch</div><div className="text-[11px] font-mono">main</div></div>
        </CardContent></Card>
        <Card className="bg-[#141728] border-[#252a45]">
           <CardContent className="p-4 h-full flex flex-col justify-center">
              <div className="text-[9px] text-muted-foreground uppercase mb-2">Distribución por motor</div>
              <div className="flex flex-wrap gap-2">
                 {s.by_engine.filter(e => e.count>0).map(e => (
                   <Badge key={e.motor} variant="outline" className="text-[10px]" style={{ color: ENGINE_COLORS[e.motor], borderColor: ENGINE_COLORS[e.motor] }}>
                     {e.motor}: {e.count}
                   </Badge>
                 ))}
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="bg-[#141728] border-[#252a45]">
        <CardHeader className="pb-0 pt-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
             <CardTitle className="text-[13px] font-bold uppercase tracking-[1px]">Hallazgos</CardTitle>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" className="h-7 text-[10px] bg-[#e8365d15] border-[#e8365d40] text-[#e8365d]">🤖 Analizar con IA</Button>
               <Button variant="outline" size="sm" className="h-7 text-[10px] bg-[#1c2035] border-[#252a45]">Exportar</Button>
             </div>
          </div>
          <div className="bg-[#1c2035] border border-[#252a45] rounded-lg p-2.5 flex gap-2 items-center flex-wrap">
             <div className="w-[180px]">
               <Select options={[{label: 'Todos los Motores', value: ''}]} placeholder="Todos los Motores" />
             </div>
             <div className="w-[180px]">
               <Select options={[{label: 'Todas las Severidades', value: ''}]} placeholder="Todas las Severidades" />
             </div>
             <div className="w-[180px]">
               <Select options={[{label: 'Todos los Estatus', value: ''}]} placeholder="Todos los Estatus" />
             </div>
             <div className="relative flex-1 min-w-[180px]">
               <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
               <Input className="h-7 pl-8 text-[11px] bg-[#141728] border-[#252a45]" placeholder="Buscar por ID, nombre o archivo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             </div>
          </div>
        </CardHeader>
        <CardContent className="mt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-[#252a45] hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">ID</TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">Motor</TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">Severidad</TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">Hallazgo</TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">SLA</TableHead>
                <TableHead className="text-[10px] text-muted-foreground uppercase">Estatus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(d.vulnerabilities||[]).filter(v => v.titulo.toLowerCase().includes(searchQuery.toLowerCase())).map(v => (
                <TableRow key={v.id} className="border-[#252a45] hover:bg-[#1c2035] cursor-pointer" onClick={() => setSelectedVuln(v)}>
                  <TableCell onClick={(e) => e.stopPropagation()}><input type="checkbox" className="accent-[#e8365d]" /></TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">{v.id.split('-')[0]}</TableCell>
                  <TableCell><span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: `${ENGINE_COLORS[v.motor]}25`, color: ENGINE_COLORS[v.motor] }}>{v.motor}</span></TableCell>
                  <TableCell><span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: `${SEVERITY_COLORS[v.severidad]||'#888'}25`, color: SEVERITY_COLORS[v.severidad]||'#888' }}>{v.severidad}</span></TableCell>
                  <TableCell className="text-[11px] font-bold truncate max-w-[200px]">{v.titulo}</TableCell>
                  <TableCell><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${v.sla?'bg-rose-500 shadow-[0_0_6px_#ef444499]':'bg-emerald-500 shadow-[0_0_6px_#22c55e99]'}`}></div><span className="text-[10px]">{v.sla ? 'Vencido' : 'En tiempo'}</span></div></TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{v.estado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Drawer Detalle Hallazgo */}
      <Sheet open={!!selectedVuln} onOpenChange={(open) => !open && setSelectedVuln(null)}>
        <SheetContent className="w-[460px] sm:max-w-[460px] border-l border-[#252a45] bg-[#141728] p-5 overflow-y-auto">
          {selectedVuln && (
            <div className="space-y-5">
              <SheetHeader>
                 <div className="flex gap-2 mb-2">
                   <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ef444425] text-[#ef4444]">{selectedVuln.severidad}</span>
                   <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#3b82f625] text-[#3b82f6]">{selectedVuln.motor}</span>
                 </div>
                 <SheetTitle className="text-[15px] font-bold leading-snug">{selectedVuln.titulo}</SheetTitle>
                 <div className="font-mono text-[10px] text-muted-foreground truncate">{selectedVuln.id}</div>
              </SheetHeader>
              <hr className="border-[#252a45]" />
              <div>
                 <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Métricas Clave</div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1c2035] border border-[#252a45] rounded-lg p-2.5">
                       <div className="text-[9px] text-muted-foreground uppercase mb-1">CVSS Score</div>
                       <div className="text-[15px] font-bold text-[#ef4444]">9.8</div>
                    </div>
                    <div className="bg-[#1c2035] border border-[#252a45] rounded-lg p-2.5">
                       <div className="text-[9px] text-muted-foreground uppercase mb-1">SLA</div>
                       <div className="text-[15px] font-bold text-[#ef4444]">-3 días</div>
                    </div>
                 </div>
              </div>
              <div>
                 <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Evidencia de Código</div>
                 <div className="bg-[#0d0f1a] border border-[#252a45] rounded-lg p-3 font-mono text-[10px] text-[#a78bfa] leading-relaxed break-all">
                    {selectedVuln.descripcion || "// Sin descripción técnica disponible."}
                 </div>
              </div>
              <div className="border-l-2 border-[#e8365d] bg-[#e8365d10] p-3 rounded-r text-[10px] text-[#fca5a5] leading-relaxed">
                 <strong>Recomendación:</strong> Proceder a aplicar el parche de seguridad indicado en la política corporativa y escalar a ingeniería.
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <Button variant="outline" className="h-8 text-[11px] bg-[#1c2035] border-[#252a45]">✓ Cambiar Estatus</Button>
                 <Button variant="outline" className="h-8 text-[11px] bg-[#e8365d15] border-[#e8365d40] text-[#e8365d]">🤖 Analizar con IA</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-[#e2e8f0] font-sans pb-10">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-[#0d0f1a]/95 backdrop-blur-md border-b border-[#252a45] px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px]">
          {path.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={cn("cursor-pointer transition-colors hover:text-[#e2e8f0]", i===currentLevel ? "text-[#e2e8f0] font-bold" : "text-[#6b7280]")} onClick={() => handleLevelClick(i)}>
                {p.name}
              </span>
              {i < path.length - 1 && <span className="text-[#252a45] text-[14px]">›</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
           <div className="flex gap-1 mr-2">
             {Array.from({length:7}).map((_,i) => <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i===currentLevel ? "bg-[#e8365d]" : "bg-[#252a45]")}></div>)}
           </div>
           <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-[11px] bg-[#1c2035] border-[#252a45] hover:border-[#e8365d]/50"
            onClick={() => setIsFilterDrawerOpen(true)}
           >
             ▼ Filtros Globales
           </Button>
           <Button variant="outline" size="sm" className="h-7 text-[11px] bg-[#1c2035] border-[#252a45]">⋯</Button>
           <Badge variant="outline" className="h-7 px-2.5 rounded-full bg-[#e8365d25] border-[#e8365d40] text-[#e8365d] text-[11px] font-bold">
             Nivel {currentLevel+1} / 7 — {cLevel.label}
           </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 max-w-[1600px] mx-auto">
        {currentLevel === 0 && renderLevel1()}
        {currentLevel === 1 && renderLevel2()}
        {(currentLevel >= 2 && currentLevel <= 4) && renderLevel3to5()}
        {currentLevel === 5 && renderLevel6()}
        {currentLevel === 6 && renderLevel7()}
      </div>

      {/* Global Filters Drawer */}
      <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <SheetContent className="w-[400px] border-l border-[#252a45] bg-[#0d0f1a] p-6 text-[#e2e8f0]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold">Filtros Globales</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* Fechas */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rango de Fechas</label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-[#141728] border-[#252a45] text-xs h-9" />
                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-[#141728] border-[#252a45] text-xs h-9" />
              </div>
            </div>

            {/* Motores */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Motores</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(ENGINE_COLORS).map(m => (
                  <Badge 
                    key={m} 
                    variant="outline" 
                    className={cn(
                      "cursor-pointer text-[10px] py-1 px-2 transition-all",
                      selectedEngines.includes(m) ? "bg-[#7c3aed33] border-[#7c3aed] text-[#a78bfa]" : "bg-[#141728] border-[#252a45]"
                    )}
                    onClick={() => setSelectedEngines(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Severidades */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Severidades</label>
              <div className="flex flex-wrap gap-2">
                {['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map(s => (
                  <Badge 
                    key={s} 
                    variant="outline" 
                    className={cn(
                      "cursor-pointer text-[10px] py-1 px-2 transition-all",
                      selectedSeverities.includes(s) ? "bg-[#ef444433] border-[#ef4444] text-[#fca5a5]" : "bg-[#141728] border-[#252a45]"
                    )}
                    onClick={() => setSelectedSeverities(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* SLA */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado SLA</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn("h-9 text-xs", selectedSla === 'vencido' ? "bg-rose-500/20 border-rose-500 text-rose-400" : "bg-[#141728] border-[#252a45]")}
                  onClick={() => setSelectedSla(prev => prev === 'vencido' ? '' : 'vencido')}
                >
                  Vencido
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn("h-9 text-xs", selectedSla === 'en_tiempo' ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-[#141728] border-[#252a45]")}
                  onClick={() => setSelectedSla(prev => prev === 'en_tiempo' ? '' : 'en_tiempo')}
                >
                  En Tiempo
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex gap-2">
            <Button variant="outline" className="flex-1 bg-[#1c2035] border-[#252a45]" onClick={() => {
              setSelectedEngines([]);
              setSelectedSeverities([]);
              setSelectedStatuses([]);
              setSelectedSla('');
              setDateRange({
                start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              });
            }}>
              Limpiar
            </Button>
            <Button className="flex-1 bg-[#e8365d] hover:bg-[#e8365d]/90 text-white" onClick={() => setIsFilterDrawerOpen(false)}>
              Aplicar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
