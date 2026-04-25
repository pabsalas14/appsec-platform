/**
 * Unified frontend logger.
 *
 * - In development: prints to the browser console with a `[app]` prefix and
 *   the event level colour.
 * - In production: buffers entries in memory and flushes to
 *   `POST /api/v1/client-logs` every 5 seconds, on page hide, and when the
 *   buffer reaches `MAX_BUFFER`.
 *
 * Usage:
 *
 *   import { logger } from '@/lib/logger';
 *
 *   logger.info('task.create.click', { taskId });
 *   logger.error('api.error', { status: 500, url: '/api/v1/tasks' });
 *
 * This is the ONLY module allowed to call `console.*` (enforced by the
 * ESLint `no-console` rule in `.eslintrc.json`).
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: Level;
  event: string;
  data?: Record<string, unknown>;
  ts: string;
  pathname?: string;
  request_id?: string;
  user_id?: string;
  version?: string;
}

const IS_PROD = process.env.NODE_ENV === 'production';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
const MAX_BUFFER = 25;
const FLUSH_INTERVAL_MS = 5000;
const ENDPOINT = '/api/v1/client-logs';

let buffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let userId: string | undefined;
let lastRequestId: string | undefined;

const SECRET_KEYS = new Set([
  'authorization',
  'cookie',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
]);

function redact<T>(value: T, depth = 0): T {
  if (depth > 6 || value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return (value as unknown[]).map((v) => redact(v, depth + 1)) as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.has(k.toLowerCase()) ? '***' : redact(v, depth + 1);
    }
    return out as unknown as T;
  }
  return value;
}

function currentPathname(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname;
}

function startTimer(): void {
  if (flushTimer || typeof window === 'undefined') return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
}

async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: batch }),
    });
  } catch {
    // Drop on failure — we never want logging to cascade into user errors.
  }
}

function emit(level: Level, event: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    event,
    data: data ? (redact(data) as Record<string, unknown>) : undefined,
    ts: new Date().toISOString(),
    pathname: currentPathname(),
    request_id: lastRequestId,
    user_id: userId,
    version: APP_VERSION,
  };

  if (!IS_PROD) {
    const fn =
      level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : level === 'debug' ? console.debug
      : console.info;
    // eslint-disable-next-line no-console
    fn(`[app] ${event}`, entry);
    return;
  }

  if (level === 'debug') return;

  buffer.push(entry);
  startTimer();
  if (buffer.length >= MAX_BUFFER) {
    void flush();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  window.addEventListener('pagehide', () => {
    void flush();
  });
}

export const logger = {
  debug: (event: string, data?: Record<string, unknown>) => emit('debug', event, data),
  info: (event: string, data?: Record<string, unknown>) => emit('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => emit('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => emit('error', event, data),
  setUserId: (id: string | undefined) => { userId = id; },
  setRequestId: (id: string | undefined) => { lastRequestId = id; },
  flush,
};
