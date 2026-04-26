import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';
import { HIERARCHY_ORDER } from '@/lib/hierarchy';

/** F2/F4: propaga filtros jerárquicos de la URL a cualquier ruta (drill-down compartible). */
export function appendHierarchyQuery(path: string, f: HierarchyFilters): string {
  const p = new URLSearchParams();
  for (const key of HIERARCHY_ORDER) {
    const value = f[key];
    if (value) p.set(key, value);
  }
  const q = p.toString();
  if (!q) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${q}`;
}
