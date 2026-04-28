'use client';

import { Download, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { HierarchyFiltersBarCard } from '@/components/dashboard/HierarchyFiltersBar';
import {
  Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader, PageWrapper,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';
import { useMadurez } from '@/hooks/useMadurez';
import { downloadCsvFromApi } from '@/lib/csvDownload';
import { extractErrorMessage } from '@/lib/utils';

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-500' : 'text-red-600';
  const bg = score >= 70 ? 'bg-green-100' : score >= 40 ? 'bg-amber-100' : 'bg-red-100';
  const label = score >= 70 ? 'Maduro' : score >= 40 ? 'En progreso' : 'Crítico';
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-8 ${bg}`}>
      <span className={`text-7xl font-black tabular-nums ${color}`}>{score.toFixed(1)}</span>
      <span className="text-lg font-semibold text-muted-foreground mt-1">/ 100</span>
      <span className={`mt-3 text-sm font-medium px-3 py-1 rounded-full ${bg} ${color} border border-current/20`}>
        {label}
      </span>
    </div>
  );
}

export default function MadurezPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useMadurez({
    subdireccion_id: filters.subdireccion_id || undefined,
    gerencia_id: filters.gerencia_id || undefined,
    organizacion_id: filters.organizacion_id || undefined,
    celula_id: filters.celula_id || undefined,
  });

  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.subdireccion_id) params.set('subdireccion_id', filters.subdireccion_id);
      if (filters.gerencia_id) params.set('gerencia_id', filters.gerencia_id);
      if (filters.organizacion_id) params.set('organizacion_id', filters.organizacion_id);
      if (filters.celula_id) params.set('celula_id', filters.celula_id);
      const qs = params.toString();
      await downloadCsvFromApi(`/madurez/export.csv${qs ? `?${qs}` : ''}`, 'madurez.csv');
      toast.success('CSV exportado');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al exportar'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Score de Madurez"
        description="Porcentaje de vulnerabilidades cerradas/remediadas sobre el total — refleja el nivel de madurez del programa de seguridad."
        action={
          <Button variant="outline" size="sm" onClick={() => void onExport()} disabled={exporting}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Exportar CSV
          </Button>
        }
      />

      <HierarchyFiltersBarCard
        title="Filtro jerárquico"
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        savedModulo={DASHBOARD_FILTER_MODULO.home}
        onApplyFilters={applyFilters}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <EmptyState icon={ShieldCheck} title="Sin datos" description="Ajusta los filtros o registra vulnerabilidades para calcular el score." />
      ) : (
        <>
          {/* Score principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <ScoreGauge score={data.score ?? 0} />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4 content-start">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Total vulnerabilidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.total ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Cerradas / Remediadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{data.cerradas ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Activas (abiertas)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{data.activas ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Tasa de cierre</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {data.total ? ((data.cerradas / data.total) * 100).toFixed(1) : '0.0'}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Desglose por célula */}
          {data.by_celula && data.by_celula.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score por Célula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.by_celula.sort((a, b) => b.score - a.score).map((row) => {
                    const pct = row.score ?? 0;
                    const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={row.celula} className="flex items-center gap-3">
                        <span className="w-40 text-sm truncate text-muted-foreground">{row.celula}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold tabular-nums w-14 text-right">{pct.toFixed(1)}%</span>
                        <span className="text-xs text-muted-foreground w-20 text-right">{row.total} vulns</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desglose por organización */}
          {data.by_organizacion && data.by_organizacion.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score por Organización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.by_organizacion.sort((a, b) => b.score - a.score).map((row) => {
                    const pct = row.score ?? 0;
                    const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={row.organizacion} className="flex items-center gap-3">
                        <span className="w-40 text-sm truncate text-muted-foreground">{row.organizacion}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold tabular-nums w-14 text-right">{pct.toFixed(1)}%</span>
                        <span className="text-xs text-muted-foreground w-20 text-right">{row.total} vulns</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageWrapper>
  );
}
