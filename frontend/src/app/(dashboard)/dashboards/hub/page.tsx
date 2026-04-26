"use client";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  GitBranch,
  LayoutGrid,
  Package,
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

/** Diez tableros AppSec V2 (rutas bajo /dashboards/*; OKR en /okr_dashboard). */
const BRD_DASHBOARDS: { href: string; label: string; desc: string; icon: LucideIcon }[] = [
  { href: "/dashboards/executive", label: "1 · Ejecutivo", desc: "KPI, postura, tendencia 6m (4 severidades), top repos, SLA", icon: BarChart3 },
  { href: "/dashboards/team", label: "2 · Equipo", desc: "Carga, KPIs, tabla, distribución, premium", icon: Users },
  { href: "/dashboards/programs", label: "3 · Programas", desc: "Heatmap, avance y programas", icon: GitBranch },
  { href: "/dashboards/vulnerabilities", label: "4 · Vulns. organizacional", desc: "7 niveles: Dirección → … → Repositorio", icon: Shield },
  { href: "/dashboards/concentrado", label: "5 · Vulns. por motor", desc: "SAST…MDA, apilado severidad, pipeline", icon: BarChart3 },
  { href: "/dashboards/releases", label: "6 · Liberaciones (tabla)", desc: "KPIs y tabla de control", icon: Table },
  { href: "/dashboards/kanban", label: "7 · Kanban releases", desc: "Tablero por estado, drag & drop", icon: LayoutGrid },
  { href: "/dashboards/temas-auditorias", label: "8 · Temas + auditorías", desc: "Vista unificada V2", icon: AlertCircle },
  { href: "/okr_dashboard", label: "9 · OKR", desc: "Compromisos y cascada (módulo OKR)", icon: Target },
  { href: "/dashboards/plataforma", label: "10 · Release plataforma", desc: "Versión, changelog, timeline", icon: Package },
];

export default function DashboardsHubPage() {
  const { filters, updateFilter, clearFilters, applyFilters } = useDashboardHierarchyFilters();

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboard · Hub (V2 — 10 tableros)"
        description="Mapa a los 10 tableros AppSec V2. Filtros jerárquicos vía query en URLs compatibles. OKR (9) vive en /okr_dashboard."
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
