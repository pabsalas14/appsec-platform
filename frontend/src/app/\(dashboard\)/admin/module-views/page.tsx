'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '../components/DataTable';
import { FormModal } from '../components/FormModal';
import { DeleteConfirm } from '../components/DeleteConfirm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { moduleViewSchema, ModuleView } from '@/lib/schemas/admin';
import { ZodError } from 'zod';

export default function ModuleViewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<ModuleView>>({
    tipo: 'table',
  });

  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['module-views', page, search],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/module-views', {
        params: { page, page_size: 20, search },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ModuleView>) => {
      const validated = moduleViewSchema.parse(data);
      const { data: result } = await api.post('/api/v1/admin/module-views', validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-views'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ModuleView>) => {
      if (!editingId) throw new Error('No ID provided');
      const validated = moduleViewSchema.parse(data);
      const { data: result } = await api.put(`/api/v1/admin/module-views/${editingId}`, validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-views'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/admin/module-views/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-views'] });
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setFormData({ tipo: 'table' });
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

  const handleEdit = (row: ModuleView) => {
    setEditingId(row.id || null);
    setFormData(row);
    setIsFormOpen(true);
  };

  const handleDelete = (row: ModuleView) => {
    setDeleteId(row.id || null);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  const moduleViews = response?.data || [];
  const totalCount = response?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Module Views</h1>
          <p className="text-sm text-muted-foreground">Gestiona las vistas personalizadas de módulos</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsFormOpen(true)}
          data-testid="create-module-view"
        >
          Crear nuevo
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'module_name', label: 'Módulo' },
          { key: 'nombre', label: 'Nombre' },
          { key: 'tipo', label: 'Tipo', render: (val) => <span className="capitalize">{val}</span> },
          {
            key: 'deleted_at',
            label: 'Estado',
            render: (val) => (
              <span className={val ? 'text-red-500' : 'text-green-500'}>
                {val ? 'Eliminado' : 'Activo'}
              </span>
            ),
          },
        ]}
        data={moduleViews.filter((v: ModuleView) => !v.deleted_at)}
        isLoading={isLoading}
        error={error ? 'Error cargando datos' : undefined}
        totalCount={totalCount}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Buscar por módulo o nombre..."
        actions={[
          { label: 'Editar', onClick: handleEdit, variant: 'ghost' },
          { label: 'Eliminar', onClick: handleDelete, variant: 'danger' },
        ]}
      />

      <FormModal
        isOpen={isFormOpen}
        title={editingId ? 'Editar Module View' : 'Crear nuevo Module View'}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre del módulo</label>
            <Input
              value={formData.module_name || ''}
              onChange={(e) => handleFormChange('module_name', e.target.value)}
              placeholder="ej: vulnerabilities"
              data-testid="field-module_name"
              className={formErrors.module_name ? 'border-red-500' : ''}
            />
            {formErrors.module_name && (
              <p className="text-xs text-red-500 mt-1">{formErrors.module_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre de vista</label>
            <Input
              value={formData.nombre || ''}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              placeholder="ej: Vista principal"
              data-testid="field-nombre"
              className={formErrors.nombre ? 'border-red-500' : ''}
            />
            {formErrors.nombre && (
              <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tipo de vista</label>
            <Select
              value={formData.tipo || 'table'}
              onChange={(value) => handleFormChange('tipo', value)}
              options={[
                { value: 'table', label: 'Tabla' },
                { value: 'kanban', label: 'Kanban' },
                { value: 'calendar', label: 'Calendario' },
                { value: 'cards', label: 'Tarjetas' },
              ]}
              data-testid="field-tipo"
            />
          </div>
        </div>
      </FormModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        isLoading={deleteMutation.isPending}
        message="¿Está seguro que desea eliminar este module view? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
