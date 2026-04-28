'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/Button';

interface Release {
  id: string;
  nombre: string;
  version: string;
  estado_actual: string;
  jira_referencia?: string;
  created_at?: string;
  servicio?: string;
  tipo_cambio?: string;
  criticidad?: string;
  responsable?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  dias_en_flujo?: number;
  sla_estado?: string;
}

interface OperacionData {
  items: Release[];
  count: number;
}

const CRITICIDAD_COLORS: Record<string, string> = {
  CRITICA: 'bg-red-500/20 text-red-700 border-red-200',
  ALTA: 'bg-orange-500/20 text-orange-700 border-orange-200',
  MEDIA: 'bg-yellow-500/20 text-yellow-700 border-yellow-200',
  BAJA: 'bg-blue-500/20 text-blue-700 border-blue-200',
};

export default function OperacionDashboardPage() {
  const [activeTab, setActiveTab] = useState('releases');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [sortBy, setSortBy] = useState<'nombre' | 'version' | 'estado_actual' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterEstado, setFilterEstado] = useState<string | null>(null);

  const { data: releasesData, isLoading: releasesLoading, error: releasesError } = useQuery({
    queryKey: ['dashboard-operacion-releases'],
    queryFn: async () => {
      logger.info('dashboard.operacion.releases.fetch');
      const response = await apiClient.get('/dashboard/releases-table');
      return response.data.data as OperacionData;
    },
  });

  const { data: tercerosData, isLoading: tercerosLoading } = useQuery({
    queryKey: ['dashboard-operacion-terceros'],
    queryFn: async () => {
      logger.info('dashboard.operacion.terceros.fetch');
      const response = await apiClient.get('/dashboard/releases-terceros');
      return response.data;
    },
  });

  const { data: releaseDetail } = useQuery({
    queryKey: ['dashboard-release-detail', selectedRelease?.id],
    queryFn: async () => {
      if (!selectedRelease?.id) return null;
      logger.info('dashboard.release.detail.fetch', { release_id: selectedRelease.id });
      const response = await apiClient.get(`/dashboard/release/${selectedRelease.id}/detail`);
      return response.data.data;
    },
    enabled: !!selectedRelease?.id,
  });

  const sortedAndFilteredReleases = useMemo(() => {
    let filtered = releasesData?.items || [];
    
    if (filterEstado) {
      filtered = filtered.filter(r => r.estado_actual === filterEstado);
    }

    return filtered.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';

      if (sortBy === 'created_at') {
        aVal = new Date(a[sortBy] || 0).getTime().toString();
        bVal = new Date(b[sortBy] || 0).getTime().toString();
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [releasesData?.items, sortBy, sortOrder, filterEstado]);

  const statusDistribution = useMemo(() => {
    return (releasesData?.items || []).reduce(
      (acc, item) => {
        acc[item.estado_actual || 'Sin Estado'] = (acc[item.estado_actual || 'Sin Estado'] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [releasesData?.items]);

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return <div className="w-4 h-4" />;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  if (releasesError) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar dashboard de operación</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Operación</h1>
          <p className="text-muted-foreground mt-1">Gestión y seguimiento de liberaciones y terceros</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="total-releases-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Activas</CardTitle>
          </CardHeader>
          <CardContent>
            {releasesLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <>
                <div className="text-3xl font-bold">{releasesData?.count || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">liberaciones en proceso</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">SLA en Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            {releasesLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <>
                <div className="text-3xl font-bold text-amber-600">2</div>
                <p className="text-xs text-muted-foreground mt-1">próximas a vencer</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Observaciones Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {releasesLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <>
                <div className="text-3xl font-bold text-orange-600">7</div>
                <p className="text-xs text-muted-foreground mt-1">requieren revisión</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Críticas en Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            {releasesLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <>
                <div className="text-3xl font-bold text-red-600">1</div>
                <p className="text-xs text-muted-foreground mt-1">máxima prioridad</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="operacion-tabs">
        <TabsList>
          <TabsTrigger value="releases">Liberaciones de Servicios ({releasesData?.count || 0})</TabsTrigger>
          <TabsTrigger value="terceros">Revisión de Terceros ({tercerosData?.data?.total || 0})</TabsTrigger>
        </TabsList>

        {/* LIBERACIONES TAB */}
        <TabsContent value="releases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Listado de Liberaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {releasesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : sortedAndFilteredReleases.length > 0 ? (
                <div className="space-y-3">
                  {/* Filtros */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {Object.keys(statusDistribution).map(estado => (
                      <Button
                        key={estado}
                        variant={filterEstado === estado ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterEstado(filterEstado === estado ? null : estado)}
                      >
                        {estado}
                      </Button>
                    ))}
                  </div>

                  {/* Tabla expandida */}
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th 
                            className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-muted-foreground/10"
                            onClick={() => handleSort('nombre')}
                          >
                            <div className="flex items-center gap-1">
                              ID JIRA
                              <SortIcon column="nombre" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">Servicio</th>
                          <th className="px-3 py-2 text-left font-semibold">Tipo Cambio</th>
                          <th className="px-3 py-2 text-center font-semibold">Criticidad</th>
                          <th 
                            className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-muted-foreground/10"
                            onClick={() => handleSort('estado_actual')}
                          >
                            <div className="flex items-center gap-1">
                              Estatus
                              <SortIcon column="estado_actual" />
                            </div>
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">Responsable</th>
                          <th className="px-3 py-2 text-center font-semibold">Fecha Inicio</th>
                          <th className="px-3 py-2 text-center font-semibold">Fecha Fin</th>
                          <th className="px-3 py-2 text-center font-semibold">Días en Flujo</th>
                          <th className="px-3 py-2 text-center font-semibold">Alerta SLA</th>
                          <th className="px-3 py-2 text-center font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAndFilteredReleases.map((release) => (
                          <tr key={release.id} className="border-t hover:bg-muted/50">
                            <td className="px-3 py-2 font-medium">
                              {release.jira_referencia ? (
                                <a 
                                  href={`https://jira.example.com/browse/${release.jira_referencia}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {release.jira_referencia}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">{release.servicio || '—'}</td>
                            <td className="px-3 py-2">{release.tipo_cambio || '—'}</td>
                            <td className="px-3 py-2 text-center">
                              {release.criticidad ? (
                                <Badge className={`${CRITICIDAD_COLORS[release.criticidad] || ''} border`}>
                                  {release.criticidad}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline">{release.estado_actual}</Badge>
                            </td>
                            <td className="px-3 py-2 text-sm">{release.responsable || '—'}</td>
                            <td className="px-3 py-2 text-center text-sm">
                              {release.fecha_inicio ? new Date(release.fecha_inicio).toLocaleDateString('es-ES') : '—'}
                            </td>
                            <td className="px-3 py-2 text-center text-sm">
                              {release.fecha_fin ? new Date(release.fecha_fin).toLocaleDateString('es-ES') : '—'}
                            </td>
                            <td className="px-3 py-2 text-center text-sm font-medium">{release.dias_en_flujo || '—'}</td>
                            <td className="px-3 py-2 text-center">
                              {release.sla_estado === 'at_risk' ? (
                                <AlertTriangle className="h-4 w-4 text-amber-600 mx-auto" />
                              ) : release.sla_estado === 'ok' ? (
                                <Badge className="bg-green-500/20 text-green-700 border-green-200">OK</Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-700 border-red-200">Vencido</Badge>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRelease(release)}
                              >
                                Detalles
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay liberaciones disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TERCEROS TAB */}
        <TabsContent value="terceros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Liberaciones de Terceros - Revisión</CardTitle>
            </CardHeader>
            <CardContent>
              {tercerosLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tercerosData?.data?.items && tercerosData.data.items.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Empresa/Nombre</th>
                        <th className="px-3 py-2 text-left font-semibold">Tipo Servicio</th>
                        <th className="px-3 py-2 text-left font-semibold">Contacto</th>
                        <th className="px-3 py-2 text-left font-semibold">Estado</th>
                        <th className="px-3 py-2 text-left font-semibold">Fecha Creación</th>
                        <th className="px-3 py-2 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tercerosData.data.items.map((tercero) => (
                        <tr key={tercero.id} className="border-t hover:bg-muted/50">
                          <td className="px-3 py-2 font-medium">
                            {tercero.nombre_empresa || tercero.nombre || '—'}
                          </td>
                          <td className="px-3 py-2">{tercero.tipo || '—'}</td>
                          <td className="px-3 py-2">{tercero.contacto || '—'}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline">
                              {tercero.estado || 'Planificada'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {tercero.created_at ? new Date(tercero.created_at).toLocaleDateString('es-ES') : '—'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRelease(tercero)}
                            >
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay revisiones de terceros disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SIDE PANEL - Release Detail */}
      {selectedRelease && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end">
          <div className="w-full md:w-96 bg-card shadow-xl rounded-t-lg max-h-[80vh] overflow-y-auto border-t border-border">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Detalles de Liberación</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRelease(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {releaseDetail ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">NOMBRE</p>
                    <p className="font-medium text-sm">{releaseDetail.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">VERSIÓN</p>
                    <p className="font-medium text-sm">{releaseDetail.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">ESTADO</p>
                    <Badge className="mt-1">{releaseDetail.estado_actual}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">CRITICIDAD</p>
                    <Badge className={`mt-1 ${CRITICIDAD_COLORS[releaseDetail.criticidad] || ''} border`}>
                      {releaseDetail.criticidad || '—'}
                    </Badge>
                  </div>
                  {releaseDetail.descripcion && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">DESCRIPCIÓN</p>
                      <p className="text-xs mt-1">{releaseDetail.descripcion}</p>
                    </div>
                  )}
                  {releaseDetail.jira_referencia && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">JIRA</p>
                      <a 
                        href={`https://jira.example.com/browse/${releaseDetail.jira_referencia}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        {releaseDetail.jira_referencia}
                      </a>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground font-semibold mb-2">PARTICIPANTES</p>
                    <p className="text-xs">Responsable: {releaseDetail.responsable || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-semibold">CRONOGRAMA</p>
                    <p className="text-xs">Inicio: {releaseDetail.fecha_inicio ? new Date(releaseDetail.fecha_inicio).toLocaleDateString('es-ES') : '—'}</p>
                    <p className="text-xs">Fin: {releaseDetail.fecha_fin ? new Date(releaseDetail.fecha_fin).toLocaleDateString('es-ES') : '—'}</p>
                  </div>
                </>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
