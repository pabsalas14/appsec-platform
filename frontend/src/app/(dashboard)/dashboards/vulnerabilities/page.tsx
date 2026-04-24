"use client";

import { Circle, ShieldCheck } from 'lucide-react';

import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { Card, CardContent, CardHeader, CardTitle, PageHeader, PageWrapper, StatCard } from '@/components/ui';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { useDashboardVulnerabilities } from '@/hooks/useAppDashboardPanels';

export default function VulnerabilitiesDashboardPage() {
  const { filters, updateFilter, clearFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardVulnerabilities(filters);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Vulnerabilidades"
        description="Severidad, estado y cumplimiento SLA por jerarquía."
      />
      <HierarchyFiltersBar filters={filters} onChange={updateFilter} onClear={clearFilters} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total"
          value={data?.total_vulnerabilities ?? (isLoading ? '…' : 0)}
          icon={ShieldCheck}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10"
        />
        <StatCard
          label="Vencidas SLA"
          value={data?.overdue_count ?? (isLoading ? '…' : 0)}
          icon={Circle}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <StatCard
          label="SLA verde"
          value={data?.sla_status.green ?? (isLoading ? '…' : 0)}
          icon={Circle}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
      </div>
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
    </PageWrapper>
  );
}
