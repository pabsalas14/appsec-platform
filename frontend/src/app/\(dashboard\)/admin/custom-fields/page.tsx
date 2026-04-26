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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { customFieldSchema, CustomField } from '@/lib/schemas/admin';
import { ZodError } from 'zod';

const ENTITY_TYPES = [
  'vulnerabilidad',
  'iniciativa',
  'auditoria',
  'tema_emergente',
  'proyecto',
];

const FIELD_TYPES = ['string', 'number', 'boolean', 'date', 'json', 'enum'];

export default function CustomFieldsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('vulnerabilidad');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<CustomField>>({
    entity_type: 'vulnerabilidad',
    tipo_campo: 'string',
    required: false,
  });

  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['custom-fields', page, search, activeTab],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/custom-fields', {
        params: { page, page_size: 20, search, entity_type: activeTab },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CustomField>) => {
      const validated = customFieldSchema.parse(data);
      const { data: result } = await api.post('/api/v1/admin/custom-fields', validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CustomField>) => {
      if (!editingId) throw new Error('No ID provided');
      const validated = customFieldSchema.parse(data);
      const { data: result } = await api.put(`/api/v1/admin/custom-fields/${editingId}`, validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/admin/custom-fields/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setFormData({ entity_type: activeTab, tipo_campo: 'string', required: false });
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

  const handleEdit = (row: CustomField) => {
    setEditingId(row.id || null);
    setFormData(row);
    setIsFormOpen(true);
  };

  const handleDelete = (row: CustomField) => {
    setDeleteId(row.id || null);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  const customFields = response?.data || [];
  const totalCount = response?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custom Fields</h1>
          <p className="text-sm text-muted-foreground">Gestiona campos personalizados por entidad</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsFormOpen(true)}
          data-testid="create-custom-field"
        >
          Crear nuevo
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="entity-tabs">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          {ENTITY_TYPES.map((type) => (
            <TabsTrigger key={type} value={type} className="capitalize">
              {type.replace('_', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        {ENTITY_TYPES.map((type) => (
          <TabsContent key={type} value={type}>
            <DataTable
              columns={[
                { key: 'nombre', label: 'Nombre' },
                { key: 'tipo_campo', label: 'Tipo de campo', render: (val) => <span className="capitalize">{val}</span> },
                {
                  key: 'required',
                  label: 'Requerido',
                  render: (val) => (val ? '✓' : '✗'),
                },
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
              data={customFields.filter((f: CustomField) => !f.deleted_at)}
              isLoading={isLoading}
              error={error ? 'Error cargando datos' : undefined}
              totalCount={totalCount}
              page={page}
              pageSize={20}
              onPageChange={setPage}
              onSearch={setSearch}
              searchPlaceholder="Buscar por nombre..."
              actions={[
                { label: 'Editar', onClick: handleEdit, variant: 'ghost' },
                { label: 'Eliminar', onClick: handleDelete, variant: 'danger' },
              ]}
            />
          </TabsContent>
        ))}
      </Tabs>

      <FormModal
        isOpen={isFormOpen}
        title={editingId ? 'Editar Custom Field' : 'Crear nuevo Custom Field'}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre del campo</label>
            <Input
              value={formData.nombre || ''}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              placeholder="ej: severidad_custom"
              data-testid="field-nombre"
              className={formErrors.nombre ? 'border-red-500' : ''}
            />
            {formErrors.nombre && (
              <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tipo de campo</label>
            <Select
              value={formData.tipo_campo || 'string'}
              onChange={(value) => handleFormChange('tipo_campo', value)}
              options={FIELD_TYPES.map((t) => ({ value: t, label: t }))}
              data-testid="field-tipo_campo"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={formData.required || false}
              onChange={(e) => handleFormChange('required', e.target.checked)}
              className="rounded"
              data-testid="field-required"
            />
            <label htmlFor="required" className="text-sm font-medium text-foreground cursor-pointer">
              Campo requerido
            </label>
          </div>
        </div>
      </FormModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        isLoading={deleteMutation.isPending}
        message="¿Está seguro que desea eliminar este custom field?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
