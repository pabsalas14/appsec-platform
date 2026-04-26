'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/charts';
import { AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

interface ProgramBreakdown {
  program: string;
  total_findings: number;
  closed_findings: number;
  completion_percentage: number;
}

interface ProgramsDashboardData {
  total_programs: number;
  avg_completion: number;
  programs_at_risk: number;
  program_breakdown: ProgramBreakdown[];
}

export default function ProgramsDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-programs'],
    queryFn: async () => {
      logger.info('dashboard.programs.fetch');
      const response = await apiClient.get('/api/v1/dashboard/programs');
      return response.data.data as ProgramsDashboardData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard de programas</span>
      </div>
    );
  }

  const columns = [
    { key: 'program', label: 'Programa' },
    { key: 'total_findings', label: 'Total Hallazgos' },
    { key: 'closed_findings', label: 'Hallazgos Cerrados' },
    { key: 'completion_percentage', label: 'Completitud (%)' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Programas</h1>
          <p className="text-muted-foreground mt-1">Estado y progreso de programas de seguridad</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="total-programs-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total de Programas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">{data?.total_programs || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completitud Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{data?.avg_completion || 0}%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Programas en Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-red-600">{data?.programs_at_risk || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Programas */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : data?.program_breakdown ? (
        <DataTable
          title="Desglose de Programas"
          columns={columns}
          data={data.program_breakdown}
          data-testid="programs-table"
        />
      ) : null}
    </div>
  );
}
