'use client';

import { useRouter } from 'next/navigation';
import { useDashboards } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus } from 'lucide-react';

export default function DashboardsPage() {
  const router = useRouter();
  const { data: dashboards, isLoading, error } = useDashboards({ is_system: false });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>Error cargando dashboards</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus dashboards personalizados</p>
        </div>
        <Button
          onClick={() => router.push('/dashboards/builder')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Dashboard
        </Button>
      </div>

      {dashboards && dashboards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => (
            <Card
              key={dashboard.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/dashboards/${dashboard.id}`)}
            >
              <CardHeader>
                <CardTitle className="truncate">{dashboard.nombre}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {dashboard.descripcion || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dashboard.is_system ? 'Sistema' : 'Personalizado'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboards/${dashboard.id}/edit`);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground text-center">
              No hay dashboards personalizados. Crea uno nuevo para comenzar.
            </p>
            <Button
              onClick={() => router.push('/dashboards/builder')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
