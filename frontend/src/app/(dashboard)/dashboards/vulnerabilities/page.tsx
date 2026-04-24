"use client";

import { Circle, ShieldCheck } from 'lucide-react';

import { DashboardCsvExportButton } from '@/components/dashboard/DashboardCsvExportButton';
import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { Card, CardContent, CardHeader, CardTitle, PageHeader, PageWrapper, StatCard } from '@/components/ui';
import { useMyDashboardVisibility } from '@/hooks/useDashboardConfigs';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';
import { useDashboardVulnerabilities } from '@/hooks/useAppDashboardPanels';

export default function VulnerabilitiesDashboardPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardVulnerabilities(filters);
  const { data: visibility } = useMyDashboardVisibility('vulnerabilities');
  const isVisible = (widgetId: string) =>
    visibility?.widgets?.[widgetId]?.visible ?? visibility?.default_visible ?? true;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Vulnerabilidades"
        description="Severidad, estado y cumplimiento SLA por jerarquía."
        action={
          <DashboardCsvExportButton
            apiPath="/vulnerabilidads/export.csv"
            filename="vulnerabilidades.csv"
            label="Exportar hallazgos"
          />
        }
      />
      <HierarchyFiltersBar
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        savedModulo={DASHBOARD_FILTER_MODULO.vulnerabilities}
        onApplyFilters={applyFilters}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isVisible('dashboard.vulnerabilities.card.total') && (
          <StatCard
            label="Total"
            value={data?.total_vulnerabilities ?? (isLoading ? '…' : 0)}
            icon={ShieldCheck}
            iconColor="text-rose-400"
            iconBg="bg-rose-500/10"
          />
        )}
        {isVisible('dashboard.vulnerabilities.card.overdue') && (
          <StatCard
            label="Vencidas SLA"
            value={data?.overdue_count ?? (isLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
          />
        )}
        {isVisible('dashboard.vulnerabilities.card.sla_green') && (
          <StatCard
            label="SLA verde"
            value={data?.sla_status.green ?? (isLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
          />
        )}
      </div>
      {isVisible('dashboard.vulnerabilities.panel.by_severity') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por severidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(data?.by_severity ?? {}).map(([sev, count]) => (
              <div key={sev} className="flex justify-between">
                <span>{sev}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
