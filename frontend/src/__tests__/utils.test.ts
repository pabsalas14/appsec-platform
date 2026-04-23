import { describe, it, expect } from 'vitest';
import { cn, formatDate, extractErrorMessage } from '@/lib/utils';

describe('cn', () => {
  it('merges tailwind classes and dedupes conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});

describe('formatDate', () => {
  it('returns em-dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats an ISO string', () => {
    const out = formatDate('2026-01-15T10:00:00Z');
    // Locale-dependent, but must at least contain the year
    expect(out).toMatch(/2026/);
  });
});

describe('extractErrorMessage', () => {
  it('returns fallback when detail is missing', () => {
    expect(extractErrorMessage({}, 'fallback')).toBe('fallback');
  });

  it('returns string detail as-is', () => {
    const err = { response: { data: { detail: 'Invalid credentials' } } };
    expect(extractErrorMessage(err, 'x')).toBe('Invalid credentials');
  });

  it('joins Pydantic validation errors', () => {
    const err = {
      response: {
        data: {
          detail: [
            { msg: 'field required', loc: ['body', 'title'] },
            { msg: 'max length', loc: ['body', 'description'] },
          ],
        },
      },
    };
    expect(extractErrorMessage(err, 'x')).toBe('field required. max length');
  });
});
