'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/charts';
import { AlertCircle, Users } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

interface TeamMember {
  user_id: string;
  total_vulnerabilities: number;
  open_vulnerabilities: number;
  closed_vulnerabilities: number;
  closure_rate: number;
}

interface TeamDashboardData {
  team_size: number;
  analysts: TeamMember[];
}

export default function TeamDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-team'],
    queryFn: async () => {
      logger.info('dashboard.team.fetch');
      const response = await apiClient.get('/api/v1/dashboard/team');
      return response.data.data as TeamDashboardData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard de equipo</span>
      </div>
    );
  }

  const columns = [
    { key: 'user_id', label: 'Usuario' },
    { key: 'total_vulnerabilities', label: 'Total Vulnerabilidades' },
    { key: 'open_vulnerabilities', label: 'Abiertas' },
    { key: 'closed_vulnerabilities', label: 'Cerradas' },
    { key: 'closure_rate', label: 'Tasa Cierre (%)' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Equipo</h1>
          <p className="text-muted-foreground mt-1">Carga de trabajo por analista</p>
        </div>
      </div>

      {/* KPI: Tamaño del equipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="team-size-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tamaño del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">{data?.team_size || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Vulnerabilidades Abiertas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-amber-600">
                {data?.analysts.reduce((sum, a) => sum + a.open_vulnerabilities, 0) || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tasa Promedio Cierre</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {Math.round((data?.analysts.reduce((sum, a) => sum + a.closure_rate, 0) || 0) / (data?.analysts.length || 1))}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Analistas */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : data?.analysts ? (
        <DataTable
          title="Carga de Trabajo por Analista"
          columns={columns}
          data={data.analysts}
          data-testid="analysts-table"
        />
      ) : null}
    </div>
  );
}
