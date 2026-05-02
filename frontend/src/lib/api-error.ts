export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return fallback;
  }
  const response = (error as { response?: { status?: number; data?: { detail?: unknown; message?: unknown; code?: unknown } } }).response;
  const detail = response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'message' in detail) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  if (typeof response?.data?.message === 'string') return response.data.message;
  if (typeof response?.data?.code === 'string') return `${fallback} (${response.data.code})`;
  if (response?.status) return `${fallback} (HTTP ${response.status})`;
  return fallback;
}
