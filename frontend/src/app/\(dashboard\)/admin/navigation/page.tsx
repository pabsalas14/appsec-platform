'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '../components/DataTable';
import { FormModal } from '../components/FormModal';
import { DeleteConfirm } from '../components/DeleteConfirm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { navigationItemSchema, NavigationItem } from '@/lib/schemas/admin';
import { ZodError } from 'zod';
import { GripVertical } from 'lucide-react';

export default function NavigationPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<NavigationItem>>({
    visible: true,
    orden: 0,
  });

  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['navigation-items', page, search],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/navigation', {
        params: { page, page_size: 20, search },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<NavigationItem>) => {
      const validated = navigationItemSchema.parse(data);
      const { data: result } = await api.post('/api/v1/admin/navigation', validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<NavigationItem>) => {
      if (!editingId) throw new Error('No ID provided');
      const validated = navigationItemSchema.parse(data);
      const { data: result } = await api.put(`/api/v1/admin/navigation/${editingId}`, validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      resetForm();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (params: { id: string; orden: number }) => {
      const { data } = await api.patch(`/api/v1/admin/navigation/${params.id}/reorder`, {
        orden: params.orden,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/admin/navigation/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setFormData({ visible: true, orden: 0 });
    setFormErrors({});
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      const mutation = editingId ? updateMutation : createMutation;
      await mutation.mutateAsync(formData);
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          const path = error.path[0];
          if (typeof path === 'string') {
            errors[path] = error.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  const handleEdit = (row: NavigationItem) => {
    setEditingId(row.id || null);
    setFormData(row);
    setIsFormOpen(true);
  };

  const handleDelete = (row: NavigationItem) => {
    setDeleteId(row.id || null);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string, index: number) => {
    if (draggedId && draggedId !== targetId) {
      await reorderMutation.mutateAsync({
        id: draggedId,
        orden: index,
      });
      setDraggedId(null);
    }
  };

  const navigationItems = response?.data || [];
  const totalCount = response?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Navegación</h1>
          <p className="text-sm text-muted-foreground">Gestiona elementos del menú de navegación</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsFormOpen(true)}
          data-testid="create-nav-item"
        >
          Crear nuevo
        </Button>
      </div>

      <DataTable
        columns={[
          {
            key: 'label',
            label: 'Etiqueta',
            render: (val, row: NavigationItem) => (
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <span>{val}</span>
                {row.parent_id && (
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                    Submenu
                  </span>
                )}
              </div>
            ),
          },
          { key: 'icon', label: 'Icono', render: (val) => val || '-' },
          { key: 'href', label: 'Ruta', render: (val) => val || '-' },
          {
            key: 'orden',
            label: 'Orden',
            render: (val) => <span className="font-mono">{val}</span>,
          },
          {
            key: 'visible',
            label: 'Visible',
            render: (val) => (val ? '✓' : '✗'),
          },
          {
            key: 'required_role',
            label: 'Rol requerido',
            render: (val) => val || 'Ninguno',
          },
        ]}
        data={navigationItems.filter((n: NavigationItem) => !n.deleted_at)}
        isLoading={isLoading}
        error={error ? 'Error cargando datos' : undefined}
        totalCount={totalCount}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Buscar por etiqueta..."
        actions={[
          { label: 'Editar', onClick: handleEdit, variant: 'ghost' },
          { label: 'Eliminar', onClick: handleDelete, variant: 'danger' },
        ]}
      />

      <FormModal
        isOpen={isFormOpen}
        title={editingId ? 'Editar elemento de navegación' : 'Crear nuevo elemento de navegación'}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Etiqueta</label>
            <Input
              value={formData.label || ''}
              onChange={(e) => handleFormChange('label', e.target.value)}
              placeholder="ej: Vulnerabilidades"
              data-testid="field-label"
              className={formErrors.label ? 'border-red-500' : ''}
            />
            {formErrors.label && (
              <p className="text-xs text-red-500 mt-1">{formErrors.label}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Icono</label>
            <Input
              value={formData.icon || ''}
              onChange={(e) => handleFormChange('icon', e.target.value)}
              placeholder="ej: Shield, AlertTriangle"
              data-testid="field-icon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ruta</label>
            <Input
              value={formData.href || ''}
              onChange={(e) => handleFormChange('href', e.target.value)}
              placeholder="ej: /vulnerabilities"
              data-testid="field-href"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Orden</label>
              <Input
                type="number"
                value={formData.orden || 0}
                onChange={(e) => handleFormChange('orden', parseInt(e.target.value))}
                placeholder="0"
                data-testid="field-orden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Rol requerido</label>
              <Input
                value={formData.required_role || ''}
                onChange={(e) => handleFormChange('required_role', e.target.value)}
                placeholder="ej: admin"
                data-testid="field-required_role"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visible"
              checked={formData.visible || false}
              onChange={(e) => handleFormChange('visible', e.target.checked)}
              className="rounded"
              data-testid="field-visible"
            />
            <label htmlFor="visible" className="text-sm font-medium text-foreground cursor-pointer">
              Visible
            </label>
          </div>
        </div>
      </FormModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        isLoading={deleteMutation.isPending}
        message="¿Está seguro que desea eliminar este elemento de navegación?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
