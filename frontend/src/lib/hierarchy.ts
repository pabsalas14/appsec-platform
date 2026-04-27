import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';

export const HIERARCHY_ORDER: (keyof HierarchyFilters)[] = [
  'direccion_id',
  'subdireccion_id',
  'gerencia_id',
  'organizacion_id',
  'celula_id',
  'repositorio_id',
];

export const HIERARCHY_LABELS: Record<keyof HierarchyFilters, string> = {
  direccion_id: 'Dirección',
  subdireccion_id: 'Subdirección',
  gerencia_id: 'Gerencia',
  organizacion_id: 'Organización',
  celula_id: 'Célula',
  repositorio_id: 'Repositorio',
};

/**
 * Keeps descendants clean when a parent level changes.
 * Centralized so changing hierarchy order is one-file change.
 */
export function clearHierarchyDescendants(
  next: HierarchyFilters,
  changedKey: keyof HierarchyFilters,
): HierarchyFilters {
  const idx = HIERARCHY_ORDER.indexOf(changedKey);
  if (idx < 0) return next;
  const out = { ...next };
  for (const key of HIERARCHY_ORDER.slice(idx + 1)) {
    delete out[key];
  }
  return out;
}
