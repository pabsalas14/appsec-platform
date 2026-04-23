"use client";

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ui.sidebar.collapsed';

/**
 * Sidebar collapse state persisted to localStorage. SSR-safe — the first
 * client render reads the stored value and re-hydrates silently.
 */
export function useSidebarState(defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw !== null) setCollapsed(raw === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { collapsed, toggle, setCollapsed } as const;
}
