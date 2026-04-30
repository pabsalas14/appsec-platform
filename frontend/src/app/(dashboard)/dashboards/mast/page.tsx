'use client';

import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Badge,
} from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { useAplicacionMovils } from '@/hooks/useAplicacionMovils';
import { useHallazgoMASTs } from '@/hooks/useHallazgoMASTs';
import { useEjecucionMASTs } from '@/hooks/useEjecucionMASTs';
import {
  MastApplicationCard,
  MastFindingsTable,
  MastDetailPanel,
} from './components';

type SeverityFilter = 'Todos' | 'Critica' | 'Alta' | 'Media' | 'Baja';
type PlatformFilter = 'Todos' | 'iOS' | 'Android';

export default function MastDashboardPage() {
  const { data: apps, isLoading: appsLoading } = useAplicacionMovils();
  const { data: findings, isLoading: findingsLoading } = useHallazgoMASTs();
  const { data: executions, isLoading: executionsLoading } = useEjecucionMASTs();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilter>('Todos');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('Todos');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Get selected app details
  const selectedApp = useMemo(() => {
    return apps?.find((a) => a.id === selectedAppId);
  }, [apps, selectedAppId]);

  // Get executions and findings for selected app
  const selectedAppExecutions = useMemo(() => {
    if (!selectedAppId || !executions) return [];
    return executions.filter((e) => e.aplicacion_movil_id === selectedAppId);
  }, [selectedAppId, executions]);

  const selectedAppFindings = useMemo(() => {
    if (!selectedAppId || !findings) return [];
    const execIds = selectedAppExecutions.map((e) => e.id);
    return findings.filter((f) => execIds.includes(f.ejecucion_mast_id));
  }, [selectedAppId, findings, selectedAppExecutions]);

  // Filter applications
  const filteredApps = useMemo(() => {
    if (!apps) return [];
    let result = apps;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.nombre.toLowerCase().includes(q) ||
          app.bundle_id.toLowerCase().includes(q) ||
          app.plataforma.toLowerCase().includes(q),
      );
    }

    // Platform filter
    if (selectedPlatform !== 'Todos') {
      result = result.filter((app) => app.plataforma === selectedPlatform);
    }

    return result;
  }, [apps, searchQuery, selectedPlatform]);

  // Filter findings by severity
  const filteredFindings = useMemo(() => {
    if (!selectedAppFindings) return [];
    if (selectedSeverity === 'Todos') return selectedAppFindings;
    return selectedAppFindings.filter((f) => f.severidad === selectedSeverity);
  }, [selectedAppFindings, selectedSeverity]);

  // Statistics
  const stats = useMemo(() => {
    if (!apps || !findings) return { totalApps: 0, totalFindings: 0, criticals: 0 };

    const totalFindings = findings.length;
    const criticals = findings.filter((f) => f.severidad === 'Critica').length;

    return {
      totalApps: apps.length,
      totalFindings,
      criticals,
    };
  }, [apps, findings]);

  const isLoading = appsLoading || findingsLoading || executionsLoading;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MAST</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Mobile Application Security Testing
            </p>
          </div>
          <Button className="gap-2 md:w-auto w-full">
            <Plus className="h-4 w-4" />
            Nueva Aplicación
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-hover border-b-4 border-slate-500 p-5 rounded-xl">
            <div className="text-3xl font-bold">{stats.totalApps}</div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Aplicaciones</p>
          </div>
          <div className="glass-hover border-b-4 border-amber-500 p-5 rounded-xl">
            <div className="text-3xl font-bold text-amber-500">{stats.totalFindings}</div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500/80 mt-1">Hallazgos</p>
          </div>
          <div className="glass-hover border-b-4 border-rose-500 p-5 rounded-xl">
            <div className="text-3xl font-bold text-rose-500">{stats.criticals}</div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500/80 mt-1">Críticas</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar app…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Platform Filter */}
            <Select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as PlatformFilter)}
              options={[
                { value: 'Todos', label: 'Todas las plataformas' },
                { value: 'iOS', label: 'iOS' },
                { value: 'Android', label: 'Android' },
              ]}
            />

            {/* Severity Filter (only when app is selected) */}
            {selectedAppId && (
              <Select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as SeverityFilter)}
                options={[
                  { value: 'Todos', label: 'Todas las severidades' },
                  { value: 'Critica', label: 'Crítica' },
                  { value: 'Alta', label: 'Alta' },
                  { value: 'Media', label: 'Media' },
                  { value: 'Baja', label: 'Baja' },
                ]}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Aplicaciones Móviles</CardTitle>
                <Badge variant="outline">{filteredApps.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <p className="text-sm text-muted-foreground">
                    {apps?.length === 0
                      ? 'Sin aplicaciones registradas'
                      : 'Sin aplicaciones que coincidan con los filtros'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredApps.map((app) => {
                    const appExecs = executions?.filter(
                      (e) => e.aplicacion_movil_id === app.id,
                    ) ?? [];
                    const appFindings = findings?.filter((f) => {
                      const execIds = appExecs.map((e) => e.id);
                      return execIds.includes(f.ejecucion_mast_id);
                    }) ?? [];

                    return (
                      <MastApplicationCard
                        key={app.id}
                        app={app}
                        executions={appExecs}
                        findings={appFindings}
                        selected={selectedAppId === app.id}
                        onClick={() => setSelectedAppId(app.id)}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Findings Detail */}
        <div>
          {selectedAppId ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Hallazgos Detectados</CardTitle>
                  <Badge variant="outline">{filteredFindings.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {selectedAppFindings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-xs text-center text-emerald-500 font-medium">
                      Sin hallazgos 🎉
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <MastFindingsTable
                      findings={filteredFindings}
                      onFindingClick={() => {}}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-xs text-center text-muted-foreground">
                  Selecciona una aplicación para ver los hallazgos
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <MastDetailPanel
        app={selectedApp}
        executions={selectedAppExecutions}
        findings={selectedAppFindings}
        isLoading={isLoading}
        onClose={() => setSelectedAppId(null)}
      />
    </div>
  );
}
