'use client';

import { useState } from 'react';
import { useVulnDrilldown, type HierarchyLevel } from '@/hooks/useVulnDrilldown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronRight, AlertCircle, TrendingDown, BarChart3 } from 'lucide-react';

export default function VulnerabilitiesDashboardPage() {
  const [drilldownPath, setDrilldownPath] = useState<HierarchyLevel[]>([
    { id: 'global', name: 'Global', type: 'global' },
  ]);

  const params = {
    direccion_id: drilldownPath.find(l => l.type === 'direccion')?.id || null,
    subdireccion_id: drilldownPath.find(l => l.type === 'subdireccion')?.id || null,
    gerencia_id: drilldownPath.find(l => l.type === 'gerencia')?.id || null,
    organizacion_id: drilldownPath.find(l => l.type === 'organizacion')?.id || null,
    celula_id: drilldownPath.find(l => l.type === 'celula')?.id || null,
    repositorio_id: drilldownPath.find(l => l.type === 'repositorio')?.id || null,
  };

  const { data, isLoading, error } = useVulnDrilldown(params);

  const handleDrill = (child: any) => {
    const nextType = data?.children_type;
    if (nextType) {
      const newLevel: HierarchyLevel = {
        id: child.id,
        name: child.name,
        type: nextType,
      };
      setDrilldownPath([...drilldownPath, newLevel]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setDrilldownPath(drilldownPath.slice(0, index + 1));
  };

  const currentLevel = drilldownPath[drilldownPath.length - 1];
  const levelIndex = drilldownPath.length - 1;
  const isGlobalLevel = levelIndex === 0;
  const isSubdirLevel = levelIndex === 1 && currentLevel.type === 'subdireccion';
  const isCelulaLevel = levelIndex === 4 && currentLevel.type === 'celula';

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar datos de vulnerabilidades</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Vulnerabilidades</h1>
        <p className="text-muted-foreground mt-1">
          Análisis jerárquico de vulnerabilidades por nivel organizacional
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap bg-card/30 p-3 rounded-lg border border-border/50">
        {drilldownPath.map((level, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              onClick={() => handleBreadcrumbClick(idx)}
              className={`text-sm font-medium px-3 py-1.5 rounded transition-all ${
                idx === drilldownPath.length - 1
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {level.name}
            </button>
            {idx < drilldownPath.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground/50" />}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-16" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════
              NIVEL 0: GLOBAL - 6 Engines + Summary + AI Analysis
              ═══════════════════════════════════════════════════════════ */}
          {isGlobalLevel && (
            <>
              {/* Engine Stats Cards (6 columns) */}
              {data?.summary.by_engine && (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {data.summary.by_engine.map(engine => (
                    <Card
                      key={engine.motor}
                      className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                          {engine.motor}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-3xl font-bold">{engine.count}</div>
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          +{engine.trend}%
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Summary Stats Grid */}
              {data?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Severity Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Distribución por Severidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(data.summary.by_severity).map(([severity, count]) => (
                          <div key={severity} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  severity === 'CRITICA'
                                    ? 'bg-red-600'
                                    : severity === 'ALTA'
                                      ? 'bg-orange-500'
                                      : severity === 'MEDIA'
                                        ? 'bg-yellow-500'
                                        : 'bg-blue-500'
                                }`}
                              />
                              <span className="font-medium text-sm">{severity}</span>
                            </div>
                            <span className="font-bold text-lg">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pipeline Indicators */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Indicadores del Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(data.summary.pipeline).map(([state, count]) => (
                          <div key={state} className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">{state}</p>
                            <p className="text-2xl font-bold">{count as number}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI Analysis Card (placeholder) */}
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <CardTitle className="text-sm">Análisis IA Centinela</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    En {currentLevel.name} se observa una reducción del 12% en vulnerabilidades activas respecto al mes
                    anterior, impulsada principalmente por remediaciones en SAST y DAST.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════
              NIVEL 1-4: Subdirecciones, Gerencias, Organizaciones, Células
              ═══════════════════════════════════════════════════════════ */}
          {!isGlobalLevel && !isCelulaLevel && (
            <>
              {/* Motor Breakdown Cards */}
              {data?.summary.by_engine && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {data.summary.by_engine.map(engine => (
                    <div key={engine.motor} className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{engine.motor}</p>
                      <p className="text-xl font-bold">{engine.count}</p>
                      <p className="text-xs text-green-600 mt-1">+{engine.trend}%</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Por Severidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(data?.summary.by_severity || {}).map(([severity, count]) => (
                        <div key={severity} className="flex items-center justify-between text-sm">
                          <span>{severity}</span>
                          <Badge variant="secondary">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(data?.summary.pipeline || {}).map(([state, count]) => (
                        <div key={state} className="p-2 rounded bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">{state}</p>
                          <p className="font-bold">{count as number}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════
              NIVEL 4: CÉLULAS - Repositorio Table
              ═══════════════════════════════════════════════════════════ */}
          {isCelulaLevel && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{data?.summary.total}</p>
                  </CardContent>
                </Card>
                {Object.entries(data?.summary.pipeline || {}).map(([state, count]) => (
                  <Card key={state}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground">{state}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{count as number}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Repositories Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Repositorios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Repositorio</TableHead>
                          <TableHead className="text-right">Vulns</TableHead>
                          <TableHead className="text-right">SLA</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.children.map(repo => (
                          <TableRow
                            key={repo.id}
                            onClick={() => handleDrill(repo)}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">{repo.name}</TableCell>
                            <TableCell className="text-right">{repo.count}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">On-Time</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>Activo</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════
              Children Grid (Para otros niveles - Subdirecciones, Gerencias, etc)
              ═══════════════════════════════════════════════════════════ */}
          {data?.children && data.children.length > 0 && !isCelulaLevel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {data.children_type === 'subdireccion' && 'Subdirecciones'}
                  {data.children_type === 'gerencia' && 'Gerencias'}
                  {data.children_type === 'organizacion' && 'Organizaciones'}
                  {data.children_type === 'celula' && 'Células'}
                  {data.children_type === 'repositorio' && 'Repositorios'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => handleDrill(child)}
                      className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm truncate">{child.name}</h3>
                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold">{child.count}</span>
                        <span className="text-xs text-muted-foreground">vulns</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
