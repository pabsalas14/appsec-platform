'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/radix-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { KPICard, TrendChart, SeverityChip } from '@/components/charts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

// Type definitions
interface TeamResumenResponse {
  total_equipos: number;
  promedio_vulns_por_equipo: number;
  equipos_en_riesgo: number;
  applied_filters: Record<string, string>;
}

interface TeamDistribucionResponse {
  distribucion: Record<string, number>;
  total: number;
  applied_filters: Record<string, string>;
}

interface TeamTableRow {
  user_id: string;
  email: string;
  full_name: string;
  total_vulns: number;
  open_vulns: number;
  closed_vulns: number;
  closure_rate: number;
  vulns_en_riesgo: number;
  status: string;
}

interface TeamTablaResponse {
  data: TeamTableRow[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  meta?: {
    applied_filters: Record<string, string>;
  };
}

interface AnalystDetail {
  user: { id: string; email: string; role: string };
  vulns_asignadas: { id: string; titulo: string | null; severidad: string; estado: string; fuente: string; created_at: string | null }[];
  historico: { period: string; count: number }[];
}

type SortField = 'total' | 'email' | 'riesgo';
type SortOrder = 'asc' | 'desc';

export default function TeamDashboardPage() {
  // State for sorting and filtering
  const [sortBy, setSortBy] = useState<SortField>('total');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalyst, setSelectedAnalyst] = useState<TeamTableRow | null>(null);

  // Fetch summary data
  const { data: resumen, isLoading: resumenLoading } = useQuery({
    queryKey: ['dashboard-team-resumen'],
    queryFn: async () => {
      logger.info('dashboard.team.resumen.fetch');
      const response = await apiClient.get<{ data: TeamResumenResponse }>(
        '/api/v1/dashboard/team/resumen'
      );
      return response.data.data;
    },
  });

  // Fetch distribution data
  const { data: distribucion, isLoading: distribucionLoading } = useQuery({
    queryKey: ['dashboard-team-distribucion'],
    queryFn: async () => {
      logger.info('dashboard.team.distribucion.fetch');
      const response = await apiClient.get<{ data: TeamDistribucionResponse }>(
        '/api/v1/dashboard/team/distribucion'
      );
      return response.data.data;
    },
  });

