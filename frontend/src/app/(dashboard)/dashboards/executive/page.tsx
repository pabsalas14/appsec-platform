"use client";

import { AlertTriangle, ShieldCheck } from 'lucide-react';

import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { Card, CardContent, PageHeader, PageWrapper, StatCard } from '@/components/ui';
import { useDashboardExecutive } from '@/hooks/useAppDashboardPanels';
import { useMyDashboardVisibility } from '@/hooks/useDashboardConfigs';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';

export default function ExecutiveDashboardPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardExecutive(filters);
  const { data: visibility } = useMyDashboardVisibility('executive');
  const isVisible = (widgetId: string) =>
    visibility?.widgets?.[widgetId]?.visible ?? visibility?.default_visible ?? true;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Dashboard · Ejecutivo" description="KPIs estratégicos de AppSec." />
      <HierarchyFiltersBar
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        savedModulo={DASHBOARD_FILTER_MODULO.executive}
        onApplyFilters={applyFilters}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isVisible('dashboard.executive.card.total_vulnerabilities') && (
          <StatCard
            label="Vulnerabilidades totales"
            value={data?.kpis.total_vulnerabilities ?? (isLoading ? '…' : 0)}
            icon={ShieldCheck}
            iconColor="text-rose-400"
            iconBg="bg-rose-500/10"
          />
        )}
        {isVisible('dashboard.executive.card.critical_count') && (
          <StatCard
            label="Vulnerabilidades críticas"
            value={data?.kpis.critical_count ?? (isLoading ? '…' : 0)}
            icon={AlertTriangle}
            iconColor="text-orange-400"
            iconBg="bg-orange-500/10"
          />
        )}
        {isVisible('dashboard.executive.card.sla_compliance') && (
          <StatCard
            label="SLA compliance"
            value={`${data?.kpis.sla_compliance ?? (isLoading ? '…' : 0)}%`}
            icon={ShieldCheck}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
          />
        )}
      </div>
      {isVisible('dashboard.executive.panel.risk_level') && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Nivel de riesgo: <span className="font-medium text-foreground">{data?.risk_level ?? '—'}</span>
          </CardContent>
        </Card>
      )}
      {isVisible('dashboard.executive.panel.heatmap') && data?.by_severity && (
        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm font-medium">Heatmap por severidad (F1 — inventario de exposición)</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-sm">
              {['Critica', 'Alta', 'Media', 'Baja', 'Informativa'].map((k) => {
                const n = data.by_severity?.[k] ?? 0;
                const max = Math.max(1, ...Object.values(data.by_severity ?? {}));
                const intensity = max > 0 ? Math.min(1, 0.15 + (n / max) * 0.85) : 0.1;
                return (
                  <div
                    key={k}
                    className="rounded-md border border-border p-3"
                    style={{
                      backgroundColor: `color-mix(in srgb, hsl(var(--primary)) ${Math.round(intensity * 100)}%, transparent)`,
                    }}
                  >
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="text-lg font-semibold tabular-nums">{isLoading ? '…' : n}</div>
                  </div>
                );
              })}
            </div>
            {data?.trend?.new_vulnerabilities_7d != null && (
              <p className="text-xs text-muted-foreground">
                Tendencia: {data.trend.new_vulnerabilities_7d} nuevas (últimos 7 días)
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
