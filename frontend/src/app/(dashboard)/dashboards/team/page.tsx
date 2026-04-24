"use client";

import { Users } from 'lucide-react';

import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader, PageWrapper } from '@/components/ui';
import { useDashboardTeam } from '@/hooks/useAppDashboardPanels';
import { useMyDashboardVisibility } from '@/hooks/useDashboardConfigs';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';

export default function TeamDashboardPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardTeam(filters);
  const { data: visibility } = useMyDashboardVisibility('team');
  const isVisible = (widgetId: string) =>
    visibility?.widgets?.[widgetId]?.visible ?? visibility?.default_visible ?? true;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Equipo"
        description="Carga de vulnerabilidades por analista con drill-down organizacional."
      />

      <HierarchyFiltersBar
        title="Filtros organizacionales"
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        savedModulo={DASHBOARD_FILTER_MODULO.team}
        onApplyFilters={applyFilters}
      />

      {isVisible('dashboard.team.card.summary') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de equipo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isLoading ? 'Cargando...' : `Analistas visibles: ${data?.team_size ?? 0}`}
          </CardContent>
        </Card>
      )}

      {!isVisible('dashboard.team.panel.analysts') ? null : !isLoading && (data?.analysts.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin datos para este filtro"
          description="Prueba con otro nivel de jerarquía o limpia los filtros."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data?.analysts ?? []).map((item) => (
            <Card key={item.user_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Analista {item.user_id.slice(0, 8)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>Total vulnerabilidades: {item.total_vulnerabilities}</div>
                <div>Abiertas: {item.open_vulnerabilities}</div>
                <div>Cerradas: {item.closed_vulnerabilities}</div>
                <div>Tasa de cierre: {item.closure_rate}%</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