  // Fetch table data
  const { data: tablaResponse, isLoading: tablaLoading } = useQuery({
    queryKey: ['dashboard-team-tabla', currentPage, pageSize, sortBy, sortOrder],
    queryFn: async () => {
      logger.info('dashboard.team.tabla.fetch', {
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      const response = await apiClient.get<{ data: TeamTablaResponse }>(
        '/api/v1/dashboard/team/tabla',
        {
          params: {
            page: currentPage,
            page_size: pageSize,
            sort_by: sortBy,
            sort_order: sortOrder,
          },
        }
      );
      return response.data.data;
    },
  });

  // Fetch analyst detail on row click
  const { data: analystDetail, isLoading: analystLoading } = useQuery({
    queryKey: ['team-detail', selectedAnalyst?.user_id],
    queryFn: async () => {
      logger.info('dashboard.team.analyst_detail.fetch', { user_id: selectedAnalyst?.user_id });
      const response = await apiClient.get<{ data: AnalystDetail }>(
        `/api/v1/dashboard/team-detail/${selectedAnalyst!.user_id}`
      );
      return response.data.data;
    },
    enabled: !!selectedAnalyst,
  });

  // Filter team data based on search term
  const filteredTeamData = useMemo(() => {
    if (!tablaResponse?.data) return [];
    return tablaResponse.data.filter(
      (team) =>
        team.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tablaResponse?.data, searchTerm]);

  // Prepare chart data for distribution
  const chartData = useMemo(() => {
    if (!distribucion?.distribucion) return [];
    return Object.entries(distribucion.distribucion).map(([name, value]) => ({
      name,
      value: Number(value),
      percentage: distribucion.total
        ? Math.round((Number(value) / distribucion.total) * 100)
        : 0,
    }));
  }, [distribucion]);

  // KPI Cards
  const kpiCards = [
    {
      title: 'Total Equipos',
      value: resumen?.total_equipos || 0,
      icon: <Users className="h-6 w-6" />,
      color: 'blue' as const,
    },
    {
      title: 'Promedio Vulns/Equipo',
      value: resumen?.promedio_vulns_por_equipo || 0,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'green' as const,
      suffix: ' vulns',
    },
    {
      title: 'Equipos en Riesgo',
      value: resumen?.equipos_en_riesgo || 0,
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'red' as const,
    },
  ];

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const getRiskBadgeVariant = (status: string) => {
    return status === 'En riesgo' ? 'destructive' : 'secondary';
  };

  if (resumenLoading || distribucionLoading || tablaLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Equipo</h1>
          <p className="text-muted-foreground mt-1">
            Análisis de vulnerabilidades por equipo
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Equipo</h1>
        <p className="text-muted-foreground mt-1">
          Análisis de vulnerabilidades por equipo
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={`${kpi.value}${kpi.suffix ? kpi.suffix : ''}`}
            icon={kpi.icon}
            color={kpi.color}
            trend={{
              value: 0,
              direction: 'neutral' as const,
            }}
          />
        ))}
      </div>

      {/* Distribution Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Severidad</CardTitle>
            <CardDescription>
              Total de vulnerabilidades: {distribucion?.total || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={['#ef4444','#f97316','#eab308','#22c55e','#3b82f6'][idx % 5]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Equipos y Analistas</CardTitle>
              <CardDescription>
                {tablaResponse?.pagination.total || 0} equipos en total
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-64"
              />
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 por página</SelectItem>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="25">25 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center gap-2">
                      Total Vulns
                      {getSortIcon('total')}
                    </div>
                  </TableHead>
                  <TableHead>Abiertas</TableHead>
                  <TableHead>Cerradas</TableHead>
                  <TableHead>Tasa Cierre</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('riesgo')}
                  >
                    <div className="flex items-center gap-2">
                      En Riesgo
                      {getSortIcon('riesgo')}
                    </div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeamData.length > 0 ? (
                  filteredTeamData.map((team) => (
                    <TableRow
                      key={team.user_id}
                      className={`cursor-pointer transition-colors ${selectedAnalyst?.user_id === team.user_id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedAnalyst(selectedAnalyst?.user_id === team.user_id ? null : team)}
                      data-testid={`team-row-${team.user_id}`}
                    >
                      <TableCell className="font-medium">{team.email}</TableCell>
                      <TableCell>{team.full_name}</TableCell>
                      <TableCell>{team.total_vulns}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{team.open_vulns}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{team.closed_vulns}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${team.closure_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {team.closure_rate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{team.vulns_en_riesgo}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(team.status)}>
                          {team.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No hay resultados que coincidan con tu búsqueda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {tablaResponse && tablaResponse.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Mostrando{' '}
                {(currentPage - 1) * pageSize + 1 -
                  (searchTerm ? filteredTeamData.length : 0) +
                  filteredTeamData.length}{' '}
                de {tablaResponse.pagination.total} resultados
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.max(1, currentPage - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, tablaResponse.pagination.total_pages) },
                    (_, i) => {
                      let pageNum = i + 1;
                      if (currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                      }
                      if (pageNum > tablaResponse.pagination.total_pages) {
                        return null;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === currentPage ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        tablaResponse.pagination.total_pages,
                        currentPage + 1
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    tablaResponse.pagination.total_pages
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Analyst Detail Panel */}
      {selectedAnalyst && (
        <Card className="border-l-4 border-l-blue-500" data-testid="analyst-detail-panel">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{selectedAnalyst.full_name || selectedAnalyst.email}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedAnalyst.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAnalyst(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {analystLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : analystDetail ? (
              <>
                {/* Stats rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Total Asignadas</p>
                    <p className="text-2xl font-bold">{selectedAnalyst.total_vulns}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50">
                    <p className="text-xs text-muted-foreground">Abiertas</p>
                    <p className="text-2xl font-bold text-red-600">{selectedAnalyst.open_vulns}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-xs text-muted-foreground">Cerradas</p>
                    <p className="text-2xl font-bold text-green-600">{selectedAnalyst.closed_vulns}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-xs text-muted-foreground">Tasa Cierre</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedAnalyst.closure_rate}%</p>
                  </div>
                </div>

                {/* Tendencia 6 meses */}
                {analystDetail.historico.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Actividad — últimos 6 meses</h4>
                    <TrendChart
                      data={analystDetail.historico.map((h) => ({ name: h.period, vulns: h.count }))}
                      series={[{ key: 'vulns', name: 'Vulnerabilidades', color: '#3b82f6' }]}
                      height={150}
                      showLegend={false}
                    />
                  </div>
                )}

                {/* Últimas vulnerabilidades */}
                {analystDetail.vulns_asignadas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Vulnerabilidades asignadas ({analystDetail.vulns_asignadas.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analystDetail.vulns_asignadas.slice(0, 15).map((v) => (
                        <div key={v.id} className="flex items-center gap-3 p-2 rounded border bg-background text-sm">
                          <SeverityChip severity={v.severidad} />
                          <span className="flex-1 truncate">{v.titulo || v.fuente}</span>
                          <Badge variant="outline" className="text-xs shrink-0">{v.estado}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
