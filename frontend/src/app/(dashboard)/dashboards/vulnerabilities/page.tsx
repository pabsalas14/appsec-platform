"use client";

import { Circle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { DashboardCsvExportButton } from '@/components/dashboard/DashboardCsvExportButton';
import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { PageHeader, PageWrapper, StatCard } from '@/components/ui';
import { useMyDashboardVisibility } from '@/hooks/useDashboardConfigs';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { useDashboardVulnerabilities } from '@/hooks/useAppDashboardPanels';
import { appendHierarchyQuery } from '@/lib/dashboardLinks';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';
import { cn } from '@/lib/utils';

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
            href={appendHierarchyQuery('/vulnerabilidads', filters)}
          />
        )}
        {isVisible('dashboard.vulnerabilities.card.overdue') && (
          <StatCard
            label="Vencidas SLA"
            labelHint="Criterio D2 (BRD): cuenta hallazgos con SLA vencido en estatus activo, excluyendo aceptación de riesgo aprobada y excepción vigente."
            value={data?.overdue_count ?? (isLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
            href={appendHierarchyQuery('/vulnerabilidads?sla=vencida', filters)}
          />
        )}
        {isVisible('dashboard.vulnerabilities.card.sla_green') && (
          <StatCard
            label="SLA verde"
            value={data?.sla_status.green ?? (isLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
            href={appendHierarchyQuery('/vulnerabilidads', filters)}
          />
        )}
      </div>
      {isVisible('dashboard.vulnerabilities.panel.by_severity') && (
        <details open className="rounded-lg border border-border bg-card text-card-foreground">
          <summary className="cursor-pointer list-inside px-4 py-3 text-sm font-medium">
            Por severidad (clic para colapsar)
          </summary>
          <div className="space-y-1 border-t px-4 py-3 text-sm">
            {Object.entries(data?.by_severity ?? {}).map(([sev, count]) => {
              const listParam: Record<string, string> = {
                CRITICA: 'Critica',
                ALTA: 'Alta',
                MEDIA: 'Media',
                BAJA: 'Baja',
              };
              const sevParam = listParam[sev] ?? sev;
              const target = appendHierarchyQuery(
                `/vulnerabilidads?severidad=${encodeURIComponent(sevParam)}`,
                filters,
              );
              return (
                <Link
                  key={sev}
                  href={target}
                  className={cn('flex justify-between rounded-md px-1 py-0.5 -mx-1', 'hover:bg-accent/40 transition-colors')}
                >
                  <span>{sev}</span>
                  <span className="font-medium text-primary underline-offset-2 hover:underline">{count}</span>
                </Link>
              );
            })}
          </div>
        </details>
      )}
    </PageWrapper>
  );
}
