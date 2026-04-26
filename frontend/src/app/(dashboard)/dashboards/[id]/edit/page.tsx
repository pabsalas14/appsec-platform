'use client';

import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardBuilder } from '@/components/DashboardBuilder';
import { ArrowLeft } from 'lucide-react';

export default function DashboardEditPage() {
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
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="w-fit gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <DashboardBuilder
        dashboard={dashboard}
        onSave={() => {
          router.push(`/dashboards/${dashboardId}`);
        }}
      />
    </div>
  );
}
