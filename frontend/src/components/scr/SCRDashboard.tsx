'use client';

import { useEffect, useState } from 'react';
import { Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { formatDuration, formatUsd, repoName } from '@/lib/scr-format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';

interface KPIData {
  total_scans: number;
  critical_findings: number;
  high_findings: number;
  scanned_repos: number;
  avg_remediation_days: number;
}

interface CostData {
  total_cost: number;
  tokens_consumed: number;
  avg_cost_per_scan: number;
  incremental_savings: number;
  scans_count: number;
  cost_by_agent: Array<{
    agent: string;
    calls: number;
    tokens: number;
    cost: number;
    avg_duration_ms: number;
  }>;
  recent_scans: Array<{
    review_id: string;
    title: string;
    repository: string | null;
    tokens: number;
    cost: number;
    duration_ms: number;
    completed_at: string | null;
  }>;
}

interface TopRepo {
  name: string;
  organization: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  last_scan: string;
}

const emptyCostData: CostData = {
  total_cost: 0,
  tokens_consumed: 0,
  avg_cost_per_scan: 0,
  incremental_savings: 0,
  scans_count: 0,
  cost_by_agent: [],
  recent_scans: [],
};

export function SCRDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [topRepos, setTopRepos] = useState<TopRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const [kpisRes, costRes, reposRes] = await Promise.allSettled([
          api.get(`/scr/dashboard/kpis?days=${period}`),
          api.get(`/scr/dashboard/costs?days=${period}`),
          api.get('/scr/dashboard/top-repos'),
        ]);

        if (kpisRes.status === 'fulfilled' && kpisRes.value.data.status === 'success') {
          setKpiData(kpisRes.value.data.data);
        }
        if (costRes.status === 'fulfilled' && costRes.value.data.status === 'success') {
          setCostData({ ...emptyCostData, ...costRes.value.data.data });
        } else {
          setCostData(emptyCostData);
        }
        if (reposRes.status === 'fulfilled' && reposRes.value.data.status === 'success') {
          setTopRepos(reposRes.value.data.data);
        }
      } catch (error) {
        toast.error('Error loading dashboard data');
        logger.error('scr.dashboard.load_failed', { error: String(error) });
      } finally {
        setIsLoading(false);
      }
    }

    void fetchDashboardData();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="activity">Actividad y Riesgo</TabsTrigger>
          <TabsTrigger value="costs">Análisis de Costos</TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Actividad y Riesgo */}
        <TabsContent value="activity" className="space-y-6">
          {/* Period Selector */}
          <div className="flex gap-2">
            {(['7', '30', '90'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Últimos {p} días
              </button>
            ))}
          </div>

          {/* KPI Cards */}
          {kpiData && (
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Escaneos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.total_scans}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Hallazgos Críticos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{kpiData.critical_findings}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Hallazgos Altos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{kpiData.high_findings}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Repos Escaneados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.scanned_repos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo Promedio (días)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.avg_remediation_days}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Repos Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Top 5 Repositorios con Más Hallazgos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left py-2 px-2">Repositorio</th>
                      <th className="text-left py-2 px-2">Org</th>
                      <th className="text-center py-2 px-2 text-red-600">Críticos</th>
                      <th className="text-center py-2 px-2 text-orange-600">Altos</th>
                      <th className="text-center py-2 px-2 text-yellow-600">Medios</th>
                      <th className="text-center py-2 px-2 text-green-600">Bajos</th>
                      <th className="text-left py-2 px-2">Última Revisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRepos.map((repo, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-mono text-xs">{repo.name}</td>
                        <td className="py-2 px-2">{repo.organization}</td>
                        <td className="text-center py-2 px-2 font-semibold text-red-600">{repo.critical}</td>
                        <td className="text-center py-2 px-2 font-semibold text-orange-600">{repo.high}</td>
                        <td className="text-center py-2 px-2 font-semibold text-yellow-600">{repo.medium}</td>
                        <td className="text-center py-2 px-2 font-semibold text-green-600">{repo.low}</td>
                        <td className="py-2 px-2 text-xs">{new Date(repo.last_scan).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña 2: Análisis de Costos */}
        <TabsContent value="costs" className="space-y-6">
          <div className="flex gap-2">
            {(['7', '30', '90'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Últimos {p} días
              </button>
            ))}
          </div>

          {/* Cost KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gasto Total (USD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUsd(costData?.total_cost ?? 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tokens Consumidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(costData?.tokens_consumed ?? 0).toLocaleString('es-MX')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Costo/Escaneo Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUsd(costData?.avg_cost_per_scan ?? 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ahorro Incremental Est.</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatUsd(costData?.incremental_savings ?? 0)}</div>
              </CardContent>
            </Card>
          </div>

          {(costData?.cost_by_agent.length ?? 0) === 0 && (costData?.recent_scans.length ?? 0) === 0 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Sin telemetría de costos todavía</CardTitle>
                <CardDescription>
                  Los costos aparecerán cuando se ejecuten escaneos con agentes LLM y el proveedor reporte tokens consumidos.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Costo por agente</CardTitle>
                <CardDescription>Distribución por Inspector, Detective y Fiscal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-2 py-2 text-left">Agente</th>
                        <th className="px-2 py-2 text-right">Llamadas</th>
                        <th className="px-2 py-2 text-right">Tokens</th>
                        <th className="px-2 py-2 text-right">Costo</th>
                        <th className="px-2 py-2 text-right">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(costData?.cost_by_agent ?? []).map((row) => (
                        <tr key={row.agent} className="border-b">
                          <td className="px-2 py-2 capitalize">{row.agent}</td>
                          <td className="px-2 py-2 text-right">{row.calls}</td>
                          <td className="px-2 py-2 text-right">{row.tokens.toLocaleString('es-MX')}</td>
                          <td className="px-2 py-2 text-right">{formatUsd(row.cost)}</td>
                          <td className="px-2 py-2 text-right">{formatDuration(row.avg_duration_ms)}</td>
                        </tr>
                      ))}
                      {(costData?.cost_by_agent.length ?? 0) === 0 && (
                        <tr>
                          <td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">
                            Sin datos por agente en el periodo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimos escaneos con costo</CardTitle>
                <CardDescription>Tokens y costo estimado persistidos por revisión.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-2 py-2 text-left">Escaneo</th>
                        <th className="px-2 py-2 text-left">Repo</th>
                        <th className="px-2 py-2 text-right">Tokens</th>
                        <th className="px-2 py-2 text-right">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(costData?.recent_scans ?? []).map((row) => (
                        <tr key={row.review_id} className="border-b">
                          <td className="px-2 py-2">{row.title}</td>
                          <td className="px-2 py-2 text-muted-foreground">{repoName(row.repository)}</td>
                          <td className="px-2 py-2 text-right">{row.tokens.toLocaleString('es-MX')}</td>
                          <td className="px-2 py-2 text-right">{formatUsd(row.cost)}</td>
                        </tr>
                      ))}
                      {(costData?.recent_scans.length ?? 0) === 0 && (
                        <tr>
                          <td colSpan={4} className="px-2 py-8 text-center text-muted-foreground">
                            Sin escaneos con costo registrado en el periodo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cómo se calcula</CardTitle>
              <CardDescription>
                Se usa el consumo de tokens reportado por cada proveedor LLM y la tarifa estimada configurada por proveedor.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
