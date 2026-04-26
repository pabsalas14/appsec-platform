'use client';

import { useState, useMemo } from 'react';
import { AlertCircle, ChevronDown, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  useVulnGlobal,
  useVulnSubdireccion,
  useVulnCelula,
  useVulnRepositorioTab,
  useVulnHistorial,
  useVulnConfig,
  useVulnResumen,
} from '@/hooks/useVulnDashboard';
import { KPICard } from '@/components/dashboards/KPICard';
import { SeverityDistribution } from '@/components/dashboards/SeverityDistribution';
import { VulnerabilidadesTable } from '@/components/dashboards/VulnerabilidadesTable';
import { DrilldownLevel, TabType } from '@/types/dashboard-vuln';
import { logger } from '@/lib/logger';

/**
 * Dashboard 4: Vulnerabilidades - 4-Drill
 * 4 niveles de navegación + 9 tabs en el nivel 3
 */
export default function VulnerabilitiesDashboardPage() {
  // Estado de navegación drill-down
  const [drilldownPath, setDrilldownPath] = useState<DrilldownLevel[]>([
    { id: 'global', name: 'Global', type: 'global' },
  ]);

  // Estado de tabs y paginación en nivel 3
  const [activeTab, setActiveTab] = useState<TabType>('sast');
  const [tabPages, setTabPages] = useState<Record<TabType, number>>({
    sast: 1,
    dast: 1,
    sca: 1,
    'mast-mda': 1,
    secrets: 1,
    cds: 1,
    historial: 1,
    config: 1,
    resumen: 1,
  });

  const currentLevel = drilldownPath[drilldownPath.length - 1];
  const isLevel3 = drilldownPath.length === 4;
  const repoId = isLevel3 ? currentLevel.id : null;

  // Queries para cada nivel
  const globalQuery = useVulnGlobal();
  const subdireccionQuery = useVulnSubdireccion(drilldownPath.length >= 2 ? drilldownPath[1].id : null);
  const celulaQuery = useVulnCelula(drilldownPath.length >= 3 ? drilldownPath[2].id : null);

  // Queries para nivel 3 (tabs)
  const sastQuery = useVulnRepositorioTab(repoId, 'sast', tabPages.sast, 50);
  const dastQuery = useVulnRepositorioTab(repoId, 'dast', tabPages.dast, 50);
  const scaQuery = useVulnRepositorioTab(repoId, 'sca', tabPages.sca, 50);
  const mastMdaQuery = useVulnRepositorioTab(repoId, 'mast-mda', tabPages['mast-mda'], 50);
  const secretsQuery = useVulnRepositorioTab(repoId, 'secrets', tabPages.secrets, 50);
  const cdsQuery = useVulnRepositorioTab(repoId, 'cds', tabPages.cds, 50);
  const historialQuery = useVulnHistorial(repoId);
  const configQuery = useVulnConfig(repoId);
  const resumenQuery = useVulnResumen(repoId);

  // Mapa de queries por tab
  const tabQueries: Record<TabType, any> = {
    sast: sastQuery,
    dast: dastQuery,
    sca: scaQuery,
    'mast-mda': mastMdaQuery,
    secrets: secretsQuery,
    cds: cdsQuery,
    historial: historialQuery,
    config: configQuery,
    resumen: resumenQuery,
  };

  const currentTabQuery = tabQueries[activeTab];

  // Handlers
  const handleDrill = (level: DrilldownLevel) => {
    logger.info('dashboard.vuln.drill', { level: level.type, id: level.id });
    setDrilldownPath([...drilldownPath, level]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setDrilldownPath(drilldownPath.slice(0, index + 1));
  };

  const handleBack = () => {
    if (drilldownPath.length > 1) {
      setDrilldownPath(drilldownPath.slice(0, -1));
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handlePageChange = (page: number) => {
    setTabPages({ ...tabPages, [activeTab]: page });
  };

  // Determinar qué query y datos mostrar según el nivel actual
  const currentQuery = useMemo(() => {
    switch (drilldownPath.length) {
      case 1:
        return globalQuery;
      case 2:
        return subdireccionQuery;
      case 3:
        return celulaQuery;
      case 4:
        return currentTabQuery;
      default:
        return globalQuery;
    }
  }, [drilldownPath.length, globalQuery, subdireccionQuery, celulaQuery, currentTabQuery]);

  const isLoading = currentQuery.isLoading;
  const hasError = currentQuery.error;

  // Render de estado global
  if (globalQuery.isLoading && drilldownPath.length === 1) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Vulnerabilidades</h1>
          <p className="text-muted-foreground mt-1">Cargando...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (hasError && drilldownPath.length === 1) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar vulnerabilidades globales</span>
      </div>
    );
  }

  // ========== NIVEL 0: GLOBAL ==========
  if (drilldownPath.length === 1 && globalQuery.data) {
    const data = globalQuery.data;
    const totalBySeverity = data.by_severity || {};
    const totalByState = data.by_state || {};

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Vulnerabilidades</h1>
            <p className="text-muted-foreground mt-1">Vista global: {data.total} vulnerabilidades detectadas</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KPICard title="Total" value={data.total} />
          <KPICard title="Críticas" value={totalBySeverity['CRITICA'] || 0} color="red" />
          <KPICard title="Altas" value={totalBySeverity['ALTA'] || 0} color="orange" />
          <KPICard title="Medias" value={totalBySeverity['MEDIA'] || 0} color="yellow" />
          <KPICard title="Bajas" value={totalBySeverity['BAJA'] || 0} color="green" />
        </div>

        {/* Distribuciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SeverityDistribution data={totalBySeverity} title="Distribución por Severidad" />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(totalByState).map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between">
                    <Badge variant="outline">{state}</Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drill-down a subdirecciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Navegar por Subdirección</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Selecciona una subdirección para ver el desglose de vulnerabilidades
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDrill({
                  id: 'subdirecciones',
                  name: 'Subdirecciones',
                  type: 'subdireccion',
                })
              }
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Explorar Subdirecciones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== NIVEL 1: SUBDIRECCIÓN ==========
  if (drilldownPath.length === 2 && subdireccionQuery.data) {
    const data = subdireccionQuery.data;

    if (isLoading) {
      return (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">Cargando subdirección...</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          {drilldownPath.map((level, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Button
                variant={idx === drilldownPath.length - 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {level.name}
              </Button>
              {idx < drilldownPath.length - 1 && <ChevronDown className="h-4 w-4" />}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={handleBack} className="ml-auto">
            ← Atrás
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{drilldownPath[1].name}</h1>
          <p className="text-muted-foreground mt-1">{data.total} vulnerabilidades</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KPICard title="Total" value={data.total} />
          <KPICard title="Críticas" value={data.by_severity?.['CRITICA'] || 0} color="red" />
          <KPICard title="Altas" value={data.by_severity?.['ALTA'] || 0} color="orange" />
          <KPICard title="Medias" value={data.by_severity?.['MEDIA'] || 0} color="yellow" />
          <KPICard title="Bajas" value={data.by_severity?.['BAJA'] || 0} color="green" />
        </div>

        {/* Distribución */}
        <SeverityDistribution data={data.by_severity || {}} />

        {/* Drill-down a células */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Navegar por Célula</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDrill({
                  id: 'celulas',
                  name: 'Células',
                  type: 'celula',
                })
              }
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Explorar Células
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== NIVEL 2: CÉLULA ==========
  if (drilldownPath.length === 3 && celulaQuery.data) {
    const data = celulaQuery.data;

    if (isLoading) {
      return (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">Cargando célula...</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          {drilldownPath.map((level, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Button
                variant={idx === drilldownPath.length - 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {level.name}
              </Button>
              {idx < drilldownPath.length - 1 && <ChevronDown className="h-4 w-4" />}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={handleBack} className="ml-auto">
            ← Atrás
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{drilldownPath[2].name}</h1>
          <p className="text-muted-foreground mt-1">{data.total} vulnerabilidades</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KPICard title="Total" value={data.total} />
          <KPICard title="Críticas" value={data.by_severity?.['CRITICA'] || 0} color="red" />
          <KPICard title="Altas" value={data.by_severity?.['ALTA'] || 0} color="orange" />
          <KPICard title="Medias" value={data.by_severity?.['MEDIA'] || 0} color="yellow" />
          <KPICard title="Bajas" value={data.by_severity?.['BAJA'] || 0} color="green" />
        </div>

        {/* Distribución */}
        <SeverityDistribution data={data.by_severity || {}} />

        {/* Drill-down a repositorios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Navegar por Repositorio</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDrill({
                  id: 'repositorios',
                  name: 'Repositorios',
                  type: 'repositorio',
                })
              }
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Explorar Repositorios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== NIVEL 3: REPOSITORIO CON 9 TABS ==========
  if (drilldownPath.length === 4) {
    const currentQuery = tabQueries[activeTab];

    return (
      <div className="flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          {drilldownPath.map((level, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Button
                variant={idx === drilldownPath.length - 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {level.name}
              </Button>
              {idx < drilldownPath.length - 1 && <ChevronDown className="h-4 w-4" />}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={handleBack} className="ml-auto">
            ← Atrás
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{drilldownPath[3].name}</h1>
          <p className="text-muted-foreground mt-1">9 tabs de análisis de vulnerabilidades por motor</p>
        </div>

        {/* Tabs (9 tabs) */}
        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabType)}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1">
            <TabsTrigger value="sast" className="text-xs">
              SAST
            </TabsTrigger>
            <TabsTrigger value="dast" className="text-xs">
              DAST
            </TabsTrigger>
            <TabsTrigger value="sca" className="text-xs">
              SCA
            </TabsTrigger>
            <TabsTrigger value="mast-mda" className="text-xs">
              MAST/MDA
            </TabsTrigger>
            <TabsTrigger value="secrets" className="text-xs">
              Secrets
            </TabsTrigger>
            <TabsTrigger value="cds" className="text-xs">
              CDS
            </TabsTrigger>
            <TabsTrigger value="historial" className="text-xs">
              Historial
            </TabsTrigger>
            <TabsTrigger value="config" className="text-xs">
              Config
            </TabsTrigger>
            <TabsTrigger value="resumen" className="text-xs">
              Resumen
            </TabsTrigger>
          </TabsList>

          {/* SAST Tab */}
          <TabsContent value="sast" className="space-y-4">
            {sastQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : sastQuery.error ? (
              <div className="text-destructive">Error cargando SAST</div>
            ) : (
              <VulnerabilidadesTable
                data={sastQuery.data?.items || []}
                page={tabPages.sast}
                pageSize={50}
                total={sastQuery.data?.total || 0}
                onPageChange={handlePageChange}
                title="Vulnerabilidades SAST"
              />
            )}
          </TabsContent>

          {/* DAST Tab */}
          <TabsContent value="dast" className="space-y-4">
            {dastQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : dastQuery.error ? (
              <div className="text-destructive">Error cargando DAST</div>
            ) : (
              <VulnerabilidadesTable
                data={dastQuery.data?.items || []}
                page={tabPages.dast}
                pageSize={50}
                total={dastQuery.data?.total || 0}
                onPageChange={handlePageChange}
                title="Vulnerabilidades DAST"
              />
            )}
          </TabsContent>

          {/* SCA Tab */}
          <TabsContent value="sca" className="space-y-4">
            {scaQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : scaQuery.error ? (
              <div className="text-destructive">Error cargando SCA</div>
            ) : (
              <VulnerabilidadesTable
                data={scaQuery.data?.items || []}
                page={tabPages.sca}
                pageSize={50}
                total={scaQuery.data?.total || 0}
                onPageChange={handlePageChange}
                title="Vulnerabilidades SCA"
              />
            )}
          </TabsContent>

          {/* MAST/MDA Tab */}
          <TabsContent value="mast-mda" className="space-y-4">
            {mastMdaQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : mastMdaQuery.error ? (
              <div className="text-destructive">Error cargando MAST/MDA</div>
            ) : (
              <VulnerabilidadesTable
                data={mastMdaQuery.data?.items || []}
                page={tabPages['mast-mda']}
                pageSize={50}
                total={mastMdaQuery.data?.total || 0}
                onPageChange={handlePageChange}
                title="Vulnerabilidades MAST/MDA"
              />
            )}
          </TabsContent>

          {/* Secrets Tab */}
          <TabsContent value="secrets" className="space-y-4">
            {secretsQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : secretsQuery.error ? (
              <div className="text-destructive">Error cargando Secrets</div>
            ) : (
              <VulnerabilidadesTable
                data={secretsQuery.data?.items || []}
                page={tabPages.secrets}
                pageSize={50}
                total={secretsQuery.data?.total || 0}
                onPageChange={handlePageChange}
                title="Secretos Detectados"
              />
            )}
          </TabsContent>

          {/* CDS Tab */}
          <TabsContent value="cds" className="space-y-4">
            {cdsQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : cdsQuery.error ? (
              <div className="text-destructive">Error cargando CDS</div>
            ) : (
              <VulnerabilidadesTable
                data={cdsQuery.data?.items || []}
                page={tabPages.cds}
                pageSize={50}
                total={cdsQuery.data?.total || 0}
                onPageChange={handlePageChange}
                title="Vulnerabilidades CDS"
              />
            )}
          </TabsContent>

          {/* Historial Tab */}
          <TabsContent value="historial" className="space-y-4">
            {historialQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : historialQuery.error ? (
              <div className="text-destructive">Error cargando historial</div>
            ) : historialQuery.data ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Histórico de Vulnerabilidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {historialQuery.data.data.slice(0, 10).map((entry) => (
                      <div key={entry.fecha} className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm font-medium">{entry.fecha}</span>
                        <Badge variant="secondary">{entry.total}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded text-sm">
                    Tendencia: <Badge>{historialQuery.data.tendencia}</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-muted-foreground">Sin datos</div>
            )}
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4">
            {configQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : configQuery.error ? (
              <div className="text-destructive">Error cargando configuración</div>
            ) : configQuery.data ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Configuración del Repositorio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Repositorio:</span>
                    <span className="font-medium">{configQuery.data.repositorio_nombre}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Motores habilitados:</span>
                    <div className="flex gap-2">
                      {configQuery.data.motores_habilitados.map((motor) => (
                        <Badge key={motor} variant="outline">
                          {motor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frecuencia de scans:</span>
                    <span className="font-medium">{configQuery.data.frecuencia_scans}</span>
                  </div>
                  {configQuery.data.ultima_ejecucion_sast && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Última ejecución SAST:</span>
                      <span className="text-xs text-muted-foreground">
                        {configQuery.data.ultima_ejecucion_sast}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-muted-foreground">Sin datos</div>
            )}
          </TabsContent>

          {/* Resumen Tab */}
          <TabsContent value="resumen" className="space-y-4">
            {resumenQuery.isLoading ? (
              <Skeleton className="h-96" />
            ) : resumenQuery.error ? (
              <div className="text-destructive">Error cargando resumen</div>
            ) : resumenQuery.data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <KPICard title="Total" value={resumenQuery.data.total} />
                  <KPICard
                    title="Críticas"
                    value={resumenQuery.data.by_severity?.['CRITICA'] || 0}
                    color="red"
                  />
                  <KPICard
                    title="Altas"
                    value={resumenQuery.data.by_severity?.['ALTA'] || 0}
                    color="orange"
                  />
                  <KPICard title="SLA Vencido" value={resumenQuery.data.sla_vencido} color="red" />
                  <KPICard
                    title="SLA Próximo"
                    value={resumenQuery.data.sla_proximo_a_vencer}
                    color="yellow"
                  />
                </div>
                <SeverityDistribution
                  data={resumenQuery.data.by_severity || {}}
                  title="Distribución por Severidad"
                />
              </>
            ) : (
              <div className="text-muted-foreground">Sin datos</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}
