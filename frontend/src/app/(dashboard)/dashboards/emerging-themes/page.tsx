"use client";

import { AlertCircle, Circle } from 'lucide-react';

import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { PageHeader, PageWrapper, StatCard } from '@/components/ui';
import { useDashboardEmergingThemes } from '@/hooks/useAppDashboardPanels';
import { useMyDashboardVisibility } from '@/hooks/useDashboardConfigs';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';

export default function EmergingThemesDashboardPage() {
  const { filters, updateFilter, clearFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardEmergingThemes(filters);
  const { data: visibility } = useMyDashboardVisibility('emerging-themes');
  const isVisible = (widgetId: string) =>
    visibility?.widgets?.[widgetId]?.visible ?? visibility?.default_visible ?? true;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Temas Emergentes"
        description="Visibilidad de temas activos y estancados."
      />
      <HierarchyFiltersBar filters={filters} onChange={updateFilter} onClear={clearFilters} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isVisible('dashboard.emerging-themes.card.total') && (
          <StatCard
            label="Total temas"
            value={data?.total_themes ?? (isLoading ? '…' : 0)}
            icon={AlertCircle}
            iconColor="text-orange-400"
            iconBg="bg-orange-500/10"
          />
        )}
        {isVisible('dashboard.emerging-themes.card.active') && (
          <StatCard
            label="Activos"
            value={data?.active ?? (isLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
          />
        )}
        {isVisible('dashboard.emerging-themes.card.unmoved_7_days') && (
          <StatCard
            label="Sin movimiento 7 días"
            value={data?.unmoved_7_days ?? (isLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
          />
        )}
      </div>
    </PageWrapper>
  );
}
