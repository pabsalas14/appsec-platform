"use client";

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';

const STORAGE_KEY = 'dashboard.hierarchy.filters.v1';

const HKEYS: (keyof HierarchyFilters)[] = [
  'subdireccion_id',
  'gerencia_id',
  'organizacion_id',
  'celula_id',
];

function fromSearchParams(sp: URLSearchParams): HierarchyFilters {
  const out: HierarchyFilters = {};
  for (const k of HKEYS) {
    const v = sp.get(k);
    if (v) out[k] = v;
  }
  return out;
}

/**
 * Filtros jerárquicos (subdirección → … → célula) con persistencia en localStorage
 * y **sincronización con la URL** (F2/F3: compartir vista, back/forward, deep link).
 */
export function useDashboardHierarchyFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [filters, setFilters] = useState<HierarchyFilters>({});

  // URL tiene prioridad; sin params en URL se hidrata desde localStorage
  useEffect(() => {
    const fromUrl = fromSearchParams(searchParams);
    if (Object.keys(fromUrl).length > 0) {
      setFilters(fromUrl);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setFilters({});
        return;
      }
      const parsed = JSON.parse(raw) as HierarchyFilters;
      setFilters(Object.keys(parsed ?? {}).length ? parsed : {});
    } catch {
      setFilters({});
    }
  }, [searchParams]);

  const pushHierarchyToUrl = useCallback(
    (next: HierarchyFilters) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const k of HKEYS) {
        const v = next[k];
        if (v) params.set(k, v);
        else params.delete(k);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const updateFilter = useCallback(
    (key: keyof HierarchyFilters, value: string) => {
      setFilters((prev) => {
        const nxt: HierarchyFilters = { ...prev };
        if (!value) {
          delete nxt[key];
        } else {
          nxt[key] = value;
        }
        if (key === 'subdireccion_id') {
          delete nxt.gerencia_id;
          delete nxt.organizacion_id;
          delete nxt.celula_id;
        }
        if (key === 'gerencia_id') {
          delete nxt.organizacion_id;
          delete nxt.celula_id;
        }
        if (key === 'organizacion_id') {
          delete nxt.celula_id;
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nxt));
        } catch {
          /* ignore */
        }
        pushHierarchyToUrl(nxt);
        return nxt;
      });
    },
    [pushHierarchyToUrl],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    pushHierarchyToUrl({});
  }, [pushHierarchyToUrl]);

  const applyFilters = useCallback(
    (next: HierarchyFilters) => {
      setFilters({ ...next });
      try {
        const serialized = Object.keys(next).length ? JSON.stringify(next) : '';
        if (serialized) {
          localStorage.setItem(STORAGE_KEY, serialized);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        /* ignore */
      }
      pushHierarchyToUrl(next);
    },
    [pushHierarchyToUrl],
  );

  return { filters, updateFilter, clearFilters, applyFilters } as const;
}
