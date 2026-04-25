import type { EstatusVulnItem } from '@/hooks/useOperacionConfig';

/**
 * Resuelve el id canónico del catálogo a partir del valor almacenado (id, etiqueta o variante heredada).
 */
export function resolveEstatusIdFromRaw(raw: string, estatus: EstatusVulnItem[] | undefined): string {
  if (!estatus?.length) return raw;
  const t = raw.trim();
  for (const e of estatus) {
    if (e.id === t) return e.id;
  }
  const lower = t.toLowerCase();
  for (const e of estatus) {
    if (e.label && e.label.trim().toLowerCase() === lower) return e.id;
  }
  for (const e of estatus) {
    if (e.id.toLowerCase() === lower) return e.id;
  }
  return raw;
}

export function labelForEstatusId(estatus: EstatusVulnItem[] | undefined, idOrRaw: string): string {
  if (!estatus?.length) return idOrRaw;
  const id = resolveEstatusIdFromRaw(idOrRaw, estatus);
  return estatus.find((e) => e.id === id)?.label ?? idOrRaw;
}

/** Opciones de Select: estatus actual y destinos permitidos; si faltan transiciones en catálogo, se permiten todos. */
export function optionsForEstadoTransiciones(
  estatus: EstatusVulnItem[] | undefined,
  currentRaw: string,
): { value: string; label: string; disabled?: boolean }[] {
  if (!estatus?.length) return [];
  const currentId = resolveEstatusIdFromRaw(currentRaw, estatus);
  const row = estatus.find((e) => e.id === currentId);
  if (!row) {
    return estatus.map((e) => ({ value: e.id, label: e.label || e.id }));
  }
  const trans = row.transiciones_permitidas;
  if (trans === undefined || trans === null) {
    return estatus.map((e) => ({ value: e.id, label: e.label || e.id }));
  }
  const allow = new Set<string>([currentId, ...trans]);
  return estatus
    .filter((e) => allow.has(e.id))
    .map((e) => ({ value: e.id, label: e.label || e.id }));
}

export function filtroEstadoMatchItem(
  itemEstado: string,
  filtroId: string,
  estatus: EstatusVulnItem[] | undefined,
): boolean {
  if (!filtroId) return true;
  if (!estatus?.length) return itemEstado === filtroId;
  const itemId = resolveEstatusIdFromRaw(itemEstado, estatus);
  return itemId === filtroId;
}
