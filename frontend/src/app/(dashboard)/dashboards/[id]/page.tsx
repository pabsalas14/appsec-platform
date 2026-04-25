'use client';

import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/useDashboard';
import { ArrowLeft, Edit } from 'lucide-react';

export default function DashboardViewPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.id as string;

  const { data: dashboard, isLoading, error } = useDashboard(dashboardId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-40" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="text-center text-red-500">
          Error cargando el dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button
          onClick={() => router.push(`/dashboards/${dashboardId}/edit`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dashboard.nombre}</h1>
        {dashboard.descripcion && (
          <p className="text-muted-foreground mt-2">{dashboard.descripcion}</p>
        )}
      </div>

      {/* Placeholder para renderizar widgets */}
      <div className="bg-muted/30 rounded-lg p-8 text-center text-muted-foreground">
        <p>Dashboard con {dashboard.layout_json.widgets.length} widgets</p>
        <p className="text-sm mt-2">
          {dashboard.is_system ? 'Sistema' : 'Personalizado'}
        </p>
      </div>
    </div>
  );
}
