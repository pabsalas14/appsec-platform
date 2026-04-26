'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';

interface NavigationItem {
  id?: string;
  label: string;
  href: string;
  icon?: string;
  orden: number;
  visible: boolean;
  required_role?: string;
  parent_id?: string;
}

interface NavigationFormModalProps {
  isOpen: boolean;
  item: NavigationItem | null;
  isLoading: boolean;
  allItems: NavigationItem[];
  onSubmit: (data: Partial<NavigationItem>) => Promise<void>;
  onClose: () => void;
}

export default function NavigationFormModal({
  isOpen,
  item,
  isLoading,
  allItems,
  onSubmit,
  onClose,
}: NavigationFormModalProps) {
  const [formData, setFormData] = useState<Partial<NavigationItem>>(
    item || {
      label: '',
      href: '',
      icon: '',
      orden: 0,
      visible: true,
      required_role: '',
      parent_id: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        label: '',
        href: '',
        icon: '',
        orden: 0,
        visible: true,
        required_role: '',
        parent_id: '',
      });
    }
    setErrors({});
  }, [isOpen, item]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.label?.trim()) {
      newErrors.label = 'La etiqueta es requerida';
    }
    if (!formData.href?.trim()) {
      newErrors.href = 'La ruta es requerida';
    }
    if (!formData.href?.startsWith('/')) {
      newErrors.href = 'La ruta debe comenzar con /';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dataToSubmit = {
      ...formData,
      parent_id: formData.parent_id || null,
      required_role: formData.required_role || null,
    };

    try {
      await onSubmit(dataToSubmit);
    } catch (_error) {
      // Error handled by mutation
    }
  };

  const parentOptions = allItems
    .filter((i) => !i.parent_id && i.id !== item?.id)
    .map((i) => ({
      label: i.label,
      value: i.id || '',
    }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>
            {item ? 'Editar elemento de navegación' : 'Crear nuevo elemento'}
          </Dialog.Title>
        </Dialog.Header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Etiqueta *</label>
            <Input
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="ej: Vulnerabilidades"
              disabled={isLoading}
              className={errors.label ? 'border-red-500' : ''}
            />
            {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ruta *</label>
            <Input
              value={formData.href || ''}
              onChange={(e) => setFormData({ ...formData, href: e.target.value })}
              placeholder="ej: /vulnerabilities"
              disabled={isLoading}
              className={errors.href ? 'border-red-500' : ''}
            />
            {errors.href && <p className="text-xs text-red-500 mt-1">{errors.href}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Icono</label>
            <Input
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="ej: shield-alert"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">Icono Lucide</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Orden</label>
              <Input
                type="number"
                value={formData.orden || 0}
                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                min="0"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rol requerido</label>
              <Input
                value={formData.required_role || ''}
                onChange={(e) => setFormData({ ...formData, required_role: e.target.value })}
                placeholder="ej: admin"
                disabled={isLoading}
              />
            </div>
          </div>

          {parentOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Elemento padre</label>
              <Select
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || undefined })}
                disabled={isLoading}
              >
                <option value="">Sin padre</option>
                {parentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visible"
              checked={formData.visible || false}
              onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
              disabled={isLoading}
              className="rounded"
            />
            <label htmlFor="visible" className="text-sm font-medium cursor-pointer">
              Visible
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} isLoading={isLoading}>
              {item ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
