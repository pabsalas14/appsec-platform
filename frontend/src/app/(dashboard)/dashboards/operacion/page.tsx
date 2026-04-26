'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
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
}

interface OperacionData {
  items: Release[];
  count: number;
}

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
      const response = await apiClient.get('/api/v1/dashboard/releases-table');
      return response.data.data as OperacionData;
    },
  });

  const { data: tercerosData, isLoading: tercerosLoading } = useQuery({
    queryKey: ['dashboard-operacion-terceros'],
    queryFn: async () => {
      logger.info('dashboard.operacion.terceros.fetch');
      const response = await apiClient.get('/api/v1/dashboard/releases-terceros');
      return response.data;
    },
  });

  const { data: releaseDetail } = useQuery({
    queryKey: ['dashboard-release-detail', selectedRelease?.id],
    queryFn: async () => {
      if (!selectedRelease?.id) return null;
      logger.info('dashboard.release.detail.fetch', { release_id: selectedRelease.id });
      const response = await apiClient.get(`/api/v1/dashboard/release/${selectedRelease.id}/detail`);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="total-releases-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total de Liberaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {releasesLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">{releasesData?.count || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estados Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            {releasesLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-3xl font-bold">
                {Object.keys(statusDistribution).length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Última Actualización</CardTitle>
          </CardHeader>
          <CardContent>
            {releasesLoading ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="text-sm text-muted-foreground">
                {releasesData?.items?.[0]?.created_at
                  ? new Date(releasesData.items[0].created_at).toLocaleDateString('es-ES')
                  : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="operacion-tabs">
        <TabsList>
          <TabsTrigger value="releases">Liberaciones ({releasesData?.count || 0})</TabsTrigger>
          <TabsTrigger value="terceros">Terceros ({tercerosData?.data?.total || 0})</TabsTrigger>
        </TabsList>

        {/* LIBERACIONES TAB */}
        <TabsContent value="releases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Listado de Liberaciones</CardTitle>
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
                  <div className="flex gap-2 mb-4">
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

                  {/* Tabla */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th 
                            className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-muted-foreground/10"
                            onClick={() => handleSort('nombre')}
                          >
                            <div className="flex items-center gap-2">
                              Nombre
                              <SortIcon column="nombre" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-muted-foreground/10"
                            onClick={() => handleSort('version')}
                          >
                            <div className="flex items-center gap-2">
                              Versión
                              <SortIcon column="version" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-muted-foreground/10"
                            onClick={() => handleSort('estado_actual')}
                          >
                            <div className="flex items-center gap-2">
                              Estado
                              <SortIcon column="estado_actual" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">JIRA</th>
                          <th 
                            className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-muted-foreground/10"
                            onClick={() => handleSort('created_at')}
                          >
                            <div className="flex items-center gap-2">
                              Creación
                              <SortIcon column="created_at" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAndFilteredReleases.map((release) => (
                          <tr key={release.id} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3">{release.nombre}</td>
                            <td className="px-4 py-3">{release.version}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {release.estado_actual}
                              </span>
                            </td>
                            <td className="px-4 py-3">
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
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {release.created_at ? new Date(release.created_at).toLocaleDateString('es-ES') : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRelease(release)}
                              >
                                Ver detalles
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
              <CardTitle className="text-lg">Liberaciones de Terceros</CardTitle>
            </CardHeader>
            <CardContent>
              {tercerosLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tercerosData?.data?.items && tercerosData.data.items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Empresa/Nombre</th>
                        <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold">Estado</th>
                        <th className="px-4 py-3 text-left font-semibold">Fecha Creación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tercerosData.data.items.map((tercero) => (
                        <tr key={tercero.id} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-3">
                            {tercero.nombre_empresa || tercero.nombre || '—'}
                          </td>
                          <td className="px-4 py-3">{tercero.tipo || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                              {tercero.estado || 'Planificada'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {tercero.created_at ? new Date(tercero.created_at).toLocaleDateString('es-ES') : '—'}
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
          <div className="w-full md:w-96 bg-white dark:bg-slate-950 shadow-xl rounded-t-lg max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-950 border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Detalles de Release</h3>
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
                    <p className="font-medium">{releaseDetail.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">VERSIÓN</p>
                    <p className="font-medium">{releaseDetail.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">ESTADO</p>
                    <p className="font-medium">{releaseDetail.estado_actual}</p>
                  </div>
                  {releaseDetail.descripcion && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">DESCRIPCIÓN</p>
                      <p className="text-sm">{releaseDetail.descripcion}</p>
                    </div>
                  )}
                  {releaseDetail.jira_referencia && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">JIRA</p>
                      <a 
                        href={`https://jira.example.com/browse/${releaseDetail.jira_referencia}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        {releaseDetail.jira_referencia}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">CREACIÓN</p>
                    <p className="text-sm">
                      {releaseDetail.created_at ? new Date(releaseDetail.created_at).toLocaleDateString('es-ES') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">ÚLTIMA ACTUALIZACIÓN</p>
                    <p className="text-sm">
                      {releaseDetail.updated_at ? new Date(releaseDetail.updated_at).toLocaleDateString('es-ES') : '—'}
                    </p>
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
