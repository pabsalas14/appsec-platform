'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport matches the given CSS media query.
 *
 * @example
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setMatches(e.matches);

    // Set initial value
    handler(mql);

    mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, [query]);

  return matches;
}
