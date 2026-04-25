'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Badge } from '@/components/ui';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
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

  const hasH =
    Boolean(filters.subdireccion_id || filters.gerencia_id || filters.organizacion_id || filters.celula_id);

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
          {filters.subdireccion_id && (
            <Badge variant="default" className="font-mono text-[10px]">
              sub {filters.subdireccion_id.slice(0, 8)}…
            </Badge>
          )}
          {filters.gerencia_id && (
            <Badge variant="default" className="font-mono text-[10px]">
              ger {filters.gerencia_id.slice(0, 8)}…
            </Badge>
          )}
          {filters.organizacion_id && (
            <Badge variant="default" className="font-mono text-[10px]">
              org {filters.organizacion_id.slice(0, 8)}…
            </Badge>
          )}
          {filters.celula_id && (
            <Badge variant="default" className="font-mono text-[10px]">
              cél {filters.celula_id.slice(0, 8)}…
            </Badge>
          )}
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
