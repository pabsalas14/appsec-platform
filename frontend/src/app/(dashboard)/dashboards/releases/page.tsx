"use client";

import { Layers } from 'lucide-react';
import Link from 'next/link';

import { DashboardCsvExportButton } from '@/components/dashboard/DashboardCsvExportButton';
import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  PageWrapper,
} from '@/components/ui';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';
import { useDashboardReleasesKanban, useDashboardReleasesTable } from '@/hooks/useAppDashboardPanels';
import { useMyDashboardVisibility } from '@/hooks/useDashboardConfigs';

export default function ReleasesDashboardPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();
  const { data: tableData, isLoading: tableLoading } = useDashboardReleasesTable(50, filters);
  const { data: kanbanData, isLoading: kanbanLoading } = useDashboardReleasesKanban(filters);
  const { data: visibility } = useMyDashboardVisibility('releases');
  const isVisible = (widgetId: string) =>
    visibility?.widgets?.[widgetId]?.visible ?? visibility?.default_visible ?? true;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Releases"
        description="Vista tabla y kanban de releases con drill-down organizacional."
        action={
          <DashboardCsvExportButton
            apiPath="/service_releases/export.csv"
            filename="service_releases.csv"
            label="Exportar releases"
          />
        }
      />

      <HierarchyFiltersBar
        title="Filtros organizacionales"
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        savedModulo={DASHBOARD_FILTER_MODULO.releases}
        onApplyFilters={applyFilters}
      />

      {isVisible('dashboard.releases.panel.table') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tabla de releases</CardTitle>
          </CardHeader>
          <CardContent>
            {tableLoading ? (
              <div className="text-sm text-muted-foreground">Cargando...</div>
            ) : (tableData?.items.length ?? 0) === 0 ? (
              <EmptyState
                icon={Layers}
                title="Sin releases para este filtro"
                description="Ajusta jerarquía o limpia filtros."
              />
            ) : (
              <div className="space-y-2">
                {tableData?.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{item.nombre}</div>
                    <div className="text-muted-foreground">
                      v{item.version} · {item.estado_actual}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isVisible('dashboard.releases.panel.kanban') && (
        <details open className="rounded-lg border border-border bg-card text-card-foreground">
          <summary className="cursor-pointer list-inside px-4 py-3 text-sm font-medium">
            Kanban de releases (clic para colapsar)
          </summary>
          <div className="border-t px-4 py-3">
            {kanbanLoading ? (
              <div className="text-sm text-muted-foreground">Cargando...</div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries(kanbanData?.columns ?? {}).map(([column, items]) => (
                  <div key={column} className="rounded-md border border-border p-3">
                    <div className="mb-2 text-sm font-medium">
                      {column} ({items.length})
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={`/service_releases?highlight=${item.id}`}
                          className="block rounded bg-muted/40 px-2 py-1 text-xs transition-colors hover:bg-muted/70 hover:underline"
                        >
                          {item.nombre} · v{item.version}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </PageWrapper>
  );
}
