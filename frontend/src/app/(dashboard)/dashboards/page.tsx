"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, AlertTriangle, BarChart3, GitBranch, Layers, ShieldCheck, Users } from 'lucide-react';

import { Card, CardContent, PageHeader, PageWrapper } from '@/components/ui';

const DASHBOARDS: { href: string; label: string; icon: typeof BarChart3 }[] = [
  { href: '/dashboards/executive', label: 'Ejecutivo', icon: BarChart3 },
  { href: '/dashboards/team', label: 'Equipo', icon: Users },
  { href: '/dashboards/programs', label: 'Programas', icon: GitBranch },
  { href: '/dashboards/program-detail', label: 'Detalle Programa', icon: Layers },
  { href: '/dashboards/vulnerabilities', label: 'Vulnerabilidades', icon: ShieldCheck },
  { href: '/dashboards/releases', label: 'Releases', icon: Activity },
  { href: '/dashboards/initiatives', label: 'Iniciativas', icon: Layers },
  { href: '/dashboards/emerging-themes', label: 'Temas Emergentes', icon: AlertTriangle },
];

export default function DashboardsIndexPage() {
  const sp = useSearchParams();
  const suffix = sp.toString() ? `?${sp.toString()}` : '';

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Dashboards AppSec"
        description="Acceso rápido a vistas con drill-down jerárquico. Los filtros de la URL (home u otros paneles) se propagan a cada dashboard."
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
                  <div className="text-sm font-medium">{dash.label}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageWrapper>
  );
}
