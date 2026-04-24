"use client";

import { GitBranch } from 'lucide-react';

import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { Card, CardContent, CardHeader, CardTitle, PageHeader, PageWrapper, StatCard } from '@/components/ui';
import { useDashboardPrograms } from '@/hooks/useAppDashboardPanels';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';

export default function ProgramsDashboardPage() {
  const { filters, updateFilter, clearFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardPrograms(filters);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Dashboard · Programas" description="Consolidado de motores/programas de seguridad." />
      <HierarchyFiltersBar filters={filters} onChange={updateFilter} onClear={clearFilters} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Programas con actividad"
          value={data?.total_programs ?? (isLoading ? '…' : 0)}
          icon={GitBranch}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          label="Promedio de cierre"
          value={`${data?.avg_completion ?? (isLoading ? '…' : 0)}%`}
          icon={GitBranch}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          label="Programas en riesgo"
          value={data?.programs_at_risk ?? (isLoading ? '…' : 0)}
          icon={GitBranch}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desglose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.program_breakdown ?? []).map((row) => (
            <div key={row.program} className="flex justify-between">
              <span>{row.program}</span>
              <span className="font-medium">{row.completion_percentage}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
