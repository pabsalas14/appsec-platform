'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertCircle, ArrowLeft, Bug, ExternalLink } from 'lucide-react';
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

interface MonthlyCount {
  month: string;
  count: number;
}

interface ScoringEntry {
  period: string;
  mes: number;
  ano: number;
  avg_score: number | null;
  total_hallazgos: number;
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
  monthly_trends: MonthlyCount[];
  scoring_history: ScoringEntry[];
  hallazgos_link: string;
}

const PROGRAM_NAMES: Record<string, string> = {
  SAST: 'Static Application Security Testing (SAST)',
  DAST: 'Dynamic Application Security Testing (DAST)',
  THREAT_MODELING: 'Threat Modeling (STRIDE / DREAD)',
  SOURCE_CODE: 'Seguridad en Código Fuente',
};

const ESTADO_COLORS: Record<string, string> = {
  Activo: 'bg-blue-100 text-blue-800',
  Completado: 'bg-green-100 text-green-800',
  Cancelado: 'bg-gray-100 text-gray-700',
  'En Progreso': 'bg-amber-100 text-amber-800',
};

export default function ProgramDetailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'SAST';

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard3-program-detail', code],
    queryFn: async () => {
      logger.info('dashboard3.program_detail.fetch', { code });
      const response = await apiClient.get(`/dashboard3/program/${code}/detail`);
      return response.data.data as ProgramDetailData;
    },
  });

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-6">
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

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboards/programs" className="flex items-center gap-2 text-primary hover:underline text-sm">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data?.program_type || code}</h1>
            <p className="text-muted-foreground mt-1">{PROGRAM_NAMES[data?.program_type || code] || code}</p>
          </div>
        </div>
        {data?.hallazgos_link && (
          <Link
            href={data.hallazgos_link}
            className="flex items-center gap-2 text-sm text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Bug className="h-4 w-4" />
            Ver concentrado de hallazgos
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Programas', value: data?.summary.total ?? 0, color: '' },
          { label: 'Activos', value: data?.summary.active ?? 0, color: 'text-blue-600' },
          { label: 'Completados', value: data?.summary.completed ?? 0, color: 'text-green-600' },
          { label: 'Completitud', value: `${data?.summary.completion_percentage ?? 0}%`, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scoring History */}
      {(isLoading || (data?.scoring_history && data.scoring_history.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Historial Mensual de Score (Actividad Mensual)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data?.scoring_history || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="score" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis yAxisId="hallazgos" orientation="right" />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'avg_score'
                          ? [`${Number(value).toFixed(1)}%`, 'Score promedio']
                          : [value, 'Hallazgos']
                      }
                    />
                    <Legend />
                    <Bar yAxisId="score" dataKey="avg_score" name="Score promedio (%)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="hallazgos" dataKey="total_hallazgos" name="Total hallazgos" fill="#f97316" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs">
                        <th className="text-left pb-2 font-medium">Período</th>
                        <th className="text-right pb-2 font-medium">Score Promedio</th>
                        <th className="text-right pb-2 font-medium">Total Hallazgos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.scoring_history.map((row) => (
                        <tr key={row.period} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 font-mono text-xs">{row.period}</td>
                          <td className="py-2 text-right tabular-nums">
                            {row.avg_score != null ? (
                              <span
                                className={
                                  row.avg_score >= 80
                                    ? 'text-green-600 font-semibold'
                                    : row.avg_score >= 50
                                      ? 'text-amber-600'
                                      : 'text-red-600'
                                }
                              >
                                {row.avg_score.toFixed(1)}%
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2 text-right tabular-nums text-muted-foreground">
                            {row.total_hallazgos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Trends: programs created */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia Mensual — Programas Creados (Últimos 12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  name="Programas creados"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Programas ({data?.summary.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.programs && data.programs.length > 0 ? (
            <div className="space-y-2">
              {data.programs.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{program.nombre}</p>
                    {program.descripcion && (
                      <p className="text-sm text-muted-foreground truncate">{program.descripcion}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">Año: {program.ano}</p>
                  </div>
                  <Badge
                    className={ESTADO_COLORS[program.estado] || 'bg-gray-100 text-gray-700'}
                    variant="outline"
                  >
                    {program.estado}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay programas registrados para este tipo.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
