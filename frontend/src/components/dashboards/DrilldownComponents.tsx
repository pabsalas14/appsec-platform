'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChevronRight, Shield, ShieldCheck, Cpu, Database, Smartphone, Lock, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type EngineStat = { count: number; trend: string };

const ENGINE_ICONS: Record<string, LucideIcon> = {
  SAST: Lock,
  DAST: Activity,
  SCA: Database,
  CDS: ShieldCheck,
  MDA: Smartphone,
  MAST: Cpu,
};

const ENGINE_COLORS: Record<string, string> = {
  SAST: '#3b82f6',
  SCA: '#10b981',
  CDS: '#8b5cf6',
  DAST: '#f59e0b',
  MDA: '#ec4899',
  MAST: '#06b6d4',
};

// 1. Barra de Motores Superior
export function EngineStatsBar({ data }: { data: Record<string, EngineStat> | null | undefined }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Object.entries(data).map(([engine, stats]) => {
        const Icon = ENGINE_ICONS[engine] || Shield;
        return (
          <div key={engine} className="bg-card/40 border border-border/50 rounded-2xl p-4 flex flex-col items-center group hover:bg-card hover:border-primary/50 transition-all cursor-default">
            <div className="p-3 rounded-full bg-secondary group-hover:scale-110 transition-transform" style={{ color: ENGINE_COLORS[engine] }}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-semibold tracking-wider uppercase">{engine}</p>
            <p className="text-2xl font-bold mt-1">{(stats.count || 0).toLocaleString()}</p>
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2">
              {stats.trend}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type TrendPoint = { month: string; activas: number; solventadas: number; nuevas: number };

// 2. Gráfica de Tendencia Anual
export function AnnualTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card className="bg-card/30 border-border/50 overflow-hidden backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          TENDENCIA GLOBAL DE VULNERABILIDADES ACTIVAS (Anual)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full p-0 pr-4 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorActivas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            <Area type="monotone" dataKey="activas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActivas)" strokeWidth={3} />
            <Line type="monotone" dataKey="solventadas" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="nuevas" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

type PipelineSummary = {
  total_scans: number;
  approved: number;
  rejected: number;
  approval_rate: number;
};

// 3. Indicadores de Pipeline
export function PipelineIndicators({ data }: { data: PipelineSummary }) {
  if (!data) return null;
  return (
    <Card className="bg-card/30 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase tracking-widest">Indicadores de Pipeline Global</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex flex-col items-center justify-center p-4 border-r border-border/50 last:border-0">
          <p className="text-xs text-muted-foreground mb-2">Total escaneos</p>
          <p className="text-4xl font-black">{data.total_scans.toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border-r border-border/50 last:border-0">
          <p className="text-xs text-muted-foreground mb-2">Escaneos aprobados</p>
          <p className="text-3xl font-bold text-emerald-500">{data.approved.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-500/70 font-bold mt-1">({data.approval_rate}%)</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border-r border-border/50 last:border-0">
          <p className="text-xs text-muted-foreground mb-2">Escaneos rechazados</p>
          <p className="text-3xl font-bold text-red-500">{data.rejected.toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
           <p className="text-xs text-muted-foreground mb-2">% de Aprobación</p>
           <div className="relative w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{value: data.approval_rate}, {value: 100-data.approval_rate}]} innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value" stroke="none">
                    <Cell fill="#10b981" />
                    <Cell fill="#ffffff10" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{data.approval_rate}%</span>
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

type DiscoveryChild = {
  name: string;
  total: number;
  engines: Record<string, number>;
};

// 4. Tarjeta de Descubrimiento Avanzada (Direcciones/Subdirecciones)
export function AdvancedDiscoveryCard({
  child,
  onClick,
}: {
  child: DiscoveryChild;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-card/40 hover:bg-card border border-border/50 rounded-2xl p-6 text-left transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 border-b-4 hover:border-b-primary"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-black text-lg tracking-tight uppercase group-hover:text-primary transition-colors">{child.name}</h4>
          <p className="text-2xl font-bold mt-1">{child.total.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">vulnerabilidades activas</span></p>
        </div>
        <div className="p-2 bg-secondary rounded-xl group-hover:bg-primary/10 transition-colors">
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
        </div>
      </div>

      {/* Mini-engine bars */}
      <div className="grid grid-cols-6 gap-2 mt-4">
        {Object.entries(child.engines || {}).map(([eng, count]) => (
          <div key={eng} className="space-y-1">
            <p className="text-[8px] font-bold text-muted-foreground uppercase">{eng}</p>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((count / (child.total || 1)) * 100 * 2, 100)}%`, backgroundColor: ENGINE_COLORS[eng] }} />
            </div>
            <p className="text-[9px] font-medium">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border/20">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Escaneos Aprobados</p>
          <div className="h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 w-[85%]" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Escaneos Rechazados</p>
          <div className="h-1.5 bg-red-500/10 rounded-full overflow-hidden">
             <div className="h-full bg-red-500 w-[15%]" />
          </div>
        </div>
      </div>
    </button>
  );
}

// 5. Análisis IA (Componente de resumen)
export function IAAnalysisCard({ levelName }: { levelName: string }) {
  return (
    <Card className="bg-primary/5 border-primary/20 backdrop-blur-md overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Cpu className="w-20 h-20 text-primary" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black flex items-center gap-2 text-primary tracking-widest">
          <Smartphone className="w-4 h-4 animate-pulse" />
          ANÁLISIS CENTINELA IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground/90">
          En <span className="font-bold text-primary">{levelName}</span> se observa una reducción del <span className="font-bold text-emerald-500">12%</span> en vulnerabilidades activas respecto al mes anterior, impulsada principalmente por remediaciones en <span className="font-medium italic">SAST</span> y <span className="font-medium italic">DAST</span>.
        </p>
        <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
          <p className="text-[10px] font-black text-primary uppercase mb-1">Recomendación Estratégica</p>
          <p className="text-xs italic text-muted-foreground">
            Priorizar la actualización de bibliotecas en el motor SCA, ya que representan el 45% del riesgo remanente en este nivel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
