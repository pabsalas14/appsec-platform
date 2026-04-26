'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { DataTable } from '@/components/charts';

interface VulnData {
  total_by_severity: Record<string, number>;
  total_by_engine: Record<string, number>;
  total: number;
}

interface DrilldownLevel {
  id: string;
  name: string;
  type: 'global' | 'subdireccion' | 'celula' | 'repositorio';
}

export default function VulnerabilitiesDashboardPage() {
  const [drilldownPath, setDrilldownPath] = useState<DrilldownLevel[]>([
    { id: 'global', name: 'Global', type: 'global' },
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-vulnerabilities', drilldownPath],
    queryFn: async () => {
      logger.info('dashboard.vulnerabilities.fetch', { path: drilldownPath });
      const response = await apiClient.get('/api/v1/dashboard/vulnerabilities');
      return response.data.data as VulnData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar vulnerabilidades</span>
      </div>
    );
  }

  const handleDrill = (level: DrilldownLevel) => {
    setDrilldownPath([...drilldownPath, level]);
  };

  const handleBack = () => {
    if (drilldownPath.length > 1) {
      setDrilldownPath(drilldownPath.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Vulnerabilidades</h1>
          <p className="text-muted-foreground mt-1">Vista jerárquica: Global → Subdirección → Célula → Repositorio</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        {drilldownPath.map((level, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Button
              variant={idx === drilldownPath.length - 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrilldownPath(drilldownPath.slice(0, idx + 1))}
            >
              {level.name}
            </Button>
            {idx < drilldownPath.length - 1 && <ChevronDown className="h-4 w-4" />}
          </div>
        ))}
        {drilldownPath.length > 1 && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="ml-auto">
            <ChevronUp className="h-4 w-4 mr-2" />
            Atrás
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card data-testid="total-vulns-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Críticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {data?.total_by_severity['Crítica'] || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Altas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {data?.total_by_severity['Alta'] || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Motores Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Object.keys(data?.total_by_engine || {}).length}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="severity" data-testid="vuln-tabs">
        <TabsList>
          <TabsTrigger value="severity">Por Severidad</TabsTrigger>
          <TabsTrigger value="engine">Por Motor</TabsTrigger>
          <TabsTrigger value="trends">Tendencia</TabsTrigger>
        </TabsList>

        <TabsContent value="severity" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card data-testid="severity-distribution">
              <CardHeader>
                <CardTitle className="text-sm">Distribución por Severidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data?.total_by_severity || {}).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{severity}</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-muted w-24 h-6 rounded flex items-center px-2">
                          <span className="text-xs font-medium">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="engine" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card data-testid="engine-distribution">
              <CardHeader>
                <CardTitle className="text-sm">Distribución por Motor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data?.total_by_engine || {}).map(([engine, count]) => (
                    <div key={engine} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{engine}</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-muted w-24 h-6 rounded flex items-center px-2">
                          <span className="text-xs font-medium">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Histórico de Vulnerabilidades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gráfico de tendencia histórica de vulnerabilidades en este nivel
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
