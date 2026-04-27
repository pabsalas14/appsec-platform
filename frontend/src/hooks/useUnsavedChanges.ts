import { useCallback, useEffect } from 'react';

type Options = {
  enabled: boolean;
  message?: string;
};

const DEFAULT_MESSAGE = 'Tienes cambios sin guardar. Si sales ahora, los perderás.';

/**
 * Evita cierre accidental de pestaña/recarga y expone helper para confirmar descartes
 * al cerrar Dialog/Sheet o navegar manualmente desde UI.
 */
export function useUnsavedChanges({ enabled, message = DEFAULT_MESSAGE }: Options) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled, message]);

  const confirmIfNeeded = useCallback(() => {
    if (!enabled) return true;
    return window.confirm(message);
  }, [enabled, message]);

  return { confirmIfNeeded };
}

