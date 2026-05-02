'use client';

import { useCallback, useEffect } from 'react';

type Opts = { enabled: boolean };

export function useUnsavedChanges(enabled: boolean): void;
export function useUnsavedChanges(opts: Opts): { confirmIfNeeded: () => boolean };
export function useUnsavedChanges(
  enabledOrOpts: boolean | Opts,
): void | { confirmIfNeeded: () => boolean } {
  const isOpts = typeof enabledOrOpts !== 'boolean';
  const enabled = isOpts ? enabledOrOpts.enabled : enabledOrOpts;

  useEffect(() => {
    if (!enabled) return undefined;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);

  const confirmIfNeeded = useCallback((): boolean => {
    if (!enabled) return true;
    return typeof window !== 'undefined' ? window.confirm('¿Descartar cambios sin guardar?') : true;
  }, [enabled]);

  if (!isOpts) {
    return;
  }

  return { confirmIfNeeded };
}
