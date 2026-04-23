'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void | Promise<void>;
}

/**
 * A reusable confirmation dialog that replaces native `window.confirm()`.
 * Built on top of the shadcn AlertDialog component.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Confirm action',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' : undefined}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── useConfirm hook ───────────────────────────────────────────────────────

interface UseConfirmReturn {
  /** Whether the dialog is currently open */
  open: boolean;
  /** Open the dialog, storing the callback to run on confirm */
  confirm: (message: string, onConfirm: () => void | Promise<void>) => void;
  /** Props to spread on the ConfirmDialog component */
  dialogProps: Pick<ConfirmDialogProps, 'open' | 'onOpenChange' | 'description' | 'onConfirm'>;
}

/**
 * Hook that manages ConfirmDialog state. Usage:
 *
 * ```tsx
 * const { confirm, dialogProps } = useConfirm();
 *
 * const handleDelete = () => {
 *   confirm('Delete this item?', async () => {
 *     await api.delete(`/items/${id}`);
 *   });
 * };
 *
 * return (
 *   <>
 *     <Button onClick={handleDelete}>Delete</Button>
 *     <ConfirmDialog {...dialogProps} />
 *   </>
 * );
 * ```
 */
export function useConfirm(): UseConfirmReturn {
  const [open, setOpen] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const callbackRef = React.useRef<(() => void | Promise<void>) | null>(null);

  const confirm = React.useCallback(
    (message: string, onConfirm: () => void | Promise<void>) => {
      setDescription(message);
      callbackRef.current = onConfirm;
      setOpen(true);
    },
    [],
  );

  const handleConfirm = React.useCallback(async () => {
    await callbackRef.current?.();
  }, []);

  return {
    open,
    confirm,
    dialogProps: {
      open,
      onOpenChange: setOpen,
      description,
      onConfirm: handleConfirm,
    },
  };
}
