/**
 * Descarga de archivos vía GET autenticado (cookies), p. ej. `GET /api/v1/.../export.csv`.
 * No usa el cliente JSON de axios para no parsear el cuerpo como JSON.
 */
import { logger } from '@/lib/logger';

const API_V1 = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : '/api/v1';

export async function downloadAuthenticatedExport(
  path: string,
  filename: string,
): Promise<void> {
  const rel = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_V1}${rel}`;

  const res = await fetch(url, { credentials: 'include', method: 'GET' });
  if (res.status === 403) {
    logger.warn('export.forbidden', { path: rel });
    throw new Error('No tienes permiso para exportar.');
  }
  if (!res.ok) {
    const text = await res.text();
    logger.error('export.http_error', { path: rel, status: res.status });
    throw new Error(text.length > 0 && text.length < 400 ? text : `Error ${res.status} al exportar`);
  }

  const cd = res.headers.get('Content-Disposition');
  let name = filename;
  if (cd) {
    const m = /filename="?([^";\n]+)"?/i.exec(cd);
    if (m?.[1]) name = m[1].trim();
  }

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
  URL.revokeObjectURL(href);
}
