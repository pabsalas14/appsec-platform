import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';
import { HIERARCHY_ORDER } from '@/lib/hierarchy';

const KEYS = HIERARCHY_ORDER;

/** Interpreta `parametros` de FiltroGuardado como filtro jerárquico. */
export function hierarchyFromParametros(
  p: Record<string, unknown> | null | undefined,
): HierarchyFilters {
  if (!p || typeof p !== 'object') return {};
  const out: HierarchyFilters = {};
  for (const k of KEYS) {
    const v = p[k];
    if (typeof v === 'string' && v.length > 0) {
      out[k] = v;
    }
  }
  return out;
}

/** Serializa el estado actual de selects para `FiltroGuardado.parametros`. */
export function parametrosFromHierarchy(f: HierarchyFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of KEYS) {
    const v = f[k];
    if (typeof v === 'string' && v.length > 0) {
      out[k] = v;
    }
  }
  return out;
}

/** Prefijos de módulo para presets de drill-down en dashboards. */
export const DASHBOARD_FILTER_MODULO = {
  home: 'dashboard:home',
  executive: 'dashboard:executive',
  vulnerabilities: 'dashboard:vulnerabilities',
  releases: 'dashboard:releases',
  team: 'dashboard:team',
  programs: 'dashboard:programs',
  programDetail: 'dashboard:program-detail',
  initiatives: 'dashboard:initiatives',
  emergingThemes: 'dashboard:emerging-themes',
} as const;
