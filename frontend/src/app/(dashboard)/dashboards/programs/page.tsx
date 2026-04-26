'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  TrendingUp,
  Activity,
  Code2,
  Shield,
  Search,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';
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

interface ResumenData {
  total_programas: number;
  programas_activos: number;
  programas_en_progreso: number;
  breakdown: {
    sast: number;
    dast: number;
    threat_modeling: number;
    source_code: number;
  };
}

interface DistribucionData {
  distribucion: Record<string, number>;
  total: number;
}

interface ProgramRow {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  ano: number;
  created_at: string;
  updated_at: string;
  ultima_ejecucion: string | null;
  vulns_encontradas: number;
}

interface TablaData {
  data: ProgramRow[];
  page: number;
  page_size: number;
  total: number;
}

const tipoIcons: Record<string, React.ReactNode> = {
  SAST: <Code2 className="h-4 w-4" />,
  DAST: <Shield className="h-4 w-4" />,
  'Threat Modeling': <Activity className="h-4 w-4" />,
  'Source Code': <Search className="h-4 w-4" />,
};

const tipoColors: Record<string, string> = {
  SAST: 'bg-blue-50 text-blue-700',
  DAST: 'bg-red-50 text-red-700',
  'Threat Modeling': 'bg-purple-50 text-purple-700',
  'Source Code': 'bg-green-50 text-green-700',
};

const estadoColors: Record<string, string> = {
  Activo: 'bg-green-50 text-green-700',
  Completado: 'bg-blue-50 text-blue-700',
  Cancelado: 'bg-gray-50 text-gray-700',
  'En Progreso': 'bg-yellow-50 text-yellow-700',
};

export default function ProgramsDashboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: resumen, isLoading: resumenLoading, error: resumenError } = useQuery({
    queryKey: ['dashboard-programs-resumen'],
    queryFn: async () => {
      logger.info('dashboard.programs.resumen.fetch');
      const response = await apiClient.get('/api/v1/dashboard/programs/resumen');
      return response.data.data as ResumenData;
    },
  });

  const { data: distribucion, isLoading: distribucionLoading } = useQuery({
    queryKey: ['dashboard-programs-distribucion'],
    queryFn: async () => {
      logger.info('dashboard.programs.distribucion.fetch');
      const response = await apiClient.get('/api/v1/dashboard/programs/distribucion');
      return response.data.data as DistribucionData;
    },
  });

  const { data: tabla, isLoading: tablaLoading } = useQuery({
    queryKey: ['dashboard-programs-tabla', page],
    queryFn: async () => {
      logger.info('dashboard.programs.tabla.fetch', { page });
      const response = await apiClient.get('/api/v1/dashboard/programs/tabla', {
        params: {
          page,
          page_size: pageSize,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
      });
      return response.data.data as TablaData;
    },
  });

  if (resumenError) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard de programas</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Programas</h1>
          <p className="text-muted-foreground mt-1">
            Estado y progreso de programas de seguridad (SAST, DAST, Threat Modeling, Source Code)
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total de Programas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumenLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">{resumen?.total_programas || 0}</div>
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
            {resumenLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-blue-600">{resumen?.programas_activos || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumenLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-amber-600">
                {resumen?.programas_en_progreso || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribution by Engine */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Motor</CardTitle>
        </CardHeader>
        <CardContent>
          {distribucionLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {distribucion?.distribucion &&
                Object.entries(distribucion.distribucion).map(([motor, count]) => (
                  <div
                    key={motor}
                    className={`p-4 rounded-lg ${tipoColors[motor] || 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {tipoIcons[motor] || <Shield className="h-4 w-4" />}
                      <span className="font-semibold text-sm">{motor}</span>
                    </div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs opacity-75">
                      {distribucion.total > 0
                        ? `${((count / distribucion.total) * 100).toFixed(1)}%`
                        : '0%'}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabla de Programas</CardTitle>
        </CardHeader>
        <CardContent>
          {tablaLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Programa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Año</TableHead>
                      <TableHead>Última Ejecución</TableHead>
                      <TableHead className="text-right">Vulns Encontradas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabla?.data && tabla.data.length > 0 ? (
                      tabla.data.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell className="font-medium">{program.nombre}</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                tipoColors[program.tipo] || 'bg-gray-50'
                              }`}
                            >
                              {tipoIcons[program.tipo] || <Shield className="h-3 w-3" />}
                              {program.tipo}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                estadoColors[program.estado] || 'bg-gray-50'
                              }`}
                            >
                              {program.estado === 'Activo' && <Activity className="h-3 w-3" />}
                              {program.estado === 'Completado' && <TrendingUp className="h-3 w-3" />}
                              {program.estado === 'Cancelado' && <AlertTriangle className="h-3 w-3" />}
                              {program.estado}
                            </div>
                          </TableCell>
                          <TableCell>{program.ano}</TableCell>
                          <TableCell className="text-sm">
                            {program.ultima_ejecucion ? (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(program.ultima_ejecucion).toLocaleDateString('es-ES')}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {program.vulns_encontradas > 0 ? (
                              <span className="font-semibold text-red-600">
                                {program.vulns_encontradas}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No hay programas registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando {tabla?.data.length || 0} de {tabla?.total || 0} programas
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-accent"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Página {page} de {Math.ceil((tabla?.total || 0) / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!tabla || page >= Math.ceil(tabla.total / pageSize)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-accent"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
