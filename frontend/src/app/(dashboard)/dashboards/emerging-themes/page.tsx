"use client";

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
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-wide">8. Temas Emergentes y Auditorías</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitoreo de auditorías activas y temas transversales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección Temas Emergentes */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b border-white/[0.08] pb-2 flex items-center gap-2 text-orange-400">
            <AlertCircle className="w-5 h-5" /> Temas Emergentes
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-hover p-4 rounded-xl border-b-4 border-orange-500">
              <p className="text-xs text-muted-foreground">Abiertos</p>
              <p className="text-2xl font-bold">{data?.temas.kpis.total_abiertos ?? '...'}</p>
            </div>
            <div className="glass-hover p-4 rounded-xl border-b-4 border-amber-500">
              <p className="text-xs text-muted-foreground">Sin mov. (7d)</p>
              <p className="text-2xl font-bold">{data?.temas.kpis.sin_movimiento_7d ?? '...'}</p>
            </div>
            <div className="glass-hover p-4 rounded-xl border-b-4 border-rose-500">
              <p className="text-xs text-muted-foreground">Próx. vencer</p>
              <p className="text-2xl font-bold">{data?.temas.kpis.proximos_vencer ?? '...'}</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-3">Últimos Temas Registrados</h3>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase border-b border-white/[0.08]">
                <tr>
                  <th className="px-2 py-2">Título</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Días</th>
                </tr>
              </thead>
              <tbody>
                {data?.temas.tabla.slice(0, 5).map(tema => (
                  <tr key={tema.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-2 py-2 truncate max-w-[150px]">{tema.titulo}</td>
                    <td className="px-2 py-2">{tema.estado}</td>
                    <td className="px-2 py-2">{tema.dias_abierto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.temas.tabla.length === 0 && <p className="text-xs text-muted-foreground mt-4 text-center">No hay temas activos</p>}
          </div>
        </div>

        {/* Sección Auditorías */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b border-white/[0.08] pb-2 flex items-center gap-2 text-cyan-400">
            <FileSearch className="w-5 h-5" /> Auditorías Activas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-hover p-4 rounded-xl border-b-4 border-cyan-500">
              <p className="text-xs text-muted-foreground">Activas</p>
              <p className="text-2xl font-bold">{data?.auditorias.kpis.activas ?? '...'}</p>
            </div>
            <div className="glass-hover p-4 rounded-xl border-b-4 border-emerald-500">
              <p className="text-xs text-muted-foreground">Cerradas (Año)</p>
              <p className="text-2xl font-bold">{data?.auditorias.kpis.cerradas_ano ?? '...'}</p>
            </div>
            <div className="glass-hover p-4 rounded-xl border-b-4 border-rose-500">
              <p className="text-xs text-muted-foreground">Hallazgos Pend.</p>
              <p className="text-2xl font-bold">{data?.auditorias.kpis.hallazgos_pendientes ?? '...'}</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-3">Auditorías Recientes</h3>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase border-b border-white/[0.08]">
                <tr>
                  <th className="px-2 py-2">Nombre</th>
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data?.auditorias.tabla.slice(0, 5).map(aud => (
                  <tr key={aud.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-2 py-2 truncate max-w-[150px]">{aud.nombre}</td>
                    <td className="px-2 py-2">{aud.tipo}</td>
                    <td className="px-2 py-2">{aud.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.auditorias.tabla.length === 0 && <p className="text-xs text-muted-foreground mt-4 text-center">No hay auditorías registradas</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
