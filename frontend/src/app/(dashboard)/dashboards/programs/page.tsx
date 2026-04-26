'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Activity, Code2, Shield, Search } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Gauge, GaugeContainer, GaugeValueDisplay } from '@/components/ui/gauge';
import Link from 'next/link';

interface Program {
  code: string;
  name: string;
  total: number;
  active: number;
  completion_percentage: number;
  status: 'active' | 'idle';
}

interface ProgramsSummary {
  total_programs: number;
  avg_completion_percentage: number;
  active_programs: number;
}

interface ProgramsSummaryData {
  programs: Program[];
  summary: ProgramsSummary;
}

const programIcons: Record<string, React.ReactNode> = {
  SAST: <Code2 className="h-5 w-5" />,
  DAST: <Shield className="h-5 w-5" />,
  THREAT_MODELING: <Activity className="h-5 w-5" />,
  SOURCE_CODE: <Search className="h-5 w-5" />,
};

const programColors: Record<string, string> = {
  SAST: 'from-blue-500/20 to-blue-600/20',
  DAST: 'from-red-500/20 to-red-600/20',
  THREAT_MODELING: 'from-purple-500/20 to-purple-600/20',
  SOURCE_CODE: 'from-green-500/20 to-green-600/20',
};

export default function ProgramsDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard3-programs-summary'],
    queryFn: async () => {
      logger.info('dashboard3.programs_summary.fetch');
      const response = await apiClient.get('/api/v1/dashboard3/programs-summary');
      return response.data.data as ProgramsSummaryData;
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Programas</h1>
          <p className="text-muted-foreground mt-1">Estado y progreso de programas de seguridad (SAST, DAST, Threat Modeling, Source Code)</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
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
              <div className="text-3xl font-bold">{data?.summary.total_programs || 0}</div>
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
              <div className="text-3xl font-bold text-green-600">{data?.summary.avg_completion_percentage || 0}%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Programas Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-blue-600">{data?.summary.active_programs || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Program Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          data?.programs.map((program) => (
            <Link key={program.code} href={`/dashboards/program-detail?code=${program.code}`}>
              <Card
                className={`bg-gradient-to-br ${programColors[program.code]} hover:shadow-lg transition-shadow cursor-pointer`}
                data-testid={`program-card-${program.code}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {programIcons[program.code]}
                    {program.code}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{program.name}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-semibold">{program.completion_percentage}%</span>
                    </div>
                    <GaugeContainer>
                      <Gauge value={program.completion_percentage} min={0} max={100}>
                        <GaugeValueDisplay />
                      </Gauge>
                    </GaugeContainer>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold text-lg">{program.total}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Activos</p>
                        <p className="font-semibold text-lg text-blue-600">{program.active}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
