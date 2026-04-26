'use client';

import React, { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface FormModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  title: string;
  submitText?: string;
  cancelText?: string;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FormModal({
  isOpen,
  isLoading = false,
  title,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onSubmit,
  onCancel,
  children,
  size = 'md',
}: FormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size={size}>
      <div className="space-y-4">
        <div>{children}</div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading} data-testid="form-modal-cancel">
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={isLoading}
            data-testid="form-modal-submit"
          >
            {submitText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
