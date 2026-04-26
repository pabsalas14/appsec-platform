'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '../components/DataTable';
import { FormModal } from '../components/FormModal';
import { DeleteConfirm } from '../components/DeleteConfirm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { catalogSchema, Catalog } from '@/lib/schemas/admin';
import { ZodError } from 'zod';
import { Plus, Trash2 } from 'lucide-react';

export default function CatalogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<Catalog>>({
    activo: true,
    values: [],
  });

  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['catalogs', page, search],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/catalogs', {
        params: { page, page_size: 20, search },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Catalog>) => {
      const validated = catalogSchema.parse(data);
      const { data: result } = await api.post('/api/v1/admin/catalogs', validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Catalog>) => {
      if (!editingId) throw new Error('No ID provided');
      const validated = catalogSchema.parse(data);
      const { data: result } = await api.put(`/api/v1/admin/catalogs/${editingId}`, validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/admin/catalogs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setFormData({ activo: true, values: [] });
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

  const handleAddValue = () => {
    const values = Array.isArray(formData.values) ? formData.values : [];
    handleFormChange('values', [...values, '']);
  };

  const handleRemoveValue = (index: number) => {
    const values = Array.isArray(formData.values) ? formData.values : [];
    handleFormChange('values', values.filter((_, i) => i !== index));
  };

  const handleValueChange = (index: number, newValue: string) => {
    const values = Array.isArray(formData.values) ? formData.values : [];
    values[index] = newValue;
    handleFormChange('values', [...values]);
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

  const handleEdit = (row: Catalog) => {
    setEditingId(row.id || null);
    setFormData(row);
    setIsFormOpen(true);
  };

  const handleDelete = (row: Catalog) => {
    setDeleteId(row.id || null);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  const catalogs = response?.data || [];
  const totalCount = response?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogos</h1>
          <p className="text-sm text-muted-foreground">Gestiona catálogos y valores predefinidos</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsFormOpen(true)}
          data-testid="create-catalog"
        >
          Crear nuevo
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'tipo', label: 'Tipo' },
          { key: 'key', label: 'Clave' },
          {
            key: 'values',
            label: 'Valores',
            render: (val) => {
              const count = Array.isArray(val) ? val.length : 0;
              return <span>{count} elementos</span>;
            },
          },
          {
            key: 'activo',
            label: 'Estado',
            render: (val) => (
              <span className={val ? 'text-green-500' : 'text-gray-500'}>
                {val ? 'Activo' : 'Inactivo'}
              </span>
            ),
          },
          {
            key: 'deleted_at',
            label: 'Eliminado',
            render: (val) => (val ? 'Sí' : 'No'),
          },
        ]}
        data={catalogs.filter((c: Catalog) => !c.deleted_at)}
        isLoading={isLoading}
        error={error ? 'Error cargando datos' : undefined}
        totalCount={totalCount}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Buscar por tipo o clave..."
        actions={[
          { label: 'Editar', onClick: handleEdit, variant: 'ghost' },
          { label: 'Eliminar', onClick: handleDelete, variant: 'danger' },
        ]}
      />

      <FormModal
        isOpen={isFormOpen}
        title={editingId ? 'Editar Catálogo' : 'Crear nuevo Catálogo'}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
            <Input
              value={formData.tipo || ''}
              onChange={(e) => handleFormChange('tipo', e.target.value)}
              placeholder="ej: severidad, estado"
              data-testid="field-tipo"
              className={formErrors.tipo ? 'border-red-500' : ''}
            />
            {formErrors.tipo && (
              <p className="text-xs text-red-500 mt-1">{formErrors.tipo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Clave</label>
            <Input
              value={formData.key || ''}
              onChange={(e) => handleFormChange('key', e.target.value)}
              placeholder="ej: severidad_vulnerabilidad"
              data-testid="field-key"
              className={formErrors.key ? 'border-red-500' : ''}
            />
            {formErrors.key && (
              <p className="text-xs text-red-500 mt-1">{formErrors.key}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
            <Input
              value={formData.descripcion || ''}
              onChange={(e) => handleFormChange('descripcion', e.target.value)}
              placeholder="Descripción del catálogo"
              data-testid="field-descripcion"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">Valores</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddValue}
                data-testid="add-value"
              >
                <Plus className="w-4 h-4" /> Añadir
              </Button>
            </div>
            <div className="space-y-2">
              {Array.isArray(formData.values) && formData.values.map((val, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={val || ''}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                    placeholder={`Valor ${idx + 1}`}
                    data-testid={`value-${idx}`}
                  />
                  <Button
                    variant="danger"
                    size="icon"
                    onClick={() => handleRemoveValue(idx)}
                    data-testid={`remove-value-${idx}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo || false}
              onChange={(e) => handleFormChange('activo', e.target.checked)}
              className="rounded"
              data-testid="field-activo"
            />
            <label htmlFor="activo" className="text-sm font-medium text-foreground cursor-pointer">
              Activo
            </label>
          </div>
        </div>
      </FormModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        isLoading={deleteMutation.isPending}
        message="¿Está seguro que desea eliminar este catálogo?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
