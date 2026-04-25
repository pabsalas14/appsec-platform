import api from '@/lib/api';

/**
 * GET binario (CSV) bajo /api/v1; dispara descarga en el navegador.
 */
export async function downloadCsvFromApi(path: string, filename: string): Promise<void> {
  const res = await api.get(path, { responseType: 'blob' });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * POST multipart `file` (mismo patrón que `useUploads`).
 */
export async function importCsvToApi<T = unknown>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<T>(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
