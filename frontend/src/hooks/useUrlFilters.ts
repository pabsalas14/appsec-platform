'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Sync filter state with URL search params so users can share filtered views
 * and browser back/forward preserves filter context.
 *
 * @example
 * const { getParam, setParam, setParams } = useUrlFilters();
 * const search = getParam('q') ?? '';
 * const handleSearch = (val: string) => setParam('q', val);
 */
export function useUrlFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const getParam = useCallback(
    (key: string) => searchParams.get(key),
    [searchParams],
  );

  const getNumParam = useCallback(
    (key: string): number | undefined => {
      const val = searchParams.get(key);
      if (val == null) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    [searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string | number | null | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value == null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      // Reset page when a filter changes (unless the key IS the page)
      if (key !== 'page') {
        params.delete('page');
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const setParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      let resetPage = false;
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
        if (key !== 'page') resetPage = true;
      }
      if (resetPage) params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const clearAll = useCallback(
    () => {
      router.replace(pathname, { scroll: false });
    },
    [pathname, router],
  );

  return { getParam, getNumParam, setParam, setParams, clearAll, searchParams };
}
