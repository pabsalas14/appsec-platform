'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Badge } from '@/components/ui';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { HIERARCHY_LABELS, HIERARCHY_ORDER } from '@/lib/hierarchy';
import { cn } from '@/lib/utils';

const DASHBOARD_TITLES: Record<string, string> = {
  '': 'Índice',
  executive: 'Ejecutivo',
  vulnerabilities: 'Vulnerabilidades',
  team: 'Equipo',
  releases: 'Liberaciones',
  programs: 'Programas',
  'program-detail': 'Detalle programa',
  initiatives: 'Iniciativas',
  'emerging-themes': 'Temas emergentes',
};

/**
 * F2: breadcrumbs visibles + chips de jerarquía activa (filtros en URL).
 */
export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const { filters, clearFilters } = useDashboardHierarchyFilters();

  const parts = pathname.split('/').filter(Boolean);
  const inDashboards = parts[0] === 'dashboards';
  const sub = parts[1] ?? '';
  const title = DASHBOARD_TITLES[sub] ?? (sub || 'Dashboards');

  const hasH = HIERARCHY_ORDER.some((k) => Boolean(filters[k]));

  if (!inDashboards) return null;

  return (
    <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        Inicio
      </Link>
      <span aria-hidden>/</span>
      <Link href="/dashboards" className="hover:text-foreground">
        Dashboards
      </Link>
      {sub ? (
        <>
          <span aria-hidden>/</span>
          <span className="font-medium text-foreground">{title}</span>
        </>
      ) : null}
      {hasH && (
        <div className="ml-2 flex flex-wrap items-center gap-1">
          <span className="text-xs">·</span>
          {HIERARCHY_ORDER.map((key) => {
            const value = filters[key];
            if (!value) return null;
            return (
              <Badge key={key} variant="default" className="font-mono text-[10px]">
                {HIERARCHY_LABELS[key]} {value.slice(0, 8)}…
              </Badge>
            );
          })}
          <button
            type="button"
            className={cn('ml-1 text-xs text-primary underline-offset-4 hover:underline')}
            onClick={() => clearFilters()}
          >
            Quitar filtros
          </button>
        </div>
      )}
    </nav>
  );
}
