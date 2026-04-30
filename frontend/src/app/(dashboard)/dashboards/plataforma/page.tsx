'use client';

import { useQuery } from '@tanstack/react-query';
import { Server, Bug, GitCommit, Calendar, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { apiClient } from '@/lib/api';

interface PlatformData {
  kpis: { version_actual: string; ultima_actualizacion: string; releases_en_desarrollo: number; bugs_reportados: number; };
  timeline: { version: string; fecha: string; titulo: string }[];
  changelog: { version: string; fecha: string; tipo: string; descripcion: string; estatus: string }[];
}

export default function PlatformReleaseDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-platform-release'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PlatformData }>('/dashboard/platform-release');
      return res.data.data;
    },
  });

  if (error) {
    return <div className="p-6 text-red-500">Error cargando el dashboard de plataforma.</div>;
  }

  const kpis = data?.kpis;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-wide">10. Release Plataforma</h1>
        <p className="text-muted-foreground text-sm mt-1">Versión desplegada, changelog y roadmap interno de AppSec Platform.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="glass-hover border-b-4 border-cyan-500 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <Server className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Versión Actual</span>
              </div>
              <div className="text-3xl font-bold">{kpis?.version_actual ?? '—'}</div>
            </div>
            <div className="glass-hover border-b-4 border-emerald-500 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Última Act.</span>
              </div>
              <div className="text-lg font-bold truncate">{kpis?.ultima_actualizacion ? new Date(kpis.ultima_actualizacion).toLocaleDateString() : '—'}</div>
            </div>
            <div className="glass-hover border-b-4 border-amber-500 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">En Desarrollo</span>
              </div>
              <div className="text-3xl font-bold">{kpis?.releases_en_desarrollo ?? 0}</div>
            </div>
            <div className="glass-hover border-b-4 border-rose-500 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-rose-400">
                <Bug className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bugs Resolv.</span>
              </div>
              <div className="text-3xl font-bold">{kpis?.bugs_reportados ?? 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="glass-card rounded-xl p-5 col-span-1 border border-white/[0.08]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
                <GitCommit className="w-5 h-5 text-primary" /> Timeline de Liberaciones
              </h3>
              <div className="space-y-4 pl-2 border-l-2 border-white/[0.1]">
                {data?.timeline.map((t, idx) => (
                  <div key={idx} className="relative pl-4">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                    <p className="text-sm font-bold text-slate-100">{t.version}</p>
                    <p className="text-xs text-primary mb-1">{t.fecha}</p>
                    <p className="text-xs text-muted-foreground">{t.titulo}</p>
                  </div>
                ))}
              </div>
              {data?.timeline.length === 0 && <p className="text-xs text-muted-foreground">Sin historial</p>}
            </div>

            {/* Changelog Table */}
            <div className="glass-card rounded-xl p-5 col-span-1 lg:col-span-2 border border-white/[0.08] overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 text-slate-200">Changelog Histórico</h3>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b border-white/[0.08]">
                  <tr>
                    <th className="px-3 py-3">Versión</th>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Descripción</th>
                    <th className="px-3 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.changelog.map((entry, idx) => (
                    <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-3 py-3 font-semibold text-slate-200">{entry.version}</td>
                      <td className="px-3 py-3 text-muted-foreground">{entry.fecha !== '—' ? new Date(entry.fecha).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${entry.tipo === 'bugfix' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {entry.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-3 truncate max-w-[200px] text-muted-foreground" title={entry.descripcion}>{entry.descripcion}</td>
                      <td className="px-3 py-3 capitalize">{entry.estatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
