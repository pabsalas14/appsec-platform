'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

interface ConcentradoData {
  by_motor: Record<string, number>;
  by_severity: Record<string, number>;
  total: number;
}

export default function ConcentradoDashboardPage() {
  const [activeTab, setActiveTab] = useState('motor');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-concentrado'],
    queryFn: async () => {
      logger.info('dashboard.concentrado.fetch');
      const response = await apiClient.get('/api/v1/dashboard/vulnerabilities');
      return response.data.data as ConcentradoData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar dashboard concentrado</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Concentrado</h1>
          <p className="text-muted-foreground mt-1">Vulnerabilidades agregadas por motor y severidad</p>
        </div>
      </div>

      {/* Total KPI */}
      <Card data-testid="total-vuln-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Total de Vulnerabilidades</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-12 w-1/3" />
          ) : (
            <div className="text-4xl font-bold text-blue-600">{data?.total || 0}</div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="concentrado-tabs">
        <TabsList>
          <TabsTrigger value="motor">Por Motor</TabsTrigger>
          <TabsTrigger value="severity">Por Severidad</TabsTrigger>
        </TabsList>

        <TabsContent value="motor" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card data-testid="motor-chart">
              <CardHeader>
                <CardTitle>Distribución por Motor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data?.by_motor || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([motor, count]) => {
                      const total = data?.total || 1;
                      const percentage = ((count as number) / total) * 100;
                      return (
                        <div key={motor} className="flex items-center gap-4">
                          <div className="w-32">
                            <p className="text-sm font-medium">{motor}</p>
                          </div>
                          <div className="flex-1">
                            <div className="h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center px-2">
                              <span className="text-white text-xs font-bold">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-20 text-right">
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

        <TabsContent value="severity" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card data-testid="severity-chart">
              <CardHeader>
                <CardTitle>Distribución por Severidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data?.by_severity || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([severity, count]) => {
                      const total = data?.total || 1;
                      const percentage = ((count as number) / total) * 100;
                      const colorClass = {
                        'Crítica': 'from-red-500 to-red-600',
                        'Alta': 'from-orange-500 to-orange-600',
                        'Media': 'from-amber-500 to-amber-600',
                        'Baja': 'from-green-500 to-green-600',
                      }[severity] || 'from-gray-500 to-gray-600';
                      
                      return (
                        <div key={severity} className="flex items-center gap-4">
                          <div className="w-32">
                            <p className="text-sm font-medium">{severity}</p>
                          </div>
                          <div className="flex-1">
                            <div className={`h-8 bg-gradient-to-r ${colorClass} rounded flex items-center px-2`}>
                              <span className="text-white text-xs font-bold">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-20 text-right">
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
