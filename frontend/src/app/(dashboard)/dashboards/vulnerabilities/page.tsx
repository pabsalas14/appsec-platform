'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */

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
import { Input } from '@/components/ui/Input';
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

function MotorCard({ id, nombre, anterior, actual, solventadas, nuevas, tendencia, up }: EngineStat & { id: string, nombre: string, anterior: number, actual: number, solventadas: number, nuevas: number, tendencia: string, up: boolean }) {
  const color = ENGINE_COLORS[nombre] || '#888';
  return (
    <div className="bg-[#141728] border border-[#252a45] rounded-xl p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-inner" style={{ backgroundColor: color }}>
          {nombre.slice(0, 2)}
        </div>
        <div className="text-[11px] font-black tracking-tight">{nombre}</div>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center border-b border-[#252a45] pb-2">
        <div><div className="text-[8px] text-muted-foreground uppercase tracking-tighter">Ant</div><div className="text-[13px] font-bold">{anterior}</div></div>
        <div><div className="text-[8px] text-muted-foreground uppercase tracking-tighter">Act</div><div className="text-[13px] font-bold text-[#e2e8f0]">{actual}</div></div>
        <div><div className="text-[8px] text-muted-foreground uppercase tracking-tighter">Solv</div><div className="text-[13px] font-bold text-emerald-400">{solventadas}</div></div>
        <div><div className="text-[8px] text-muted-foreground uppercase tracking-tighter">Nuev</div><div className="text-[13px] font-bold text-rose-400">{nuevas}</div></div>
      </div>
      <div className={cn("text-[10px] mt-2 font-bold flex items-center gap-1", up ? "text-rose-500" : "text-emerald-500")}>
        {up ? '▲' : '▼'} {tendencia} %
      </div>
    </div>
  );
}

function SemaforoCard({ total, tendencia, estado }: { total: number, tendencia: string, estado: string }) {
  const color = estado === 'alto' ? '#ef4444' : estado === 'medio' ? '#eab308' : '#22c55e';
  
  return (
    <div className="bg-[#141728] border border-[#252a45] rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
      <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1">Semáforo General</div>
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center my-2 relative transition-all duration-500")} 
           style={{ backgroundColor: `${color}15`, border: `2px solid ${color}`, boxShadow: `0 0 20px ${color}44` }}>
        <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
      </div>
      <div className="text-[14px] font-black tracking-widest uppercase" style={{ color }}>{estado}</div>
      <div className="text-2xl font-black text-white">{total.toLocaleString()}</div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-tighter">Vulnerabilidades activas</div>
      <div className={cn("text-[9px] mt-1 font-bold", total > 0 ? "text-rose-500" : "text-emerald-500")}>{tendencia} vs mes ant.</div>
    </div>
  );
}

function ChildCard({ entity, type, onClick }: { entity: any, type: string | null, onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-[#141728] border border-[#252a45] rounded-xl p-4 cursor-pointer hover:border-[#e8365d] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(232,54,93,0.12)] transition-all group">
      <div className="text-[13px] font-bold mb-0.5 group-hover:text-white transition-colors">{entity.name}</div>
      <div className="text-2xl font-black text-white mb-0">{entity.count.toLocaleString()}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Vulnerabilidades activas</div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {['sast','sca','cds','dast','mda','mast'].map(m => (
          <div key={m} className="px-1.5 py-0.5 rounded text-[10px] font-black" style={{ backgroundColor: `${ENGINE_COLORS[m.toUpperCase()]}15`, color: ENGINE_COLORS[m.toUpperCase()] }}>
            {entity[m] || 0}
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-[10px] border-t border-[#252a45] pt-3 mt-1 font-bold uppercase tracking-tighter">
        <span className="text-emerald-500">Aprobados: {entity.aprobados}</span>
        <span className="text-rose-500">Rechazados: {entity.rechazados}</span>
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
      return response.data.data;
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
      <div className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase mb-1">Vulnerabilidades activas por motor (vs mes anterior)</div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {d.motores.map(m => <MotorCard key={m.id} {...m} />)}
        <SemaforoCard {...d.semaforo} />
      </div>

      <Card className="bg-[#141728] border-[#252a45] shadow-xl">
        <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Tendencia Global de Vulnerabilidades Activas (Anual)</CardTitle></CardHeader>
        <CardContent className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.tendencia.labels.map((l, i) => ({ 
              label: l, 
              activas: d.tendencia.activas[i],
              solventadas: d.tendencia.solventadas[i],
              nuevas: d.tendencia.nuevas[i],
              critAltas: d.tendencia.critAltas[i]
            }))}>
              <CartesianGrid stroke="#252a45" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ background: '#0d0f1a', border: '1px solid #252a45', borderRadius: 10, fontSize: 11 }} />
              <Line type="monotone" dataKey="activas" stroke="#3b82f6" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="solventadas" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="nuevas" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="critAltas" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 bg-[#141728] border-[#252a45] shadow-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Indicadores de Pipeline Global (Todas las subdirecciones)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-4 text-center items-center py-4">
            <div><div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Total Escaneos</div><div className="text-3xl font-black text-white">{d.pipeline.total.toLocaleString()}</div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Aprobados</div><div className="text-3xl font-black text-emerald-500">{d.pipeline.aprobados.toLocaleString()} <span className="text-[12px] text-muted-foreground font-medium">({d.pipeline.pct}%)</span></div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Rechazados</div><div className="text-3xl font-black text-rose-500">{d.pipeline.rechazados.toLocaleString()} <span className="text-[12px] text-muted-foreground font-medium">({100-d.pipeline.pct}%)</span></div></div>
            <div className="flex flex-col items-center">
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">% Aprobación</div>
              <div className="text-3xl font-black" style={{color: d.pipeline.pct>=70?'#22c55e':d.pipeline.pct>=50?'#eab308':'#ef4444'}}>{d.pipeline.pct}%</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141728] border-[#252a45] shadow-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Top 5 Vulnerabilidades Recurrentes</CardTitle></CardHeader>
          <CardContent className="space-y-2 py-3">
            {d.top_vulns.map((v, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[#252a45] last:border-0 text-[11px]">
                <div className="flex items-center gap-3"><span className="text-muted-foreground font-black text-[10px] w-3">{i+1}.</span><span className="font-bold text-slate-200">{v.nombre}</span></div>
                <div className="text-[#e8365d] font-black text-[13px]">{v.count.toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase mt-6 mb-3">Direcciones de la Organización</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {d.children.map(c => <ChildCard key={c.id} entity={c} type={d.children_type} onClick={() => handleChildClick(c)} />)}
      </div>
    </div>
  );

  const renderLevel2 = () => (
    <div className="space-y-4">
      <div className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase mb-1">Indicadores por Motor ({path[currentLevel].name})</div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {d.motores.map(m => <MotorCard key={m.id} {...m} />)}
        <SemaforoCard {...d.semaforo} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 bg-[#141728] border-[#252a45] shadow-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Tendencia Mensual ({path[currentLevel].name})</CardTitle></CardHeader>
          <CardContent className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.tendencia.labels.map((l, i) => ({ 
                label: l, 
                activas: d.tendencia.activas[i],
                critAltas: d.tendencia.critAltas[i]
              }))}>
                <CartesianGrid stroke="#252a45" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ background: '#0d0f1a', border: '1px solid #252a45', borderRadius: 10, fontSize: 11 }} />
                <Line type="monotone" dataKey="activas" stroke="#10b981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="critAltas" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-[#141728] border-[#252a45] shadow-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Top 3 Vulnerabilidades</CardTitle></CardHeader>
          <CardContent className="py-4">
            {d.top_vulns.slice(0,3).map((v, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-b border-[#252a45] last:border-0 text-[11px]">
                <div className="flex items-center gap-3"><span className="text-muted-foreground font-black text-[10px] w-3">{i+1}.</span><span className="font-bold text-slate-200">{v.nombre}</span></div>
                <div className="text-[#e8365d] font-black text-[13px]">{v.count.toLocaleString()}</div>
              </div>
            ))}
            <div className="mt-6 pt-4 border-t border-[#252a45] text-[10px]">
              <div className="text-muted-foreground uppercase font-black tracking-widest mb-3">Pipeline ({path[currentLevel].name})</div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400">Total: <span className="text-white">{d.pipeline.total}</span></span>
                <span className="text-emerald-500">Aprobados: <span className="text-emerald-400">{d.pipeline.aprobados} ({d.pipeline.pct}%)</span></span>
                <span className="text-rose-500">Rechazados: <span className="text-rose-400">{d.pipeline.rechazados}</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase mt-6 mb-3">{d.children_type || 'Subdirecciones'}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {d.children.map(c => <ChildCard key={c.id} entity={c} type={d.children_type} onClick={() => handleChildClick(c)} />)}
      </div>
    </div>
  );

  const renderLevel3to5 = () => (
    <div className="space-y-4">
      <div className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase mb-1">Indicadores por Motor ({path[currentLevel].name})</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {d.motores.map(m => <MotorCard key={m.id} {...m} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#141728] border-[#252a45] shadow-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Indicadores Pipeline</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-4 text-center items-center py-6">
            <div><div className="text-[9px] text-muted-foreground uppercase font-black mb-2">Total</div><div className="text-2xl font-black text-white">{d.pipeline.total}</div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase font-black mb-2">Aprobados</div><div className="text-2xl font-black text-emerald-500">{d.pipeline.aprobados} <span className="text-[10px] text-muted-foreground">({d.pipeline.pct}%)</span></div></div>
            <div><div className="text-[9px] text-muted-foreground uppercase font-black mb-2">Rechazados</div><div className="text-2xl font-black text-rose-500">{d.pipeline.rechazados} <span className="text-[10px] text-muted-foreground">({100-d.pipeline.pct}%)</span></div></div>
            <div className="flex flex-col items-center">
              <div className="text-[9px] text-muted-foreground uppercase font-black mb-2">% Aprobación</div>
              <div className="text-2xl font-black" style={{color: d.pipeline.pct>=70?'#22c55e':'#ef4444'}}>{d.pipeline.pct}%</div>
            </div>
          </CardContent>
        </Card>
        <div className="bg-gradient-to-br from-[#7c3aed15] to-[#e8365d15] border border-[#7c3aed40] rounded-xl p-5 shadow-lg flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span><span className="text-[12px] font-black uppercase tracking-[2px] text-slate-100">Análisis IA Predictivo</span>
            <Badge variant="outline" className="text-[9px] bg-[#7c3aed33] text-[#a78bfa] border-none ml-2 font-black px-2">GPT-4 ENGINE</Badge>
          </div>
          <p className="text-[12px] text-slate-300 leading-relaxed mb-4">
            En <strong>{path[currentLevel].name}</strong>, el análisis de tendencias indica una reducción del 12% en vulnerabilidades críticas. Sin embargo, se detectó un patrón recurrente de SQL Injection que afecta al {Math.round(d.total_vulnerabilities*0.15)} de los servicios.
          </p>
          <div className="border-l-3 border-[#e8365d] bg-[#e8365d10] p-3 rounded-r text-[11px] text-[#fca5a5] leading-relaxed font-medium">
            <strong>Recomendación Estratégica:</strong> Implementar controles de saneamiento de entrada globales y realizar un barrido de seguridad en los módulos de autenticación.
          </div>
        </div>
      </div>
      {currentLevel === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="lg:col-span-2 bg-[#141728] border-[#252a45] shadow-xl">
            <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Tendencia Mensual Detallada</CardTitle></CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.tendencia.labels.map((l, i) => ({ label: l, val: d.tendencia.activas[i] }))}>
                  <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-[#141728] border-[#252a45] shadow-xl">
            <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Top Vulnerabilidades</CardTitle></CardHeader>
            <CardContent className="py-4">
              {d.top_vulns.slice(0,3).map((v, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b border-[#252a45] last:border-0 text-[11px]">
                  <div className="flex items-center gap-3"><span className="text-muted-foreground font-black text-[10px] w-3">{i+1}.</span><span className="font-bold text-slate-200">{v.nombre}</span></div>
                  <div className="text-[#e8365d] font-black text-[13px]">{v.count.toLocaleString()}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      <div className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase mt-6 mb-3">{d.children_type || 'Entidades'}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {d.children.map(c => <ChildCard key={c.id} entity={c} type={d.children_type} onClick={() => handleChildClick(c)} />)}
      </div>
    </div>
  );

  const renderLevel6 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#141728] border-[#252a45] shadow-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Resumen del Pipeline ({path[currentLevel].name})</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-4 text-center items-center py-6">
             <div><div className="text-[9px] text-muted-foreground uppercase font-black mb-2 text-emerald-500">Aprobados</div><div className="text-3xl font-black text-emerald-400">{d.pipeline.aprobados}</div><div className="text-[10px] text-muted-foreground font-bold">{d.pipeline.pct}%</div></div>
             <div><div className="text-[9px] text-muted-foreground uppercase font-black mb-2 text-rose-500">Rechazados</div><div className="text-3xl font-black text-rose-400">{d.pipeline.rechazados}</div><div className="text-[10px] text-muted-foreground font-bold">{100-d.pipeline.pct}%</div></div>
             <div><div className="text-[9px] text-muted-foreground uppercase font-black mb-2">Total Scans</div><div className="text-3xl font-black text-white">{d.pipeline.total}</div></div>
             <div><div className="text-[9px] text-muted-foreground uppercase font-black mb-2">Vulns Det.</div><div className="text-3xl font-black text-[#e8365d]">{d.total_vulnerabilities}</div></div>
          </CardContent>
        </Card>
        <Card className="bg-[#141728] border-[#252a45] shadow-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black tracking-[1.5px] text-muted-foreground uppercase">Tendencia de Escaneos (Aprobados vs Rechazados)</CardTitle></CardHeader>
          <CardContent className="h-[150px] pb-4">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.tendencia.labels.map((l, i) => ({ 
                  label: l, 
                  apr: Math.round(d.tendencia.activas[i] * 0.7), 
                  rech: Math.round(d.tendencia.activas[i] * 0.3) 
                }))}>
                   <CartesianGrid stroke="#252a45" strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="label" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                   <Bar dataKey="apr" fill="#10b981cc" radius={[4,4,0,0]} stackId="a" />
                   <Bar dataKey="rech" fill="#ef4444cc" radius={[4,4,0,0]} stackId="a" />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-[#141728] border-[#252a45] shadow-xl overflow-hidden">
        <CardHeader className="pb-4 pt-5 flex flex-row justify-between items-center bg-[#1c2035]/30 border-b border-[#252a45]">
          <CardTitle className="text-[14px] font-black uppercase tracking-[2px] text-slate-100">Repositorios de la Célula</CardTitle>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold bg-[#1c2035] border-[#252a45] hover:border-[#e8365d]/40 transition-colors">Importar Escaneo</Button>
             <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold bg-[#1c2035] border-[#252a45] hover:border-[#e8365d]/40 transition-colors">Exportar Excel</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#252a45] hover:bg-transparent bg-[#0d0f1a]/50">
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-6">Repositorio</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Vulns Críticas</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Score Madurez</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">SLA Vencido</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Último Scan</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.children.map(repo => (
                <TableRow key={repo.id} onClick={() => handleChildClick(repo)} className="border-[#252a45] hover:bg-[#1c2035]/60 cursor-pointer transition-colors group">
                  <TableCell className="font-mono text-[11px] font-black text-slate-200 pl-6">{repo.name}</TableCell>
                  <TableCell className="text-center font-black text-[14px] text-rose-500">{repo.crit || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-3">
                       <div className="h-2 w-20 bg-[#252a45] rounded-full overflow-hidden shadow-inner">
                         <div className={cn("h-full transition-all duration-1000", repo.maturity_score >= 80 ? "bg-emerald-500" : repo.maturity_score >= 60 ? "bg-amber-500" : "bg-rose-500")} 
                              style={{ width: `${repo.maturity_score}%` }}></div>
                       </div>
                       <span className="text-[11px] font-black text-slate-300 w-8">{repo.maturity_score}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", repo.crit > 0 ? "bg-rose-500 shadow-[0_0_8px_#ef444499]" : "bg-emerald-500 shadow-[0_0_8px_#22c55e99]")}></div>
                      <span className="text-[11px] font-bold">{repo.crit > 0 ? 'SÍ' : 'NO'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-[11px] text-muted-foreground font-medium">Hace 2 horas</TableCell>
                  <TableCell className="text-muted-foreground group-hover:text-[#e8365d] transition-colors pr-6 text-lg font-bold">›</TableCell>
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
          <div key={i} className="bg-[#141728] border border-[#252a45] rounded-xl p-4 text-center shadow-lg" style={{ borderTop: `4px solid ${k.border || k.color}` }}>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">{k.label}</div>
            <div className="text-3xl font-black" style={{ color: k.color }}>{k.val.toLocaleString()}</div>
            {k.sub && <div className="text-[9px] mt-2 text-rose-500 font-bold uppercase tracking-tighter">{k.sub}</div>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#141728] border-[#252a45] shadow-xl">
          <CardContent className="p-5 grid grid-cols-2 gap-6">
             <div className="space-y-1"><div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Nombre Repositorio</div><div className="text-[13px] font-mono font-black text-white bg-[#0d0f1a] p-2 rounded border border-[#252a45]">{path[currentLevel].name}</div></div>
             <div className="space-y-1"><div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Stack Tecnológico</div><div className="text-[13px] font-bold text-slate-200 py-2">Java / Spring Boot / React</div></div>
             <div className="space-y-1"><div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Último Escaneo</div><div className="text-[13px] font-bold text-emerald-400 py-2">Hace 2 horas (Completado)</div></div>
             <div className="space-y-1"><div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Branch Monitoreada</div><div className="text-[13px] font-mono font-bold text-slate-200 bg-[#1c2035] px-2 py-1 rounded inline-block">main</div></div>
          </CardContent>
        </Card>
        <Card className="bg-[#141728] border-[#252a45] shadow-xl">
           <CardContent className="p-5 h-full flex flex-col justify-center">
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-4">Distribución por Motor de Seguridad</div>
              <div className="flex flex-wrap gap-2.5">
                 {d.motores.filter(e => e.actual > 0).map(e => (
                   <div key={e.id} className="flex items-center gap-2 bg-[#0d0f1a] border border-[#252a45] pl-1 pr-3 py-1 rounded-full shadow-md">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ backgroundColor: ENGINE_COLORS[e.nombre] }}>{e.nombre.slice(0,2)}</div>
                      <span className="text-[11px] font-black text-slate-200">{e.nombre}:</span>
                      <span className="text-[12px] font-black" style={{ color: ENGINE_COLORS[e.nombre] }}>{e.actual}</span>
                   </div>
                 ))}
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="bg-[#141728] border-[#252a45] shadow-2xl overflow-hidden">
        <CardHeader className="pb-4 pt-6 flex flex-col gap-5 bg-[#1c2035]/30 border-b border-[#252a45]">
          <div className="flex justify-between items-center px-2">
             <CardTitle className="text-[16px] font-black uppercase tracking-[3px] text-slate-100">Listado Maestro de Hallazgos</CardTitle>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" className="h-9 px-4 text-[11px] font-black bg-[#e8365d15] border-[#e8365d40] text-[#e8365d] hover:bg-[#e8365d25]">🤖 Análisis Predictivo IA</Button>
               <Button variant="outline" size="sm" className="h-9 px-4 text-[11px] font-black bg-[#1c2035] border-[#252a45] hover:border-slate-500 transition-colors">Exportar Todo</Button>
             </div>
          </div>
          <div className="bg-[#0d0f1a]/80 backdrop-blur-sm border border-[#252a45] rounded-xl p-3 flex gap-3 items-center flex-wrap mx-2 shadow-inner">
             <div className="w-[180px]">
               <Select options={[{label: 'Todos los Motores', value: ''}]} placeholder="Filtrar por Motor" />
             </div>
             <div className="w-[180px]">
               <Select options={[{label: 'Todas las Severidades', value: ''}]} placeholder="Filtrar por Severidad" />
             </div>
             <div className="w-[180px]">
               <Select options={[{label: 'Todos los Estatus', value: ''}]} placeholder="Filtrar por Estatus" />
             </div>
             <div className="relative flex-1 min-w-[250px]">
               <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input className="h-9 pl-10 text-[12px] bg-[#141728] border-[#252a45] focus:border-[#e8365d] transition-colors" placeholder="Buscar por ID, nombre o archivo afectado..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#252a45] hover:bg-transparent bg-[#0d0f1a]/50 h-12">
                <TableHead className="w-12 text-center"></TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID Único</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Motor</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Severidad</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Detalle del Hallazgo</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">SLA Status</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Estatus</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(d.vulnerabilities||[]).filter(v => v.titulo.toLowerCase().includes(searchQuery.toLowerCase())).map(v => (
                <TableRow key={v.id} className="border-[#252a45] hover:bg-[#1c2035]/60 cursor-pointer transition-colors group h-14" onClick={() => setSelectedVuln(v)}>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center"><input type="checkbox" className="w-4 h-4 accent-[#e8365d] rounded border-[#252a45]" /></TableCell>
                  <TableCell className="font-mono text-[10px] font-black text-slate-500 uppercase tracking-tighter">{v.id.split('-').pop()?.slice(0,8)}</TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-widest shadow-sm" 
                          style={{ backgroundColor: `${ENGINE_COLORS[v.motor]}25`, color: ENGINE_COLORS[v.motor], border: `1px solid ${ENGINE_COLORS[v.motor]}44` }}>
                      {v.motor}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-widest shadow-sm" 
                          style={{ backgroundColor: `${SEVERITY_COLORS[v.severidad.toUpperCase()]||'#888'}25`, color: SEVERITY_COLORS[v.severidad.toUpperCase()]||'#888', border: `1px solid ${SEVERITY_COLORS[v.severidad.toUpperCase()]||'#888'}44` }}>
                      {v.severidad}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-slate-200 group-hover:text-[#e8365d] transition-colors">{v.titulo}</span>
                      <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[300px]">{v.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", v.sla && new Date(v.sla) < new Date() ? "bg-rose-500 shadow-[0_0_8px_#ef444499]" : "bg-emerald-500 shadow-[0_0_8px_#22c55e99]")}></div>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{v.sla ? (new Date(v.sla) < new Date() ? 'Vencido' : 'En Tiempo') : 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#1c2035] text-slate-400 border-[#252a45] text-[10px] font-bold py-0 h-6">{v.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground group-hover:text-[#e8365d] transition-colors pr-6 text-xl font-bold">›</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!d.vulnerabilities || d.vulnerabilities.length === 0) && (
            <div className="py-20 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No se encontraron hallazgos con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Drawer Detalle Hallazgo (Premium Side Panel) */}
      <Sheet open={!!selectedVuln} onOpenChange={(open) => !open && setSelectedVuln(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px] border-l border-[#252a45] bg-[#0d0f1a] p-0 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col">
          {selectedVuln && (
            <>
              <div className="p-6 bg-[#141728] border-b border-[#252a45] shadow-lg">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <Badge className="bg-rose-500/20 text-rose-500 border-none font-black text-[10px] tracking-widest">{selectedVuln.severidad.toUpperCase()}</Badge>
                      <Badge className="bg-blue-500/20 text-blue-500 border-none font-black text-[10px] tracking-widest">{selectedVuln.motor.toUpperCase()}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedVuln(null)} className="h-8 w-8 text-muted-foreground hover:text-white">✕</Button>
                 </div>
                 <SheetTitle className="text-[18px] font-black text-white leading-tight mb-2">{selectedVuln.titulo}</SheetTitle>
                 <div className="font-mono text-[11px] text-muted-foreground bg-[#0d0f1a] p-2 rounded border border-[#252a45] break-all">{selectedVuln.id}</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#141728] border border-[#252a45] rounded-xl p-4 shadow-inner">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px] mb-2">CVSS Score</div>
                    <div className="text-3xl font-black text-rose-500">9.8 <span className="text-sm text-rose-500/60 font-black">CRIT</span></div>
                  </div>
                  <div className="bg-[#141728] border border-[#252a45] rounded-xl p-4 shadow-inner">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px] mb-2">SLA Status</div>
                    <div className="text-3xl font-black text-rose-500">-3 <span className="text-sm text-rose-500/60 font-black">DÍAS</span></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[11px] font-black text-muted-foreground uppercase tracking-[3px] flex items-center gap-2">
                    <div className="h-0.5 flex-1 bg-[#252a45]"></div>
                    Evidencia de Código
                    <div className="h-0.5 flex-1 bg-[#252a45]"></div>
                  </div>
                  <div className="bg-[#0d0f1a] border border-[#252a45] rounded-xl p-4 font-mono text-[12px] text-[#a78bfa] leading-relaxed shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-1 h-full bg-[#7c3aed]"></div>
                     <pre className="whitespace-pre-wrap">{(selectedVuln as any).code_evidence || "// No se encontró evidencia de código fuente para este hallazgo."}</pre>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[11px] font-black text-muted-foreground uppercase tracking-[3px] flex items-center gap-2">
                    <div className="h-0.5 flex-1 bg-[#252a45]"></div>
                    Recomendación de Remediación
                    <div className="h-0.5 flex-1 bg-[#252a45]"></div>
                  </div>
                  <div className="border-l-4 border-[#e8365d] bg-[#e8365d08] p-5 rounded-r-xl shadow-lg">
                    <p className="text-[13px] text-[#fca5a5] leading-relaxed font-medium italic">
                      "Utilizar consultas parametrizadas o validación estricta de tipos de datos en la capa de persistencia para mitigar este riesgo de inyección."
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#252a45]">
                   <div className="text-[11px] font-black text-muted-foreground uppercase tracking-[3px]">Acciones Técnicas</div>
                   <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-10 text-[12px] font-black bg-[#1c2035] border-[#252a45] hover:bg-[#252a45] transition-all">Gestionar Estatus</Button>
                      <Button variant="outline" className="h-10 text-[12px] font-black bg-[#e8365d10] border-[#e8365d40] text-[#e8365d] hover:bg-[#e8365d20] shadow-[0_0_15px_rgba(232,54,93,0.1)]">🤖 Analizar con IA</Button>
                   </div>
                </div>
              </div>

              <div className="p-6 bg-[#141728] border-t border-[#252a45]">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px] mb-3">Comentarios y Bitácora</div>
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#e8365d20] border border-[#e8365d40] flex items-center justify-center text-[#e8365d] font-black text-[12px]">PS</div>
                  <div className="flex-1 relative">
                    <Input className="h-10 bg-[#0d0f1a] border-[#252a45] pr-10 text-[12px]" placeholder="Añadir comentario técnico..." />
                    <Button variant="ghost" className="absolute right-1 top-1 h-8 w-8 text-[#e8365d]">✈</Button>
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

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-[#e2e8f0] font-sans pb-10">
      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-[#0d0f1a]/95 backdrop-blur-md border-b border-[#252a45] px-6 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 text-[13px]">
          {path.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={cn(
                "cursor-pointer transition-all hover:text-white px-2 py-0.5 rounded",
                i===currentLevel ? "text-white font-black bg-[#e8365d20]" : "text-[#6b7280] font-bold"
              )} onClick={() => handleLevelClick(i)}>
                {p.name}
              </span>
              {i < path.length - 1 && <span className="text-[#252a45] text-[18px] font-light">›</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
           <div className="flex gap-1.5 mr-4 bg-[#141728] p-1.5 rounded-full border border-[#252a45]">
             {Array.from({length:7}).map((_,i) => (
               <div key={i} className={cn(
                 "w-1.5 h-1.5 rounded-full transition-all duration-500", 
                 i===currentLevel ? "bg-[#e8365d] w-4" : "bg-[#252a45]"
               )}></div>
             ))}
           </div>
           <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-4 text-[11px] font-black uppercase tracking-widest bg-[#1c2035] border-[#252a45] hover:border-[#e8365d] hover:text-[#e8365d] transition-all"
                onClick={() => setIsFilterDrawerOpen(true)}
              >
                ▼ Filtros Globales
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-[#1c2035] border-[#252a45] hover:bg-[#252a45]">⋯</Button>
           </div>
           <Badge variant="outline" className="h-8 px-4 rounded-full bg-[#e8365d15] border-[#e8365d30] text-[#e8365d] text-[11px] font-black tracking-widest uppercase">
             Nivel {currentLevel+1} / 7 — {cLevel.label}
           </Badge>
        </div>
      </div>

      {/* Chips de Filtros Activos */}
      {(selectedEngines.length > 0 || selectedSeverities.length > 0 || selectedSla) && (
        <div className="px-6 py-2 flex flex-wrap gap-2 border-b border-[#252a45] bg-[#141728]/30">
          {selectedEngines.map(e => (
            <button key={e} className="bg-[#7c3aed20] text-[#a78bfa] border-[#7c3aed40] text-[9px] font-bold uppercase px-2 py-1 rounded" onClick={() => setSelectedEngines(prev => prev.filter(x => x !== e))}>
              Motor: {e} <span className="ml-1 cursor-pointer opacity-60 hover:opacity-100">✕</span>
            </button>
          ))}
          {selectedSeverities.map(s => (
            <button key={s} className="bg-[#ef444420] text-[#fca5a5] border-[#ef444440] text-[9px] font-bold uppercase px-2 py-1 rounded" onClick={() => setSelectedSeverities(prev => prev.filter(x => x !== s))}>
              Sev: {s} <span className="ml-1 cursor-pointer opacity-60 hover:opacity-100">✕</span>
            </button>
          ))}
          {selectedSla && (
            <button className="bg-[#f59e0b20] text-[#fcd34d] border-[#f59e0b40] text-[9px] font-bold uppercase px-2 py-1 rounded" onClick={() => setSelectedSla('')}>
              SLA: {selectedSla} <span className="ml-1 cursor-pointer opacity-60 hover:opacity-100">✕</span>
            </button>
          )}
        </div>
      )}

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
                  <button 
                    key={m} 
                    className={`cursor-pointer text-[10px] py-1 px-2 transition-all ${
                      selectedEngines.includes(m) 
                        ? "bg-[#7c3aed33] border-[#7c3aed] text-[#a78bfa] border" 
                        : "bg-[#141728] border-[#252a45] border"
                    }`}
                    onClick={() => setSelectedEngines(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Severidades */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Severidades</label>
              <div className="flex flex-wrap gap-2">
                {['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map(s => (
                  <button 
                    key={s} 
                    className={`cursor-pointer text-[10px] py-1 px-2 transition-all ${
                      selectedSeverities.includes(s) 
                        ? "bg-[#ef444433] border-[#ef4444] text-[#fca5a5] border" 
                        : "bg-[#141728] border-[#252a45] border"
                    }`}
                    onClick={() => setSelectedSeverities(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  >
                    {s}
                  </button>
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
