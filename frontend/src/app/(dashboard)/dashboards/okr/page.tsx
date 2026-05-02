'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface SimulatorNode {
  name: string;
  score: number;
}

interface OkrData {
  kpis: { score_global: number; en_riesgo: number; celulas_rezago: number };
  heatmap: { name: string; score: number; commitments: number }[];
  simulator: { base_score: number; nodes: SimulatorNode[] };
}

export default function OKRDashboard() {
  const [activeLevel] = useState(1); // Drill-down level 1-4

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-okr'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: OkrData }>('/dashboard/okr');
      return response.data.data;
    },
  });

  if (error) {
    return <div className="p-6 text-red-500">Error cargando el dashboard de OKRs</div>;
  }

  const kpis = [
    { title: 'Score Global de Jefatura', value: data ? `${data.kpis.score_global}%` : '...', border: 'border-b-emerald-500' },
    { title: 'Compromisos en Riesgo', value: data ? data.kpis.en_riesgo : '...', border: 'border-b-rose-500' },
    { title: 'Células con rezago', value: data ? data.kpis.celulas_rezago : '...', border: 'border-b-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div
        className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
        role="note"
      >
        Vista agregada desde{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">GET /dashboard/okr</code>.
        Para el flujo operativo (compromisos, revisiones y drill-down con datos reales) usa el{' '}
        <Link href="/okr_dashboard" className="font-medium text-primary underline-offset-4 hover:underline">
          dashboard OKR principal
        </Link>
        .
      </div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">9. Compromisos OKR (simulador)</h1>
          <p className="text-muted-foreground text-sm mt-1">Simulador de Cascada y Drill-down (4 niveles)</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className={`glass-hover p-5 border-b-4 ${kpi.border}`}>
            <h3 className="text-muted-foreground text-sm font-medium">{kpi.title}</h3>
            <p className="text-3xl font-bold mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Simulator Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap & Drill-down */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Heatmap Organizacional</h3>
            {isLoading ? (
              <Skeleton className="w-full h-64 rounded-xl" />
            ) : (
              <div className="h-64 border border-white/[0.08] rounded-xl bg-white/[0.02] flex items-center justify-center">
                <p className="text-slate-500 text-sm">Mapa interactivo (Nivel {activeLevel}/4)</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Center Lateral */}
        <div className="space-y-6">
          <div className="glass-card h-full min-h-[400px]">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Action Center</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Ajusta las calificaciones de las células inferiores para simular el impacto en el score global.
            </p>
            {/* Controles de simulación */}
            <div className="space-y-4">
              {data?.heatmap.map((node, idx) => (
                <div key={idx} className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{node.name}</span>
                    <span className={node.score < 60 ? "text-sm text-rose-400" : "text-sm text-emerald-400"}>
                      {node.score}%
                    </span>
                  </div>
                  <input type="range" className="w-full accent-emerald-500" min="0" max="100" defaultValue={node.score} />
                </div>
              ))}
              {!isLoading && data?.heatmap.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay datos de compromisos registrados.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
