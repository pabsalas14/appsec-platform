"use client";

import { AlertTriangle, ShieldCheck } from 'lucide-react';

import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { Card, CardContent, PageHeader, PageWrapper, StatCard } from '@/components/ui';
import { useDashboardExecutive } from '@/hooks/useAppDashboardPanels';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';

export default function ExecutiveDashboardPage() {
  const { filters, updateFilter, clearFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardExecutive(filters);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Dashboard · Ejecutivo" description="KPIs estratégicos de AppSec." />
      <HierarchyFiltersBar filters={filters} onChange={updateFilter} onClear={clearFilters} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Vulnerabilidades totales"
          value={data?.kpis.total_vulnerabilities ?? (isLoading ? '…' : 0)}
          icon={ShieldCheck}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10"
        />
        <StatCard
          label="Vulnerabilidades críticas"
          value={data?.kpis.critical_count ?? (isLoading ? '…' : 0)}
          icon={AlertTriangle}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/10"
        />
        <StatCard
          label="SLA compliance"
          value={`${data?.kpis.sla_compliance ?? (isLoading ? '…' : 0)}%`}
          icon={ShieldCheck}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
      </div>
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Nivel de riesgo: <span className="font-medium text-foreground">{data?.risk_level ?? '—'}</span>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
