'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface DeleteConfirmProps {
  isOpen: boolean;
  isLoading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirm({
  isOpen,
  isLoading = false,
  title = 'Confirmar eliminación',
  message = '¿Está seguro? Esta acción no se puede deshacer.',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isDangerous = true,
  onConfirm,
  onCancel,
}: DeleteConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-foreground">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading} data-testid="delete-cancel">
            {cancelText}
          </Button>
          <Button
            variant={isDangerous ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isLoading}
            data-testid="delete-confirm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
