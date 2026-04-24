"use client";

import { useCallback, useEffect, useState } from 'react';

import type { HierarchyFilters } from '@/hooks/useAppDashboardPanels';

const STORAGE_KEY = 'dashboard.hierarchy.filters.v1';

export function useDashboardHierarchyFilters() {
  const [filters, setFilters] = useState<HierarchyFilters>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HierarchyFilters;
      setFilters(parsed ?? {});
    } catch {
      /* ignore */
    }
  }, []);

  const updateFilter = useCallback(
    (key: keyof HierarchyFilters, value: string) => {
      setFilters((prev) => {
        const next: HierarchyFilters = { ...prev };
        if (!value) {
          delete next[key];
        } else {
          next[key] = value;
        }
        // En cascada: limpiar descendientes al cambiar nivel superior
        if (key === 'subdireccion_id') {
          delete next.gerencia_id;
          delete next.organizacion_id;
          delete next.celula_id;
        }
        if (key === 'gerencia_id') {
          delete next.organizacion_id;
          delete next.celula_id;
        }
        if (key === 'organizacion_id') {
          delete next.celula_id;
        }
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { filters, updateFilter, clearFilters } as const;
}
