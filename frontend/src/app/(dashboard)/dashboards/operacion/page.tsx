'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { DataTable } from '@/components/charts';

interface Release {
  id: string;
  nombre: string;
  version: string;
  estado_actual: string;
  jira_referencia?: string;
  created_at?: string;
}

interface OperacionData {
  items: Release[];
  count: number;
}

export default function OperacionDashboardPage() {
  const [activeTab, setActiveTab] = useState('releases');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-operacion'],
    queryFn: async () => {
      logger.info('dashboard.operacion.fetch');
      const response = await apiClient.get('/api/v1/dashboard/releases-table');
      return response.data.data as OperacionData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar dashboard de operación</span>
      </div>
    );
  }

  const releaseColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'version', label: 'Versión' },
    { key: 'estado_actual', label: 'Estado' },
    { key: 'jira_referencia', label: 'JIRA' },
    { key: 'created_at', label: 'Fecha Creación' },
  ];

  const statusDistribution = (data?.items || []).reduce(
    (acc, item) => {
      acc[item.estado_actual || 'Sin Estado'] = (acc[item.estado_actual || 'Sin Estado'] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Operación</h1>
          <p className="text-muted-foreground mt-1">Gestión y seguimiento de liberaciones</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="total-releases-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total de Liberaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">{data?.count || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estados Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">
                {Object.keys(statusDistribution).length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Última Actualización</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-sm text-muted-foreground">
                {data?.items?.[0]?.created_at
                  ? new Date(data.items[0].created_at).toLocaleDateString('es-ES')
                  : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="operacion-tabs">
        <TabsList>
          <TabsTrigger value="releases">Liberaciones</TabsTrigger>
          <TabsTrigger value="status">Por Estado</TabsTrigger>
        </TabsList>

        <TabsContent value="releases" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : data?.items ? (
            <DataTable
              title="Listado de Liberaciones"
              columns={releaseColumns}
              data={data.items}
              data-testid="releases-table"
            />
          ) : null}
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card data-testid="status-distribution">
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statusDistribution)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([status, count]) => {
                      const total = data?.count || 1;
                      const percentage = ((count as number) / total) * 100;
                      return (
                        <div key={status} className="flex items-center gap-4">
                          <div className="w-40">
                            <p className="text-sm font-medium truncate">{status}</p>
                          </div>
                          <div className="flex-1">
                            <div className="h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded flex items-center px-2">
                              <span className="text-white text-xs font-bold">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-16 text-right">
                            <p className="text-sm font-bold">{count}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
