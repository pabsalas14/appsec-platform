"use client";

import Link from 'next/link';
import { AlertCircle, FileSearch } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface TrendNode {
  month: string;
  value: number;
}

interface ThemeRow {
  id: string;
  titulo: string;
  estado: string;
  impacto: string;
  dias_abierto: number;
}

interface AuditRow {
  id: string;
  nombre: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

interface TemasAuditoriasResponse {
  temas: {
    kpis: { total_abiertos: number; sin_movimiento_7d: number; proximos_vencer: number };
    tabla: ThemeRow[];
  };
  auditorias: {
    kpis: { activas: number; cerradas_ano: number; hallazgos_pendientes: number };
    tendencia_3m: TrendNode[];
    tabla: AuditRow[];
  };
}

export default function EmergingThemesDashboardPage() {
  const { data, error } = useQuery({
    queryKey: ['dashboard-temas-auditorias'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: TemasAuditoriasResponse }>('/dashboard/temas-auditorias');
      return response.data.data;
    },
  });

  if (error) {
    return <div className="p-6 text-red-500">Error cargando el dashboard de Temas y Auditorías</div>;
  }

  return (
    <div className="min-h-screen bg-dashboard-canvas text-dashboard-on-strong p-6 font-sans">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">Temas emergentes y auditorías</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoreo de auditorías activas y temas transversales registrados.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/temas_emergentes/registros"
            className="inline-flex items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-elevated px-3 py-1.5 text-sm font-medium text-foreground hover:bg-dashboard-border/80"
          >
            Registros temas
          </Link>
          <Link
            href="/auditorias/registros"
            className="inline-flex items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-elevated px-3 py-1.5 text-sm font-medium text-foreground hover:bg-dashboard-border/80"
          >
            Registros auditorías
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección Temas Emergentes */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-orange-400 border-b border-dashboard-border pb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Temas Emergentes
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-hover p-4 rounded-xl border-b-4 border-orange-500 bg-dashboard-surface/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Abiertos</p>
              <p className="text-2xl font-bold text-orange-400">{data?.temas.kpis.total_abiertos ?? '...'}</p>
            </div>
            <div className="glass-hover p-4 rounded-xl border-b-4 border-amber-500 bg-dashboard-surface/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sin mov. (7d)</p>
              <p className="text-2xl font-bold text-amber-400">{data?.temas.kpis.sin_movimiento_7d ?? '...'}</p>
            </div>
            <div className="glass-hover p-4 rounded-xl border-b-4 border-rose-500 bg-dashboard-surface/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Próx. vencer</p>
              <p className="text-2xl font-bold text-rose-400">{data?.temas.kpis.proximos_vencer ?? '...'}</p>
            </div>
          </div>
          <div className="bg-dashboard-surface border border-dashboard-border rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-dashboard-border bg-dashboard-elevated/30">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Últimos Temas Registrados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-dashboard-canvas/50">
                  <tr>
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Días</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashboard-border">
                  {data?.temas.tabla.slice(0, 8).map(tema => (
                    <tr key={tema.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{tema.titulo}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-dashboard-elevated rounded text-[10px] uppercase font-bold text-orange-400 border border-orange-400/20">{tema.estado}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{tema.dias_abierto}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.temas.tabla.length === 0 && <p className="text-xs text-muted-foreground p-8 text-center">No hay temas activos</p>}
          </div>
        </div>

        {/* Sección Auditorías */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 border-b border-dashboard-border pb-2 flex items-center gap-2">
            <FileSearch className="w-4 h-4" /> Auditorías Activas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-hover p-4 rounded-xl border-b-4 border-cyan-500 bg-dashboard-surface/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activas</p>
              <p className="text-2xl font-bold text-cyan-400">{data?.auditorias.kpis.activas ?? '...'}</p>
            </div>
            <div className="glass-hover p-4 rounded-xl border-b-4 border-emerald-500 bg-dashboard-surface/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cerradas (Año)</p>
              <p className="text-2xl font-bold text-emerald-400">{data?.auditorias.kpis.cerradas_ano ?? '...'}</p>
            </div>
            <div className="glass-hover p-4 rounded-xl border-b-4 border-rose-500 bg-dashboard-surface/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hallazgos Pend.</p>
              <p className="text-2xl font-bold text-rose-400">{data?.auditorias.kpis.hallazgos_pendientes ?? '...'}</p>
            </div>
          </div>
          <div className="bg-dashboard-surface border border-dashboard-border rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-dashboard-border bg-dashboard-elevated/30">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Auditorías Recientes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-dashboard-canvas/50">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashboard-border">
                  {data?.auditorias.tabla.slice(0, 8).map(aud => (
                    <tr key={aud.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{aud.nombre}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">{aud.tipo}</td>
                      <td className="px-4 py-3 text-center">
                         <span className="px-2 py-0.5 bg-dashboard-elevated rounded text-[10px] uppercase font-bold text-cyan-400 border border-cyan-400/20">{aud.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.auditorias.tabla.length === 0 && <p className="text-xs text-muted-foreground p-8 text-center">No hay auditorías registradas</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
