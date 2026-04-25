"use client";

import { ArrowRight, FolderKanban, GitBranch, Shield } from "lucide-react";
import Link from "next/link";

import { HierarchyFiltersBar } from "@/components/dashboard/HierarchyFiltersBar";
import { Card, CardContent, PageHeader, PageWrapper } from "@/components/ui";
import { useDashboardHierarchyFilters } from "@/hooks/useDashboardHierarchyFilters";
import { DASHBOARD_FILTER_MODULO } from "@/lib/dashboardHierarchyPresets";
import { appendHierarchyQuery } from "@/lib/dashboardLinks";

const LINKS: { href: string; label: string; desc: string; icon: typeof Shield }[] = [
  { href: "/vulnerabilidads", label: "Vulnerabilidades", desc: "Listado con filtros y SLA", icon: Shield },
  { href: "/service_releases", label: "Liberaciones", desc: "Flujo y kanban de operación", icon: FolderKanban },
  { href: "/revision_terceros", label: "Revisiones tercero", desc: "Pentest y checklist §10.3", icon: GitBranch },
];

/** Noveno tablero BRD §13.3: hub operativo y enlaces con jerarquía. */
export default function DashboardsHubPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Hub operativo"
        description="Atajos a módulos clave con los mismos filtros jerárquicos de la URL (drill-down desde el índice o el home)."
      />
      <HierarchyFiltersBar
        title="Filtros jerárquicos"
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        savedModulo={DASHBOARD_FILTER_MODULO.home}
        onApplyFilters={applyFilters}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={appendHierarchyQuery(href, filters)}>
            <Card className="h-full transition hover:border-primary/40">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        <a href={appendHierarchyQuery("/dashboards/executive", filters)} className="block">
          <Card className="h-full transition hover:border-primary/40">
            <CardContent className="p-5 text-sm text-muted-foreground">
              Ver tablero ejecutivo con métricas agregadas →
            </CardContent>
          </Card>
        </a>
      </div>
    </PageWrapper>
  );
}
