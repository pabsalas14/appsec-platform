import axios from 'axios';

import { logger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send HttpOnly cookies with every request
});

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = readCookie('csrf_token');
    if (csrfToken) {
      config.headers.set('X-CSRF-Token', csrfToken);
    }
  }
  return config;
});

// Bubble the backend's X-Request-ID up to the logger so subsequent
// `logger.*` calls in the same UI flow get correlated with backend logs.
api.interceptors.response.use(
  (response) => {
    const rid = response.headers?.['x-request-id'];
    if (typeof rid === 'string' && rid) logger.setRequestId(rid);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const rid = error.response?.headers?.['x-request-id'];
    if (typeof rid === 'string' && rid) logger.setRequestId(rid);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const csrfToken = readCookie('csrf_token');
        await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
          },
        );
        // Retry original request — new cookies are set automatically
        return api(originalRequest);
      } catch {
        // Refresh failed — clear cookies and redirect
        try {
          const csrfToken = readCookie('csrf_token');
          await axios.post(
            `${API_URL}/api/v1/auth/logout`,
            {},
            {
              withCredentials: true,
              headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
            },
          );
        } catch {
          /* ignore */
        }
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.response) {
      logger.error('api.error', {
        status: error.response.status,
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        request_id: rid,
        code: error.response.data?.code,
      });
    } else if (error.request) {
      logger.error('api.network_error', {
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
