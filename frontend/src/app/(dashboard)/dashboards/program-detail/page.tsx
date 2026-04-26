'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import Link from 'next/link';

interface Program {
  id: string;
  nombre: string;
  ano: number;
  descripcion: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface MonthlyCounts {
  month: string;
  count: number;
}

interface ProgramSummary {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  completion_percentage: number;
}

interface ProgramDetailData {
  program_type: string;
  programs: Program[];
  summary: ProgramSummary;
  monthly_trends: MonthlyCounts[];
}

export default function ProgramDetailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'SAST';

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard3-program-detail', code],
    queryFn: async () => {
      logger.info('dashboard3.program_detail.fetch', { code });
      const response = await apiClient.get(`/api/v1/dashboard3/program/${code}/detail`);
      return response.data.data as ProgramDetailData;
    },
  });

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/dashboards/programs" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard de Programas
        </Link>
        <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>Error al cargar los detalles del programa</span>
        </div>
      </div>
    );
  }

  const getProgramName = (type: string) => {
    const names: Record<string, string> = {
      SAST: 'Static Application Security Testing',
      DAST: 'Dynamic Application Security Testing',
      THREAT_MODELING: 'Threat Modeling (STRIDE/DREAD)',
      SOURCE_CODE: 'Source Code Review & Controls',
    };
    return names[type] || type;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboards/programs" className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data?.program_type || code}</h1>
            <p className="text-muted-foreground mt-1">{getProgramName(data?.program_type || code)}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Programas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">{data?.summary.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-blue-600">{data?.summary.active || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{data?.summary.completed || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completitud</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-purple-600">{data?.summary.completion_percentage || 0}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual (Últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  name="Programas Creados"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Programas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.programs && data.programs.length > 0 ? (
            <div className="space-y-3">
              {data.programs.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{program.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{program.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Año: {program.ano} • Estado: {program.estado}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        program.estado === 'Activo'
                          ? 'bg-blue-100 text-blue-800'
                          : program.estado === 'Completado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {program.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay programas registrados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
