import { useState, useCallback, useMemo } from 'react';

/**
 * Generic row-selection state for any list / table.
 *
 * ```tsx
 * const sel = useRowSelection(items.map(i => i.id));
 * ```
 */
export function useRowSelection<T extends string | number = string>(allIds: T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(allIds));
  }, [allIds]);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)));
  }, [allIds]);

  const isSelected = useCallback((id: T) => selected.has(id), [selected]);

  const count = selected.size;
  const allSelected = count > 0 && count === allIds.length;
  const someSelected = count > 0 && count < allIds.length;

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return {
    selected,
    selectedIds,
    count,
    allSelected,
    someSelected,
    toggle,
    selectAll,
    clear,
    toggleAll,
    isSelected,
  };
}
