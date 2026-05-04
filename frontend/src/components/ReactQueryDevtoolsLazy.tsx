'use client';

import dynamic from 'next/dynamic';

/** Lazy-loaded so production bundles omit the devtools chunk until needed in dev. */
export const ReactQueryDevtoolsLazy = dynamic(
  () => import('@tanstack/react-query-devtools').then((d) => d.ReactQueryDevtools),
  { ssr: false },
);
