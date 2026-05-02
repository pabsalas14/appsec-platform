"use client";

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Layers, PlayCircle } from 'lucide-react';

import { DashboardCsvExportButton } from '@/components/dashboard/DashboardCsvExportButton';
import { HierarchyFiltersBarCard } from '@/components/dashboard/HierarchyFiltersBar';
import { EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { DASHBOARD_FILTER_MODULO } from '@/lib/dashboardHierarchyPresets';
import {
  useDashboardReleases,
  useDashboardReleasesTable,
} from '@/hooks/useAppDashboardPanels';
export default function ReleasesDashboardPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();
  const { data: kpi, isLoading: kpiLoading } = useDashboardReleases(filters);
  const { data: tableData, isLoading: tableLoading } = useDashboardReleasesTable(50, filters);

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-[#e2e8f0] p-6 font-sans">
      <div className="flex flex-col gap-4 justify-between items-start mb-8 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">Liberaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Control operativo de releases por jerarquía organizacional.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/service_releases/registros"
            className="inline-flex items-center justify-center rounded-lg border border-[#252a45] bg-[#1c2035] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[#252a45]/80"
          >
            Gestionar registros
          </Link>
          <Link
            href="/dashboards/kanban"
            className="inline-flex items-center justify-center rounded-lg border border-[#252a45] bg-[#1c2035] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[#252a45]/80"
          >
            Kanban
          </Link>
          <DashboardCsvExportButton
            apiPath="/service_releases/export.csv"
            filename="service_releases.csv"
            label="Exportar releases"
            className="bg-[#1c2035] border-[#252a45] text-xs h-9"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-hover border-b-4 border-slate-500 p-5 rounded-xl bg-[#141728]/50">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Layers className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Releases</span>
          </div>
          {kpiLoading ? <div className="h-8 w-12 bg-[#252a45] animate-pulse rounded" /> : <div className="text-3xl font-bold">{kpi?.total_releases ?? 0}</div>}
        </div>

        <div className="glass-hover border-b-4 border-amber-500 p-5 rounded-xl bg-[#141728]/50">
          <div className="flex items-center gap-2 mb-2 text-amber-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pendientes Aprobación</span>
          </div>
          {kpiLoading ? <div className="h-8 w-12 bg-[#252a45] animate-pulse rounded" /> : <div className="text-3xl font-bold text-amber-500">{kpi?.pending_approval ?? 0}</div>}
        </div>

        <div className="glass-hover border-b-4 border-blue-500 p-5 rounded-xl bg-[#141728]/50">
          <div className="flex items-center gap-2 mb-2 text-blue-500">
            <PlayCircle className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">En Progreso</span>
          </div>
          {kpiLoading ? <div className="h-8 w-12 bg-[#252a45] animate-pulse rounded" /> : <div className="text-3xl font-bold text-blue-500">{kpi?.in_progress ?? 0}</div>}
        </div>

        <div className="glass-hover border-b-4 border-emerald-500 p-5 rounded-xl bg-[#141728]/50">
          <div className="flex items-center gap-2 mb-2 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completadas</span>
          </div>
          {kpiLoading ? <div className="h-8 w-12 bg-[#252a45] animate-pulse rounded" /> : <div className="text-3xl font-bold text-green-500">{kpi?.completed ?? 0}</div>}
        </div>
      </div>

      <div className="mb-6">
        <HierarchyFiltersBarCard
          title="Filtros organizacionales"
          filters={filters}
          onChange={updateFilter}
          onClear={clearFilters}
          savedModulo={DASHBOARD_FILTER_MODULO.releases}
          onApplyFilters={applyFilters}
          className="bg-[#141728] border-[#252a45]"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-[#141728] border border-[#252a45] rounded-xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#252a45] bg-[#1c2035]/30">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Tabla de Releases</h2>
          </div>
          <div className="p-0">
            {tableLoading ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : (tableData?.items.length ?? 0) === 0 ? (
              <div className="p-10">
                <EmptyState icon={Layers} title="Sin releases" description="Ajusta filtros." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-[#0d0f1a]/50">
                    <tr>
                      <th className="px-5 py-3">Nombre</th>
                      <th className="px-5 py-3">Versión</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Creado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252a45]">
                    {tableData?.items.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-200">{item.nombre}</td>
                        <td className="px-5 py-4"><span className="px-2 py-0.5 bg-[#252a45] rounded text-xs">v{item.version}</span></td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                            item.estado_actual === 'Completada' ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                          )}>
                            {item.estado_actual}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
