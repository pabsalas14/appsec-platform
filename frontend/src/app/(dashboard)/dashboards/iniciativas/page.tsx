'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Target } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { DataTable } from '@/components/charts';

interface Initiative {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  progreso: number;
  fecha_inicio: string;
  fecha_fin: string;
}

interface InitiativesDashboardData {
  total_initiatives: number;
  avg_progress: number;
  initiatives_at_risk: number;
  initiatives: Initiative[];
}

export default function InitiativesDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-initiatives'],
    queryFn: async () => {
      logger.info('dashboard.initiatives.fetch');
      const response = await apiClient.get('/api/v1/dashboard/initiatives');
      return response.data.data as InitiativesDashboardData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard de iniciativas</span>
      </div>
    );
  }

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'estado', label: 'Estado' },
    { key: 'progreso', label: 'Progreso (%)' },
    { key: 'fecha_inicio', label: 'Inicio' },
    { key: 'fecha_fin', label: 'Fin' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Iniciativas</h1>
          <p className="text-muted-foreground mt-1">Seguimiento de iniciativas estratégicas</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="total-initiatives-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total de Iniciativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">{data?.total_initiatives || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progreso Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{data?.avg_progress || 0}%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Iniciativas en Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-red-600">{data?.initiatives_at_risk || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Iniciativas */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : data?.initiatives ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Listado de Iniciativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.initiatives.map(initiative => (
                  <div
                    key={initiative.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    data-testid={`initiative-card-${initiative.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{initiative.nombre}</h3>
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        {initiative.estado}
                      </span>
                    </div>
                    {initiative.descripcion && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {initiative.descripcion}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 h-2 bg-gray-200 rounded mr-3">
                        <div
                          className="h-full bg-green-500 rounded"
                          style={{ width: `${initiative.progreso}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold">{initiative.progreso}%</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                      <span>Inicio: {new Date(initiative.fecha_inicio).toLocaleDateString('es-ES')}</span>
                      <span>Fin: {new Date(initiative.fecha_fin).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
