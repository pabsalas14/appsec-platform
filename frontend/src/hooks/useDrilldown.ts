import { useState, useCallback } from 'react';

interface DrilldownLevel {
  level: number;
  label: string;
  id?: string;
  filters: Record<string, unknown>;
}

interface UseDrilldownReturn {
  breadcrumb: DrilldownLevel[];
  currentLevel: number;
  currentFilters: Record<string, unknown>;
  push: (label: string, id: string, filters: Record<string, unknown>) => void;
  pop: () => void;
  goToLevel: (level: number) => void;
  reset: () => void;
}

export function useDrilldown(
  initialFilters: Record<string, unknown> = {},
  maxLevels: number = 4
): UseDrilldownReturn {
  const [breadcrumb, setBreadcrumb] = useState<DrilldownLevel[]>([
    {
      level: 0,
      label: 'Global',
      filters: initialFilters,
    },
  ]);

  const currentLevel = breadcrumb.length - 1;
  const currentFilters = breadcrumb[currentLevel]?.filters || initialFilters;

  const push = useCallback(
    (label: string, id: string, filters: Record<string, unknown>) => {
      if (currentLevel < maxLevels - 1) {
        setBreadcrumb((prev) => [
          ...prev,
          {
            level: prev.length,
            label,
            id,
            filters: { ...currentFilters, ...filters },
          },
        ]);
      }
    },
    [currentLevel, currentFilters, maxLevels]
  );

  const pop = useCallback(() => {
    if (breadcrumb.length > 1) {
      setBreadcrumb((prev) => prev.slice(0, -1));
    }
  }, [breadcrumb.length]);

  const goToLevel = useCallback(
    (level: number) => {
      if (level >= 0 && level < breadcrumb.length) {
        setBreadcrumb((prev) => prev.slice(0, level + 1));
      }
    },
    [breadcrumb.length]
  );

  const reset = useCallback(() => {
    setBreadcrumb([
      {
        level: 0,
        label: 'Global',
        filters: initialFilters,
      },
    ]);
  }, [initialFilters]);

  return {
    breadcrumb,
    currentLevel,
    currentFilters,
    push,
    pop,
    goToLevel,
    reset,
  };
}
