'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, ClipboardList, AlertTriangle, Target, ChevronRight, Download, ChevronDown, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PremiumDashboardData {
  kpis: { title: string; value: string; sub: string; border: string; valColor: string; subColor: string }[];
  salud_equipo_sidebar: { porcentaje: number; estado_texto: string; color: string; historial_sparkline: number[] };
  analistas: { id: string; nombre: string; iniciales: string; color: string; asig: number; comp: number; pend: number; avance: number; activas: number; vencer: number; vencer_txt: string; riesgo: string }[];
  detalle: Record<string, {
    rol: string; email: string;
    stats: { progs: number; temas: number; liberaciones: number; comp: number; pend: number; avance: string };
    historico: { mes: string; pct: number }[];
    actividad_reciente: { accion: string; fecha: string; modulo: string }[];
    tareas: { id: string; titulo: string; programa: string; estado: string; tags: string[]; color_dot: string }[];
  }>;
}

const ProgressPill = ({ pct }: { pct: number }) => {
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  const tone = pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className={cn('text-sm font-semibold', tone)}>{pct}%</span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function TeamDashboardPremium() {
  const [selectedAnalystId, setSelectedAnalystId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'actividad'>('resumen');
  const [taskFilter, setTaskFilter] = useState<'Pendiente' | 'Completada' | 'Todas'>('Pendiente');

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-team-premium'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: PremiumDashboardData }>('/dashboard/team/premium');
      return response.data.data;
    },
  });

  const selectedAnalyst = selectedAnalystId && dashboardData ? dashboardData.analistas.find(a => a.id === selectedAnalystId) : null;
  const analystDetail = selectedAnalystId && dashboardData ? dashboardData.detalle[selectedAnalystId] : null;

  // Prepare donut chart data from analistas
  const donutData = dashboardData?.analistas ? [
    { name: 'Activos', value: dashboardData.analistas.filter(a => a.riesgo === 'activo' || a.vencer === 0).length, color: '#22c55e' },
    { name: 'En Riesgo', value: dashboardData.analistas.filter(a => a.riesgo === 'en_riesgo' || (a.vencer > 0 && a.vencer <= 3)).length, color: '#eab308' },
    { name: 'Vencidas', value: dashboardData.analistas.filter(a => a.riesgo === 'vencidas' || a.vencer > 3).length, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error cargando el dashboard.</div>;
  }

  const handleExport = () => {
    if (!dashboardData) return;
    const headers = ['Analista', 'Programas Asignados', 'Tareas Completadas', 'Tareas Pendientes', 'Avance Individual (%)', 'Activas Hoy', 'Próximas a Vencer'];
    const rows = dashboardData.analistas.map(a => 
      `"${a.nombre}",${a.asig},${a.comp},${a.pend},${a.avance},${a.activas},${a.vencer}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_equipo_ciberseguridad.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ICONS = [Users, ClipboardList, AlertTriangle, Target];

  return (
    <div data-testid="d2-page" className="min-h-screen bg-background text-foreground p-6 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 data-testid="d2-title" className="text-3xl font-bold tracking-wide">Dashboard de Equipo</h1>
          <p className="text-muted-foreground text-sm mt-1">Jefatura de Ciberseguridad Aplicativa</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 rounded-md text-sm transition-colors text-foreground shadow-sm outline-none">
                📅 Reporte Actual <ChevronDown className="w-4 h-4 ml-2" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border">
              <DropdownMenuItem className="cursor-pointer">Reporte Actual</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Mes Pasado</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Q1 2026</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Año 2025</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button data-testid="d2-export" onClick={handleExport} className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 rounded-md text-sm transition-colors text-foreground shadow-sm outline-none">
            Exportar <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIS + DONUT ROW */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* KPI Cards (4 columns) */}
        <div className="col-span-4 grid grid-cols-4 gap-4">
          {dashboardData.kpis.map((kpi, i) => {
            const IconComponent = ICONS[i] || Users;
            return (
              <div key={i} className={`bg-card border border-border rounded-xl p-5 border-b-4 ${kpi.border} shadow-sm`}>
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-6 h-6 ${kpi.border.replace('border-b-', 'text-')}`} />
                  <h3 className="text-muted-foreground text-sm font-medium w-3/4">{kpi.title}</h3>
                </div>
                <div className="mt-4">
                  <p className={`text-3xl font-bold ${kpi.valColor}`}>{kpi.value}</p>
                  <p className={`text-xs font-medium mt-1 ${kpi.subColor}`}>{kpi.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Donut Chart (1 column) */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Distribución<br/>de Analistas</h3>
          <div className="flex-1 flex items-center justify-center">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">Sin datos</p>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {donutData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`bg-card border border-border rounded-xl overflow-hidden shadow-md`}>
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Rendimiento y Carga de Trabajo por Analista</h2>
        </div>
        <table data-testid="d2-analysts-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border bg-muted/20">
              <th className="py-4 px-5 font-medium">Analista</th>
              <th className="py-4 px-5 font-medium text-center">Programas<br/>Asignados</th>
              <th className="py-4 px-5 font-medium text-center">Tareas Completadas / Abiertas</th>
              <th className="py-4 px-5 font-medium">Avance Individual<br/><span className="text-muted-foreground/70">(% Resolución)</span></th>
              <th className="py-4 px-5 font-medium text-center">Activas Hoy</th>
              <th className="py-4 px-5 font-medium">Tareas Próximas<br/>a Vencer (SLA)</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {dashboardData.analistas.map((row) => (
              <tr 
                data-testid={`d2-analyst-row-${row.id}`}
                key={row.id} 
                onClick={() => setSelectedAnalystId(row.id)}
                className="hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <td className="py-4 px-5 flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full ${row.color} flex items-center justify-center text-xs font-bold shadow-sm`}>
                      {row.iniciales}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
                  </div>
                  <span className="font-medium text-card-foreground">{row.nombre}</span>
                </td>
                <td className="py-4 px-5 text-center text-muted-foreground">{row.asig}</td>
                <td className="py-4 px-5 text-center text-muted-foreground">{row.comp} / {row.pend}</td>
                <td className="py-4 px-5"><ProgressPill pct={row.avance} /></td>
                <td className="py-4 px-5 text-center text-muted-foreground">{row.activas}</td>
                <td className="py-4 px-5">
                  <div className="flex flex-col">
                    <span className={`font-bold ${row.riesgo === 'alto' ? 'text-red-500' : 'text-yellow-500'}`}>{row.vencer}</span>
                    <span className="text-xs text-muted-foreground">{row.vencer_txt}</span>
                  </div>
                </td>
                <td className="py-4 px-5 text-right">
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-border text-xs text-muted-foreground bg-muted/10">
          Mostrando {dashboardData.analistas.length} analistas activos
        </div>
      </div>

      {/* DRAWER COMPONENT (SHADCN SHEET) */}
      <Sheet open={!!selectedAnalystId} onOpenChange={(open) => !open && setSelectedAnalystId(null)}>
        <SheetContent className="w-[450px] sm:max-w-md overflow-y-auto bg-card border-l border-border p-0 shadow-2xl">
          {selectedAnalyst && analystDetail && (
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="p-6 border-b border-border bg-muted/10">
                <SheetHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full ${selectedAnalyst.color} flex items-center justify-center text-xl font-bold shadow-md relative`}>
                      {selectedAnalyst.iniciales}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                    <div>
                      <SheetTitle className="text-xl font-bold text-card-foreground text-left">{selectedAnalyst.nombre}</SheetTitle>
                      <SheetDescription className="text-left text-xs mt-1">
                        {analystDetail.rol} <br /> {analystDetail.email}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-6 mt-2">
                <button 
                  onClick={() => setActiveTab('resumen')}
                  className={`py-3 text-sm font-medium mr-6 transition-colors border-b-2 ${activeTab === 'resumen' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
                  Resumen
                </button>
                <button 
                  onClick={() => setActiveTab('actividad')}
                  className={`py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'actividad' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
                  Actividad Reciente
                </button>
              </div>

              <div className="p-6 flex-1">
                {activeTab === 'resumen' ? (
                  <>
                    <h4 className="text-sm font-medium text-card-foreground mb-4">Historial de Avance <span className="text-muted-foreground text-xs font-normal">(Últimos 6 meses)</span></h4>
                    <div className="h-40 w-full mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analystDetail.historico} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#eab308" />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="mes" tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.5 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.5 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                          <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                          <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={30}>
                            {analystDetail.historico.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="url(#barColor)" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-8 border border-border rounded-lg p-3 bg-muted/10">
                      <div className="text-center border-r border-border">
                        <p className="text-[10px] text-muted-foreground leading-tight mb-1">Programas<br/>Asignados</p>
                        <p className="text-xl font-bold text-card-foreground">{analystDetail.stats.progs}</p>
                      </div>
                      <div className="text-center border-r border-border">
                        <p className="text-[10px] text-muted-foreground leading-tight mb-1">Activ. Completadas<br/>(Mes)</p>
                        <p className="text-xl font-bold text-card-foreground">{analystDetail.stats.comp}</p>
                      </div>
                      <div className="text-center border-r border-border">
                        <p className="text-[10px] text-muted-foreground leading-tight mb-1">Activ. Pendientes<br/>(Mes)</p>
                        <p className="text-xl font-bold text-red-500">{analystDetail.stats.pend}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground leading-tight mb-1">Avance<br/>(vs Meta)</p>
                        <p className="text-xl font-bold text-green-500">{analystDetail.stats.avance}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 mt-6">
                      <h4 className="text-sm font-medium text-card-foreground">
                        Detalle de Actividades 
                      </h4>
                      <div className="flex bg-muted/30 p-1 rounded-lg">
                        <button onClick={() => setTaskFilter('Pendiente')} className={`text-[10px] px-3 py-1 rounded-md transition-colors ${taskFilter === 'Pendiente' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Pendientes</button>
                        <button onClick={() => setTaskFilter('Completada')} className={`text-[10px] px-3 py-1 rounded-md transition-colors ${taskFilter === 'Completada' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Finalizadas</button>
                        <button onClick={() => setTaskFilter('Todas')} className={`text-[10px] px-3 py-1 rounded-md transition-colors ${taskFilter === 'Todas' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Todas</button>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      {analystDetail.tareas.filter(t => taskFilter === 'Todas' || t.estado === taskFilter).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/10 rounded-lg">No hay vulnerabilidades con este estado.</p>
                      ) : (
                        analystDetail.tareas.filter(t => taskFilter === 'Todas' || t.estado === taskFilter).map((tarea, idx) => (
                          <Link href={`/vulnerabilidads/${tarea.id}`} key={idx} className="flex justify-between items-center bg-muted/20 hover:bg-muted/30 transition-colors p-3 rounded-lg border border-border group cursor-pointer">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${tarea.color_dot === 'red' ? 'bg-red-500' : tarea.color_dot === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="text-sm text-card-foreground font-medium truncate">{tarea.titulo}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">Programa: {tarea.programa}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 items-end shrink-0">
                              <span className={`text-[10px] font-medium ${tarea.tags.includes('Vencida') ? 'text-red-500' : tarea.tags.includes('En riesgo') ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                {tarea.tags.includes('Vencida') ? 'Vencida' : tarea.tags.includes('En riesgo') ? 'Vence pronto' : 'Al día'}
                              </span>
                              {tarea.tags.map((tag, tIdx) => (
                                <span key={tIdx} className={`text-[10px] px-2 py-0.5 rounded border ${
                                  tag === 'Vencida' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                  tag === 'En riesgo' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                  'bg-secondary text-muted-foreground border-border'
                                }`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    <Link href="/dashboards/concentrado" className="w-full py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      Ver todas las actividades <ChevronRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-card-foreground mb-4">Registro de Operaciones Recientes</h4>
                    {analystDetail.actividad_reciente.length > 0 ? (
                      <div className="relative border-l border-border ml-3 space-y-6">
                        {analystDetail.actividad_reciente.map((log, i) => (
                          <div key={i} className="pl-6 relative">
                            <div className="absolute w-3 h-3 bg-card border-2 border-primary rounded-full -left-[6.5px] top-1"></div>
                            <p className="text-xs text-muted-foreground mb-1">{new Date(log.fecha).toLocaleString()}</p>
                            <p className="text-sm text-card-foreground font-medium">{log.accion}</p>
                            <div className="inline-flex items-center gap-1 mt-1 bg-secondary px-2 py-0.5 rounded text-[10px] text-muted-foreground">
                              <Activity className="w-3 h-3" /> {log.modulo}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay actividad reciente registrada.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
