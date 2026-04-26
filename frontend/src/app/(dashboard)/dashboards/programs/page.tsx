'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GaugeChart, HistoricoMensualGrid } from '@/components/charts';
import { AlertCircle, ChevronRight, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HeatmapEntry {
  month: number;
  value: number;
  total: number;
  closed: number;
}

interface HeatmapData {
  heatmap: Record<string, HeatmapEntry[]>;
}

const PROGRAM_TYPES = ['SAST', 'DAST', 'Threat Modeling', 'Source Code'];
const PROGRAM_COLORS: Record<string, string> = {
  SAST: 'text-blue-600',
  DAST: 'text-red-600',
  'Threat Modeling': 'text-purple-600',
  'Source Code': 'text-green-600',
};

export default function ProgramsDashboardPage() {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const { data: heatmapData, isLoading: heatmapLoading, error: heatmapError } = useQuery({
    queryKey: ['dashboard-programs-heatmap'],
    queryFn: async () => {
      logger.info('dashboard.programs.heatmap.fetch');
      const response = await apiClient.get('/dashboard/programs/heatmap');
      return response.data.data as HeatmapData;
    },
  });

  if (heatmapError) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard de programas</span>
      </div>
    );
  }

  // Calculate annual completion from heatmap data
  const calculateAnnualCompletion = (months: HeatmapEntry[]): number => {
    if (!months || months.length === 0) return 0;
    const totalClosed = months.reduce((sum, m) => sum + m.closed, 0);
    const totalAll = months.reduce((sum, m) => sum + m.total, 0);
    return totalAll > 0 ? Math.round((totalClosed / totalAll) * 100) : 0;
  };

  // Get current month completion
  const getCurrentMonthCompletion = (months: HeatmapEntry[]): number => {
    if (!months || months.length === 0) return 0;
    const currentMonth = months[months.length - 1];
    return currentMonth ? currentMonth.value : 0;
  };

  // Build monthly progress chart data
  const getMonthlyChartData = () => {
    if (!heatmapData?.heatmap) return [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data: Array<Record<string, number | string>> = [];

    for (let i = 0; i < 12; i++) {
      const entry: Record<string, number | string> = { month: monthNames[i], meta: 100 };
      for (const ptype of PROGRAM_TYPES) {
        const months = heatmapData.heatmap[ptype];
        if (months && months[i]) {
          entry[ptype] = months[i].value;
        }
      }
      data.push(entry);
    }
    return data;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Programas Anuales</h1>
        <p className="text-muted-foreground mt-1">
          Seguimiento de avance de programas de seguridad (SAST, DAST, Threat Modeling, Source Code)
        </p>
      </div>

      {/* Gauge Cards Row */}
      {heatmapLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROGRAM_TYPES.map((ptype) => {
            const months = heatmapData?.heatmap[ptype] || [];
            const annual = calculateAnnualCompletion(months);
            const monthly = getCurrentMonthCompletion(months);

            return (
              <Card
                key={ptype}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProgram(ptype)}
              >
                <CardHeader>
                  <CardTitle className={`text-sm ${PROGRAM_COLORS[ptype]}`}>{ptype}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-2">
                  <GaugeChart
                    value={annual}
                    size="sm"
                    className="w-full"
                    showPercent={true}
                    color={PROGRAM_COLORS[ptype]}
                  />
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    Mes actual: <span className="font-semibold">{monthly}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Historical Grids */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Mensual por Programa</CardTitle>
        </CardHeader>
        <CardContent>
          {heatmapLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PROGRAM_TYPES.map((ptype) => {
                const months = heatmapData?.heatmap[ptype] || [];
                return (
                  <div
                    key={ptype}
                    className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedProgram(ptype)}
                  >
                    <h4 className={`text-sm font-semibold ${PROGRAM_COLORS[ptype]} mb-3`}>{ptype}</h4>
                    <HistoricoMensualGrid
                      months={months.map((m) => ({ month: m.month, value: m.value }))}
                      year={new Date().getFullYear()}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity & Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Actividad del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Escaneos Completados</p>
                      <p className="text-xs text-muted-foreground">12 ejecuciones</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Hallazgos Remediados</p>
                      <p className="text-xs text-muted-foreground">84 vulnerabilidades</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">En Revisión</p>
                      <p className="text-xs text-muted-foreground">23 pendientes</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Avance Mensual vs Meta (100%)</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={getMonthlyChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="meta" stroke="#888" strokeDasharray="5 5" name="Meta" />
                  {PROGRAM_TYPES.map((ptype) => (
                    <Line
                      key={ptype}
                      type="monotone"
                      dataKey={ptype}
                      stroke={PROGRAM_COLORS[ptype]}
                      name={ptype}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Concentrado de Hallazgos Link */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Concentrado de Hallazgos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Vista detallada de todas las vulnerabilidades por programa y severidad
              </p>
            </div>
            <a
              href="/dashboards/concentrado"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Ir al Concentrado
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
