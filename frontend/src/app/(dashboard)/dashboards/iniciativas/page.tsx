'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Calendar,
  CheckSquare,
  MessageCircle,
  Clock,
  ListChecks,
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

interface Initiative {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: string;
  tipo: string;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  created_at?: string;
}

interface Hito {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: string;
  porcentaje_completado: number;
  fecha_estimada?: string;
  created_at?: string;
}

interface Actualizacion {
  id: string;
  titulo: string;
  contenido: string;
  tipo_actualizacion: string;
  created_at?: string;
}

interface InitiativeDetail {
  iniciativa: Initiative;
  detalle: {
    descripcion: string;
    total_hitos: number;
    completed_hitos: number;
    avg_completion_percentage: number;
  };
  hitos: Hito[];
  actualizaciones: Actualizacion[];
  ponderacion: {
    total_hitos: number;
    completed_hitos: number;
    completion_percentage: number;
  };
}

interface InitiativesDashboardData {
  kpis: {
    total: number;
    completed: number;
    in_progress: number;
    at_risk: number;
    completion_percentage: number;
  };
  iniciativas: Initiative[];
}

type SortField = 'titulo' | 'estado' | 'fecha_inicio' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface DetailPanelProps {
  initiative: Initiative;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ initiative, onClose }) => {
  const { data: detailData, isLoading } = useQuery({
    queryKey: ['initiative-detail', initiative.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/dashboard/initiative/${initiative.id}/detail`);
      return response.data.data as InitiativeDetail;
    },
  });

  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'completada':
        return 'bg-green-50 border-green-200';
      case 'en progreso':
        return 'bg-blue-50 border-blue-200';
      case 'en riesgo':
        return 'bg-yellow-50 border-yellow-200';
      case 'no iniciada':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'completada':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'en progreso':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'en riesgo':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-full md:w-96 bg-white border-l shadow-lg overflow-y-auto z-50">
      <div className="p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded"
        >
          ✕
        </button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : detailData ? (
          <>
            <div className="flex items-start gap-3 mb-4">
              {getEstadoIcon(detailData.iniciativa.estado)}
              <div>
                <h2 className="text-2xl font-bold">{detailData.iniciativa.titulo}</h2>
                <p className="text-sm text-gray-500 mt-1">{detailData.iniciativa.tipo}</p>
              </div>
            </div>

            <div className={`p-3 rounded-lg border mb-4 ${getEstadoColor(detailData.iniciativa.estado)}`}>
              <p className="text-sm font-medium">{detailData.iniciativa.estado}</p>
            </div>

            <Tabs defaultValue="resumen" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="resumen" className="text-xs">
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="hitos" className="text-xs">
                  Hitos
                </TabsTrigger>
                <TabsTrigger value="ponderacion" className="text-xs">
                  Ponderación
                </TabsTrigger>
                <TabsTrigger value="actualizaciones" className="text-xs">
                  Actualizaciones
                </TabsTrigger>
                <TabsTrigger value="notas" className="text-xs">
                  Notas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resumen" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Descripción</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {detailData.iniciativa.descripcion || 'Sin descripción'}
                  </p>
                </div>

                {detailData.iniciativa.fecha_inicio && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha de Inicio</p>
                      <p className="text-sm font-medium">
                        {new Date(detailData.iniciativa.fecha_inicio).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}

                {detailData.iniciativa.fecha_fin_estimada && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha Fin Estimada</p>
                      <p className="text-sm font-medium">
                        {new Date(detailData.iniciativa.fecha_fin_estimada).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hitos" className="space-y-3 mt-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">
                    {detailData.detalle.completed_hitos} de {detailData.detalle.total_hitos} hitos completados
                  </p>
                  <div className="h-2 bg-gray-200 rounded mt-2">
                    <div
                      className="h-full bg-blue-600 rounded"
                      style={{
                        width: `${detailData.detalle.avg_completion_percentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {detailData.hitos.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Sin hitos registrados</p>
                  ) : (
                    detailData.hitos.map(hito => (
                      <div
                        key={hito.id}
                        className="p-3 bg-gray-50 border rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{hito.titulo}</p>
                            <p className="text-xs text-gray-500 mt-1">{hito.estado}</p>
                          </div>
                          <CheckSquare
                            className={`h-4 w-4 ${
                              hito.estado === 'Completado' ? 'text-green-600' : 'text-gray-400'
                            }`}
                          />
                        </div>
                        <div className="mt-2 h-1 bg-gray-200 rounded">
                          <div
                            className="h-full bg-green-500 rounded"
                            style={{ width: `${hito.porcentaje_completado}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ponderacion" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Total Hitos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {detailData.ponderacion.total_hitos}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">Completados</p>
                    <p className="text-2xl font-bold text-green-600">
                      {detailData.ponderacion.completed_hitos}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold">Avance Mensual</p>
                    <span className="text-lg font-bold text-blue-600">
                      {detailData.ponderacion.completion_percentage}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{
                        width: `${detailData.ponderacion.completion_percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actualizaciones" className="space-y-3 mt-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {detailData.actualizaciones.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Sin actualizaciones</p>
                  ) : (
                    detailData.actualizaciones.map(act => (
                      <div key={act.id} className="p-3 bg-gray-50 border rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{act.titulo}</p>
                            <p className="text-xs text-gray-600 mt-1">{act.contenido}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {act.created_at
                                ? new Date(act.created_at).toLocaleDateString('es-ES')
                                : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notas" className="space-y-4 mt-4">
                <textarea
                  placeholder="Agregar nota..."
                  className="w-full p-3 border rounded-lg text-sm resize-none"
                  rows={4}
                />
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Guardar Nota
                </button>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </div>
  );
};

interface TablaIniciativa {
  id: string;
  titulo: string;
  estado: string;
  propietario: string;
  porcentaje_progreso: number;
  fecha_vencimiento?: string;
  fecha_inicio?: string;
  tipo: string;
  hitos_completados: number;
  total_hitos: number;
}

interface TablaData {
  tabla: TablaIniciativa[];
  total_registros: number;
}

interface TimelineEvent {
  id: string;
  iniciativa_id: string;
  iniciativa_titulo: string;
  hito_titulo: string;
  estado: string;
  porcentaje_completado: number;
  fecha_estimada?: string;
  descripcion?: string;
}

interface TimelineData {
  timeline: TimelineEvent[];
  proximos_hitos: TimelineEvent[];
  hitos_proximos_30_dias: TimelineEvent[];
  total_hitos: number;
  hitos_completados: number;
}

interface ResumenData {
  resumen: {
    total: number;
    completadas: number;
    en_progreso: number;
    retrasadas: number;
    no_iniciadas: number;
    porcentaje_completado: number;
  };
  estadisticas: {
    tasa_finalizacion: string;
    iniciativas_atrasadas: number;
    iniciativas_en_riesgo_porcentaje: number;
  };
}

export default function InitiativesDashboardPage() {
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeTab, setActiveTab] = useState('resumen');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-initiatives'],
    queryFn: async () => {
      logger.info('dashboard.initiatives.fetch');
      const response = await apiClient.get('/api/v1/dashboard/initiatives-summary');
      return response.data.data as InitiativesDashboardData;
    },
  });

  const { data: resumenData, isLoading: resumenLoading } = useQuery({
    queryKey: ['dashboard-initiatives-resumen'],
    queryFn: async () => {
      logger.info('dashboard.initiatives.resumen.fetch');
      const response = await apiClient.get('/api/v1/dashboard/initiatives/resumen');
      return response.data.data as ResumenData;
    },
  });

  const { data: tablaData, isLoading: tablaLoading } = useQuery({
    queryKey: ['dashboard-initiatives-tabla'],
    queryFn: async () => {
      logger.info('dashboard.initiatives.tabla.fetch');
      const response = await apiClient.get('/api/v1/dashboard/initiatives/tabla');
      return response.data.data as TablaData;
    },
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['dashboard-initiatives-timeline'],
    queryFn: async () => {
      logger.info('dashboard.initiatives.timeline.fetch');
      const response = await apiClient.get('/api/v1/dashboard/initiatives/timeline');
      return response.data.data as TimelineData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard de iniciativas</span>
      </div>
    );
  }

  const sortedInitiatives = data?.iniciativas
    ? [...data.iniciativas].sort((a, b) => {
        let aVal: string | number | undefined = a[sortField];
        let bVal: string | number | undefined = b[sortField];

        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        const na = typeof aVal === 'number' ? aVal : 0;
        const nb = typeof bVal === 'number' ? bVal : 0;
        return sortOrder === 'asc' ? na - nb : nb - na;
      })
    : [];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-2">⬍</span>;
    return <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const loadingAny = isLoading || resumenLoading || tablaLoading || timelineLoading;

  return (
    <div className="flex flex-col gap-6 relative pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Iniciativas</h1>
        <p className="text-muted-foreground mt-1">Seguimiento, hitos y avance de iniciativas</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resumenLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{resumenData?.resumen.total ?? 0}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resumenLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">
                    {resumenData?.resumen.completadas ?? 0}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  En progreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resumenLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-blue-600">
                    {resumenData?.resumen.en_progreso ?? 0}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Retrasadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resumenLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-amber-600">
                    {resumenData?.resumen.retrasadas ?? 0}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {resumenData?.estadisticas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Tasa de finalización: {resumenData.estadisticas.tasa_finalizacion}</p>
                <p>Iniciativas atrasadas: {resumenData.estadisticas.iniciativas_atrasadas}</p>
                <p>
                  En riesgo (%): {resumenData.estadisticas.iniciativas_en_riesgo_porcentaje}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tabla" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tabla de iniciativas</CardTitle>
            </CardHeader>
            <CardContent>
              {tablaLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Hitos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tablaData?.tabla ?? []).map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.titulo}</TableCell>
                        <TableCell>{row.estado}</TableCell>
                        <TableCell>{row.porcentaje_progreso}%</TableCell>
                        <TableCell>
                          {row.hitos_completados}/{row.total_hitos}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6 space-y-4">
          {timelineLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Próximos hitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(timelineData?.proximos_hitos ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin eventos próximos</p>
                  ) : (
                    timelineData!.proximos_hitos.map(ev => (
                      <div key={ev.id} className="border rounded-lg p-3 text-sm">
                        <p className="font-medium">{ev.iniciativa_titulo}</p>
                        <p className="text-muted-foreground">{ev.hito_titulo}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Línea de tiempo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(timelineData?.timeline ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin eventos</p>
                  ) : (
                    timelineData!.timeline.map(ev => (
                      <div key={ev.id} className="border rounded-lg p-3 text-sm">
                        <p className="font-medium">{ev.iniciativa_titulo}</p>
                        <p className="text-muted-foreground">{ev.descripcion ?? ev.estado}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="lista" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Listado</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAny && !data ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('titulo')}>
                        Título <SortIcon field="titulo" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('estado')}>
                        Estado <SortIcon field="estado" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('fecha_inicio')}>
                        Inicio <SortIcon field="fecha_inicio" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                        Alta <SortIcon field="created_at" />
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedInitiatives.map(init => (
                      <TableRow key={init.id}>
                        <TableCell className="font-medium">{init.titulo}</TableCell>
                        <TableCell>{init.estado}</TableCell>
                        <TableCell>
                          {init.fecha_inicio
                            ? new Date(init.fecha_inicio).toLocaleDateString('es-ES')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {init.created_at
                            ? new Date(init.created_at).toLocaleDateString('es-ES')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="text-primary inline-flex items-center gap-1 text-sm"
                            onClick={() => setSelectedInitiative(init)}
                          >
                            Ver <ChevronRight className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedInitiative ? (
        <DetailPanel initiative={selectedInitiative} onClose={() => setSelectedInitiative(null)} />
      ) : null}
    </div>
  );
}
