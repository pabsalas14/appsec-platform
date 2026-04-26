'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Filter } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import api from '@/lib/api';
import { logger } from '@/lib/logger';

interface MotorData {
  nombre: string;
  count: number;
}

interface SeveridadData {
  severidad: string;
  count: number;
}

interface VulnTableItem {
  id: string;
  titulo: string;
  severidad: string;
  estado: string;
  fuente: string;
  created_at: string;
}

export default function ConcentradoDashboardPage() {
  const [activeTab, setActiveTab] = useState('motor');
  const [filtroFuente, setFiltroFuente] = useState<string | null>(null);
  const [filtroSeveridad, setFiltroSeveridad] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [vistaAgrupada, setVistaAgrupada] = useState(true);

  const { data: motorData, isLoading: loadingMotor, error: errorMotor } = useQuery({
    queryKey: ['dashboard-concentrado-motor'],
    queryFn: async () => {
      logger.info('dashboard.concentrado.motor.fetch');
      const response = await api.get('/dashboard/vuln-concentrated/by-motor');
      return response.data.data;
    },
  });

  const { data: severidadData, isLoading: loadingSeveridad, error: errorSeveridad } = useQuery({
    queryKey: ['dashboard-concentrado-severity'],
    queryFn: async () => {
      logger.info('dashboard.concentrado.severity.fetch');
      const response = await api.get('/dashboard/vuln-concentrated/by-severity');
      return response.data.data;
    },
  });

  const { data: tableData, isLoading: loadingTable, error: errorTable } = useQuery({
    queryKey: ['dashboard-concentrado-table', filtroFuente, filtroSeveridad, currentPage],
    queryFn: async () => {
      logger.info('dashboard.concentrado.table.fetch', {
        fuente: filtroFuente,
        severidad: filtroSeveridad,
        page: currentPage,
      });
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: '50',
      });
      if (filtroFuente) params.append('fuente', filtroFuente);
      if (filtroSeveridad) params.append('severidad', filtroSeveridad);
      
      const response = await api.get(
        `/dashboard/vuln-concentrated/table?${params.toString()}`
      );
      return response.data;
    },
  });

  const motores = motorData?.motores || [];
  const severidades = severidadData?.severidades || [];
  const tablePagination = tableData?.data?.pagination;
  const tableItems = tableData?.data?.items || [];

  const totalVulns = motorData?.motores?.reduce((sum: number, m: MotorData) => sum + m.count, 0) || 0;

  if (errorMotor || errorSeveridad) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar dashboard concentrado</span>
      </div>
    );
  }

  const getSeveridadColor = (severity: string): string => {
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('critica')) return 'from-red-500 to-red-600';
    if (severityLower.includes('alta')) return 'from-orange-500 to-orange-600';
    if (severityLower.includes('media')) return 'from-amber-500 to-amber-600';
    if (severityLower.includes('baja')) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  const getSeveridadBadgeColor = (severity: string): string => {
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('critica')) return 'bg-red-100 text-red-800';
    if (severityLower.includes('alta')) return 'bg-orange-100 text-orange-800';
    if (severityLower.includes('media')) return 'bg-amber-100 text-amber-800';
    if (severityLower.includes('baja')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const motorOptions = [
    { value: '', label: 'Todos los motores' },
    ...motores.map((m: MotorData) => ({ value: m.nombre, label: m.nombre })),
  ];

  const severidadOptions = [
    { value: '', label: 'Todas las severidades' },
    ...severidades.map((s: SeveridadData) => ({ value: s.severidad, label: s.severidad })),
  ];;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Concentrado</h1>
          <p className="text-muted-foreground mt-1">
            Vulnerabilidades agregadas por motor y severidad
          </p>
        </div>
        <Button
          variant={vistaAgrupada ? 'primary' : 'outline'}
          onClick={() => setVistaAgrupada(!vistaAgrupada)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {vistaAgrupada ? 'Vista Agrupada' : 'Vista Plana'}
        </Button>
      </div>

      {/* Total KPI */}
      <Card data-testid="total-vuln-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Total de Vulnerabilidades</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMotor ? (
            <Skeleton className="h-12 w-1/3" />
          ) : (
            <div className="text-4xl font-bold text-blue-600">{totalVulns}</div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="concentrado-tabs">
        <TabsList>
          <TabsTrigger value="motor">Por Motor ({motores.length})</TabsTrigger>
          <TabsTrigger value="severity">Por Severidad ({severidades.length})</TabsTrigger>
          <TabsTrigger value="table">Tabla Detallada</TabsTrigger>
        </TabsList>

        {/* Motor Tab */}
        <TabsContent value="motor" className="space-y-4">
          {loadingMotor ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card data-testid="motor-chart">
              <CardHeader>
                <CardTitle>Distribución por Motor/Fuente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {motores.length === 0 ? (
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                  ) : (
                    motores
                      .sort((a: MotorData, b: MotorData) => b.count - a.count)
                      .map((motor: MotorData) => {
                        const percentage = totalVulns > 0 ? (motor.count / totalVulns) * 100 : 0;
                        return (
                          <div key={motor.nombre} className="flex items-center gap-4">
                            <div className="w-32">
                              <p className="text-sm font-medium truncate">{motor.nombre}</p>
                            </div>
                            <div className="flex-1">
                              <div className="h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center px-2">
                                <span className="text-white text-xs font-bold">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="w-20 text-right">
                              <p className="text-sm font-bold">{motor.count}</p>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Severity Tab */}
        <TabsContent value="severity" className="space-y-4">
          {loadingSeveridad ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {severidades.length === 0 ? (
                <p className="col-span-full text-muted-foreground">No hay datos disponibles</p>
              ) : (
                severidades
                  .sort((a: SeveridadData, b: SeveridadData) => b.count - a.count)
                  .map((item: SeveridadData) => {
                    const percentage = totalVulns > 0 ? (item.count / totalVulns) * 100 : 0;
                    const colorClass = getSeveridadColor(item.severidad);
                    return (
                      <Card key={item.severidad} data-testid={`severity-card-${item.severidad}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{item.severidad}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground mb-2">
                            {item.count}
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colorClass}`}
                              style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {percentage.toFixed(1)}% del total
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          )}
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Tabla de Vulnerabilidades</CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={filtroFuente || ''}
                    onChange={(e) => {
                      setFiltroFuente(e.target.value || null);
                      setCurrentPage(1);
                    }}
                    options={motorOptions}
                    placeholder="Filtrar por motor..."
                  />

                  <Select
                    value={filtroSeveridad || ''}
                    onChange={(e) => {
                      setFiltroSeveridad(e.target.value || null);
                      setCurrentPage(1);
                    }}
                    options={severidadOptions}
                    placeholder="Filtrar por severidad..."
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTable ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <div>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Título</th>
                          <th className="px-4 py-2 text-left font-semibold">Severidad</th>
                          <th className="px-4 py-2 text-left font-semibold">Estado</th>
                          <th className="px-4 py-2 text-left font-semibold">Motor</th>
                          <th className="px-4 py-2 text-left font-semibold">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                              No hay vulnerabilidades con estos filtros
                            </td>
                          </tr>
                        ) : (
                          tableItems.map((item: VulnTableItem) => (
                            <tr key={item.id} className="border-t hover:bg-muted/30">
                              <td className="px-4 py-2 max-w-xs truncate font-medium">
                                {item.titulo}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeveridadBadgeColor(item.severidad)}`}>
                                  {item.severidad}
                                </span>
                              </td>
                              <td className="px-4 py-2">{item.estado}</td>
                              <td className="px-4 py-2">{item.fuente}</td>
                              <td className="px-4 py-2 text-xs">
                                {new Date(item.created_at).toLocaleDateString('es-CO')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {tablePagination && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {tablePagination.page} de {tablePagination.total_pages} ({tablePagination.total} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={currentPage === 1 || loadingTable}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          disabled={currentPage >= (tablePagination.total_pages || 1) || loadingTable}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
