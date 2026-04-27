'use client';

import { useQuery } from '@tanstack/react-query';

import { PageHeader, PageWrapper, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

export default function TemasAuditoriasDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-temas-auditorias'],
    queryFn: async () => {
      logger.info('dashboard.temas_auditorias.fetch');
      const res = await apiClient.get<{ data: Record<string, unknown> }>('/dashboard/temas-auditorias');
      return res.data.data;
    },
  });

  if (error) {
    return (
      <PageWrapper className="p-6">
        <p className="text-destructive text-sm">No se pudo cargar el dashboard combinado.</p>
      </PageWrapper>
    );
  }

  const temas = data?.temas as { kpis?: Record<string, number>; tabla?: unknown[] } | undefined;
  const aud = data?.auditorias as { kpis?: Record<string, number>; tabla?: unknown[] } | undefined;

  return (
    <PageWrapper className="space-y-8 p-6">
      <PageHeader
        title="Dashboard · Temas emergentes y auditorías"
        description="Vista unificada (V2): Parte A temas, Parte B auditorías."
      />
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-3 border-b pb-2">Temas emergentes</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs text-muted-foreground">Abiertos</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{temas?.kpis?.total_abiertos ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs text-muted-foreground">Sin movimiento 7d</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{temas?.kpis?.sin_movimiento_7d ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs text-muted-foreground">Próximos a vencer</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{temas?.kpis?.proximos_vencer ?? 0}</CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground">{Array.isArray(temas?.tabla) ? `${temas?.tabla?.length} filas` : ''}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3 border-b pb-2">Auditorías</h2>
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs text-muted-foreground">Activas</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{aud?.kpis?.activas ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs text-muted-foreground">Cerradas (año)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{aud?.kpis?.cerradas_ano ?? 0}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs text-muted-foreground">Hallazgos pend.</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{aud?.kpis?.hallazgos_pendientes ?? 0}</CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
