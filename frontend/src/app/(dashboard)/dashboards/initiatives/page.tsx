"use client";

import { CheckSquare, Circle } from 'lucide-react';

import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { PageHeader, PageWrapper, StatCard } from '@/components/ui';
import { useDashboardInitiatives } from '@/hooks/useAppDashboardPanels';
import { useMyDashboardVisibility } from '@/hooks/useDashboardConfigs';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';

export default function InitiativesDashboardPage() {
  const { filters, updateFilter, clearFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardInitiatives(filters);
  const { data: visibility } = useMyDashboardVisibility('initiatives');
  const isVisible = (widgetId: string) =>
    visibility?.widgets?.[widgetId]?.visible ?? visibility?.default_visible ?? true;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Dashboard · Iniciativas" description="Seguimiento de avance de iniciativas." />
      <HierarchyFiltersBar filters={filters} onChange={updateFilter} onClear={clearFilters} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {isVisible('dashboard.initiatives.card.total') && (
          <StatCard
            label="Total"
            value={data?.total_initiatives ?? (isLoading ? '…' : 0)}
            icon={CheckSquare}
            iconColor="text-blue-400"
            iconBg="bg-blue-500/10"
          />
        )}
        {isVisible('dashboard.initiatives.card.in_progress') && (
          <StatCard
            label="En progreso"
            value={data?.in_progress ?? (isLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
          />
        )}
        {isVisible('dashboard.initiatives.card.completed') && (
          <StatCard
            label="Completadas"
            value={data?.completed ?? (isLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
          />
        )}
        {isVisible('dashboard.initiatives.card.completion_percentage') && (
          <StatCard
            label="% Completitud"
            value={`${data?.completion_percentage ?? (isLoading ? '…' : 0)}%`}
            icon={CheckSquare}
            iconColor="text-violet-400"
            iconBg="bg-violet-500/10"
          />
        )}
      </div>
    </PageWrapper>
  );
}
