"use client";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  FolderKanban,
  GitBranch,
  LayoutGrid,
  Shield,
  Table,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { HierarchyFiltersBarCard } from "@/components/dashboard/HierarchyFiltersBar";
import { Card, CardContent, PageHeader, PageWrapper } from "@/components/ui";
import { useDashboardHierarchyFilters } from "@/hooks/useDashboardHierarchyFilters";
import { DASHBOARD_FILTER_MODULO } from "@/lib/dashboardHierarchyPresets";
import { appendHierarchyQuery } from "@/lib/dashboardLinks";

/** Los 10 tableros BRD acordados (rutas Next bajo /dashboards/*). */
const BRD_DASHBOARDS: { href: string; label: string; desc: string; icon: LucideIcon }[] = [
  { href: "/dashboards/executive", label: "Ejecutivo", desc: "KPI, postura, tendencias, top repos, SLA y auditorías", icon: BarChart3 },
  { href: "/dashboards/team", label: "Equipo", desc: "Resumen, distribución y tabla por analista", icon: Users },
  { href: "/dashboards/programs", label: "Programas", desc: "Resumen, heatmap, distribución y riesgo", icon: GitBranch },
  { href: "/dashboards/vulnerabilities", label: "Vulnerabilidades multi-dim", desc: "Drill global → subdirección → célula → repositorio", icon: Shield },
  { href: "/dashboards/concentrado", label: "Concentrado", desc: "Vista agregada por motor, severidad y tabla", icon: BarChart3 },
  { href: "/dashboards/releases", label: "Releases (tabla org)", desc: "Filtros jerárquicos, KPIs, tabla y estados", icon: Table },
  { href: "/dashboards/operacion", label: "Operación", desc: "Liberaciones, terceros y detalle de release", icon: FolderKanban },
  { href: "/dashboards/kanban", label: "Releases (Kanban)", desc: "Columnas por estado y arrastre (move)", icon: LayoutGrid },
  { href: "/dashboards/iniciativas", label: "Iniciativas", desc: "Resumen, hitos, timeline e iniciativas en riesgo", icon: Target },
  { href: "/dashboards/temas", label: "Temas emergentes", desc: "Impacto, bitácora y detalle de tema", icon: AlertCircle },
];

export default function DashboardsHubPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Hub (10 tableros BRD)"
        description="Mapa a los diez tableros analíticos con el mismo criterio de filtros jerárquicos (URL). Módulos CRUD siguen en el menú lateral (Vulnerabilidades, Service releases, etc.)."
      />
      <HierarchyFiltersBarCard
        title="Filtros jerárquicos"
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
        savedModulo={DASHBOARD_FILTER_MODULO.home}
        onApplyFilters={applyFilters}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {BRD_DASHBOARDS.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={appendHierarchyQuery(href, filters)} className="block">
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
      </div>
    </PageWrapper>
  );
}
