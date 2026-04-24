/** Convierte valor de `input type="datetime-local"` a ISO para la API. */
export function localDateTimeToIso(value: string): string {
  if (!value.trim()) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

/** ISO de la API → valor para `input type="datetime-local"`. */
export function isoToLocalDateTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Solo fecha (YYYY-MM-DD) desde ISO. */
export function isoToDateOnly(iso: string | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/** YYYY-MM-DD a ISO fin de día local o a ISO con T12:00 — usar para campos `date` de API. */
export function dateOnlyToIsoEndOfDay(value: string): string {
  if (!value.trim()) return '';
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}
