'use client';

import { useQuery } from '@tanstack/react-query';

import { PageHeader, PageWrapper, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

export default function PlatformReleaseDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-platform-release'],
    queryFn: async () => {
      logger.info('dashboard.platform_release.fetch');
      const res = await apiClient.get<{ data: Record<string, unknown> }>('/dashboard/platform-release');
      return res.data.data;
    },
  });

  if (error) {
    return (
      <PageWrapper className="p-6">
        <p className="text-destructive text-sm">No se pudo cargar el dashboard de plataforma.</p>
      </PageWrapper>
    );
  }

  const kpis = data?.kpis as
    | {
        version_actual: string;
        ultima_actualizacion: string;
        releases_en_desarrollo: number;
        bugs_reportados: number;
      }
    | undefined;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Release de plataforma"
        description="Versión desplegada, changelog y roadmap interno (AppSec platform)."
      />
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Versión actual</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{kpis?.version_actual ?? '—'}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Última actualización</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{kpis?.ultima_actualizacion ?? '—'}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">En desarrollo</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{kpis?.releases_en_desarrollo ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Bugs (changelog)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{kpis?.bugs_reportados ?? 0}</CardContent>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
