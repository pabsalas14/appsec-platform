'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/** Persistencia local de columnas ocultas (spec 38 — preferencias por tabla). */
export function useTableColumnVisibility<T extends string>(
  storageKey: string,
  allColumns: readonly T[],
) {
  const [hidden, setHidden] = useState<Set<T>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const allowed = new Set(allColumns);
      setHidden(new Set(parsed.filter((x): x is T => typeof x === 'string' && allowed.has(x as T))));
    } catch {
      /* ignore corrupt storage */
    }
  }, [storageKey, allColumns]);

  const persist = useCallback(
    (next: Set<T>) => {
      setHidden(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* quota / private mode */
      }
    },
    [storageKey],
  );

  const toggle = useCallback(
    (col: T) => {
      const next = new Set(hidden);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      persist(next);
    },
    [hidden, persist],
  );

  const showAll = useCallback(() => persist(new Set()), [persist]);

  const isVisible = useCallback((col: T) => !hidden.has(col), [hidden]);

  const visibleKeys = useMemo(() => allColumns.filter((c) => !hidden.has(c)), [allColumns, hidden]);

  return { hidden, toggle, showAll, isVisible, visibleKeys };
}
