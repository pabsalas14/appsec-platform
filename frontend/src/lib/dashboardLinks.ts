import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';

/** F2/F4: propaga filtros jerárquicos de la URL a cualquier ruta (drill-down compartible). */
export function appendHierarchyQuery(path: string, f: HierarchyFilters): string {
  const p = new URLSearchParams();
  if (f.subdireccion_id) p.set('subdireccion_id', f.subdireccion_id);
  if (f.gerencia_id) p.set('gerencia_id', f.gerencia_id);
  if (f.organizacion_id) p.set('organizacion_id', f.organizacion_id);
  if (f.celula_id) p.set('celula_id', f.celula_id);
  const q = p.toString();
  if (!q) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${q}`;
}
