import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string for display */
export function formatDate(date: string | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Safely extract an error message from an Axios error response.
 * Handles Pydantic validation errors (detail is an array of objects).
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { detail?: unknown } } };
  const detail = axiosErr?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: unknown) =>
        typeof d === 'object' && d !== null && 'msg' in d
          ? (d as { msg: string }).msg
          : String(d),
      )
      .join('. ');
  }
  return fallback;
}
