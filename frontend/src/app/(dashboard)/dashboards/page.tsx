"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, AlertTriangle, BarChart3, GitBranch, Kanban, LayoutGrid, Layers, ShieldCheck, Users } from 'lucide-react';

import { Card, CardContent, PageHeader, PageWrapper } from '@/components/ui';

/** BRD mód. 11 — nueve tableros + hub operativo + kanban (liberaciones). */
const DASHBOARDS: { href: string; label: string; brd?: string; icon: typeof BarChart3 }[] = [
  { href: '/dashboards/hub', label: 'Hub operativo', icon: LayoutGrid, brd: 'Atajo con filtros' },
  { href: '/dashboards/executive', label: '1 · Ejecutivo (general)', icon: BarChart3, brd: 'Dashboard 1' },
  { href: '/dashboards/team', label: '2 · Equipo', icon: Users, brd: 'Dashboard 2' },
  { href: '/dashboards/programs', label: '3 · Programas (consolidado)', icon: GitBranch, brd: 'Dashboard 3' },
  { href: '/dashboards/program-detail', label: '4 · Zoom por programa', icon: Layers, brd: 'Dashboard 4' },
  { href: '/dashboards/vulnerabilities', label: '5 · Vulnerabilidades (multi-dim.)', icon: ShieldCheck, brd: 'Dashboard 5' },
  { href: '/dashboards/releases', label: '6 · Liberaciones (tabla)', icon: Activity, brd: 'Dashboard 6' },
  { href: '/kanban', label: '7 · Kanban de liberaciones', icon: Kanban, brd: 'Dashboard 7' },
  { href: '/dashboards/initiatives', label: '8 · Iniciativas', icon: Layers, brd: 'Dashboard 8' },
  { href: '/dashboards/emerging-themes', label: '9 · Temas emergentes', icon: AlertTriangle, brd: 'Dashboard 9' },
];

export default function DashboardsIndexPage() {
  const sp = useSearchParams();
  const suffix = sp.toString() ? `?${sp.toString()}` : '';

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboards AppSec"
        description="Nueve tableros del Prompt Maestro (BRD §11) con drill-down jerárquico; los filtros de la URL se propagan donde aplica."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DASHBOARDS.map((dash) => {
          const Icon = dash.icon;
          return (
            <Link key={dash.href} href={`${dash.href}${suffix}`}>
              <Card className="transition hover:border-primary/50">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{dash.label}</div>
                    {dash.brd && (
                      <div className="text-xs text-muted-foreground mt-0.5">{dash.brd}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageWrapper>
  );
}
