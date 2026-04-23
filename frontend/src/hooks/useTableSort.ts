import { useState, useMemo, useCallback } from 'react';
import type { SortDirection } from '@/components/ui/data-table';

interface UseTableSortOptions<T> {
  /** A map from sort key to a getter function that extracts the sortable value */
  getters: Record<string, (item: T) => string | number | Date | null | undefined>;
}

/**
 * Client-side sort hook for DataTable.
 * Returns sorted data, current sort state, and an `onSort` handler.
 *
 * @example
 * const { sortedData, sortKey, sortDirection, onSort } = useTableSort(items, {
 *   getters: { titulo: (p) => p.titulo, created_at: (p) => p.created_at },
 * });
 */
export function useTableSort<T>(data: T[], options: UseTableSortOptions<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const onSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDirection('asc');
        return key;
      }
      // Cycle: asc → desc → none
      setSortDirection((dir) => {
        if (dir === 'asc') return 'desc';
        if (dir === 'desc') {
          // reset sort
          setSortKey(null);
          return null;
        }
        return 'asc';
      });
      return key;
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;
    const getter = options.getters[sortKey];
    if (!getter) return data;

    return [...data].sort((a, b) => {
      const aVal = getter(a);
      const bVal = getter(b);

      // Nulls last
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' });
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = (aVal as number) - (bVal as number);
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [data, sortKey, sortDirection, options.getters]);

  return { sortedData, sortKey, sortDirection, onSort };
}
