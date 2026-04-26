'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KPICard,
  SemaforoSla,
  HorizontalBarRanking,
  AreaLineChart,
  GaugeChart,
  DataTable,
} from '@/components/charts';
import { Download, Shield, TrendingUp, AlertTriangle, BookOpen, Zap, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

interface ExecutiveDashboardData {
  kpis: {
    programs_advancement: number;
    critical_vulns: number;
    active_releases: number;
    emerging_themes: number;
    audits: number;
  };
  security_posture: number;
  trend_data: Array<{
    name: string;
    criticas: number;
    altas: number;
    medias: number;
    bajas: number;
  }>;
  top_repos: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  sla_status: Array<{
    status: 'ok' | 'warning' | 'critical';
    label: string;
    count: number;
    percentage: number;
  }>;
  audits: Array<{
    id: string;
    nombre: string;
    tipo: string;
    responsable: string;
    fecha: string;
    estado: string;
    hallazgos: number;
  }>;
}

export default function ExecutiveDashboardPage() {
  const [month, setMonth] = useState('current');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-executive', month],
    queryFn: async () => {
      logger.info('dashboard.executive.fetch', { month });
      const response = await apiClient.get('/api/v1/dashboard/executive');
      return response.data.data as ExecutiveDashboardData;
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg" data-testid="error-state">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar el dashboard ejecutivo</span>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Avance Programas',
      value: `${data?.kpis.programs_advancement || 0}%`,
      color: 'green' as const,
      icon: <TrendingUp className="h-6 w-6" />,
      trend: { value: 0, direction: 'up' as const },
    },
    {
      title: 'Vulnerabilidades Críticas',
      value: data?.kpis.critical_vulns || 0,
      color: 'red' as const,
      icon: <AlertTriangle className="h-6 w-6" />,
      trend: { value: 0, direction: 'down' as const },
    },
    {
      title: 'Liberaciones Activas',
      value: data?.kpis.active_releases || 0,
      color: 'blue' as const,
      icon: <Zap className="h-6 w-6" />,
      trend: { value: 0, direction: 'neutral' as const },
    },
    {
      title: 'Temas Emergentes',
      value: data?.kpis.emerging_themes || 0,
      color: 'amber' as const,
      icon: <BookOpen className="h-6 w-6" />,
      trend: { value: 0, direction: 'up' as const },
    },
    {
      title: 'Auditorías',
      value: data?.kpis.audits || 0,
      color: 'purple' as const,
      icon: <Shield className="h-6 w-6" />,
      trend: { value: 0, direction: 'neutral' as const },
    },
  ];

  const auditColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'estado', label: 'Estado' },
    { key: 'hallazgos', label: 'Hallazgos' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground mt-1">Vista general de postura de seguridad</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mes Actual</SelectItem>
              <SelectItem value="last-month">Mes Anterior</SelectItem>
              <SelectItem value="last-3">Últimos 3 Meses</SelectItem>
              <SelectItem value="last-6">Últimos 6 Meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-1/2" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((kpi, idx) => (
              <KPICard
                key={idx}
                title={kpi.title}
                value={String(kpi.value)}
                color={kpi.color}
                icon={kpi.icon}
                trend={kpi.trend}
                data-testid={`kpi-${kpi.title.toLowerCase()}`}
              />
            ))}
      </div>

      {/* Row 2: Gauge + Tendencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gauge: Postura de Seguridad */}
        <Card data-testid="gauge-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Postura de Seguridad Global</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? (
              <Skeleton className="h-48 w-48 rounded-full" />
            ) : (
              <GaugeChart
                value={data?.security_posture || 0}
                label="Score"
                showPercent
                threshold={{ warning: 60, critical: 40 }}
                size="lg"
              />
            )}
          </CardContent>
        </Card>

        {/* Tendencia 6 meses */}
        <Card data-testid="trend-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Vulnerabilidades - Tendencia</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.trend_data ? (
              <AreaLineChart
                data={data.trend_data}
                series={[
                  { key: 'criticas', name: 'Críticas', color: '#ef4444', type: 'line' },
                  { key: 'altas', name: 'Altas', color: '#f97316', type: 'line' },
                  { key: 'medias', name: 'Medias', color: '#f59e0b', type: 'area' },
                  { key: 'bajas', name: 'Bajas', color: '#84cc16', type: 'area' },
                ]}
                height={280}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Top Repos + Semáforo SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="top-repos-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top 5 Repositorios - Vulnerabilidades Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.top_repos ? (
              <HorizontalBarRanking
                data={data.top_repos}
                limit={5}
                showValues
              />
            ) : null}
          </CardContent>
        </Card>

        <Card data-testid="sla-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estado SLA - Vulnerabilidades</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : data?.sla_status ? (
              <SemaforoSla
                items={data.sla_status}
                layout="vertical"
                showPercentage
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Tabla Auditorías */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ) : data?.audits ? (
        <DataTable
          title="Auditorías Activas"
          columns={auditColumns}
          data={data.audits}
          maxRows={5}
          data-testid="audits-table"
        />
      ) : null}
    </div>
  );
}
