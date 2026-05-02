'use client';

import { toast as sonnerToast } from 'sonner';

type LegacyToast = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

/**
 * Compat mínima con el patrón shadcn `{ title, description, variant }`.
 * Preferir `import { toast } from 'sonner'` en código nuevo.
 */
export function useToast() {
  const toast = (opts: LegacyToast) => {
    const msg = opts.title ?? opts.description ?? '';
    const rest = opts.description && opts.title !== opts.description ? { description: opts.description } : undefined;
    if (opts.variant === 'destructive') {
      sonnerToast.error(msg || 'Error', rest);
    } else {
      sonnerToast(msg, rest);
    }
  };
  return { toast };
}
