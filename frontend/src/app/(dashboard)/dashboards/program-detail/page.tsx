"use client";

import { useState } from 'react';
import { Circle, Layers } from 'lucide-react';

import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import { Card, CardContent, PageHeader, PageWrapper, Select, StatCard } from '@/components/ui';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { useDashboardProgramDetail } from '@/hooks/useAppDashboardPanels';

const PROGRAM_OPTIONS = [
  { value: 'sast', label: 'SAST' },
  { value: 'dast', label: 'DAST' },
  { value: 'sca', label: 'SCA' },
  { value: 'tm', label: 'Threat Modeling' },
  { value: 'mast', label: 'MAST' },
  { value: 'auditoria', label: 'Auditoría' },
  { value: 'terceros', label: 'Terceros' },
];

export default function ProgramDetailDashboardPage() {
  const [program, setProgram] = useState('sast');
  const { filters, updateFilter, clearFilters } = useDashboardHierarchyFilters();
  const { data, isLoading } = useDashboardProgramDetail(program, filters);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Dashboard · Detalle Programa" description="Zoom por motor/fuente." />
      <HierarchyFiltersBar filters={filters} onChange={updateFilter} onClear={clearFilters} />
      <Card>
        <CardContent className="pt-6">
          <Select
            label="Programa"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            options={PROGRAM_OPTIONS}
          />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Total"
          value={data?.total_findings ?? (isLoading ? '…' : 0)}
          icon={Layers}
          iconBg="bg-primary/10"
        />
        <StatCard
          label="Abiertas"
          value={data?.open_findings ?? (isLoading ? '…' : 0)}
          icon={Circle}
          iconBg="bg-amber-500/10"
        />
        <StatCard
          label="Cerradas"
          value={data?.closed_findings ?? (isLoading ? '…' : 0)}
          icon={Circle}
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          label="% Cierre"
          value={`${data?.completion_percentage ?? (isLoading ? '…' : 0)}%`}
          icon={Layers}
          iconBg="bg-blue-500/10"
        />
      </div>
    </PageWrapper>
  );
}
