'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';

interface CatalogValue {
  label: string;
  value: string;
  color?: string;
  order: number;
  description?: string;
}

interface Catalog {
  id: string;
  type: string;
  display_name: string;
  description?: string;
  values: CatalogValue[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePayload {
  type: string;
  display_name: string;
  description?: string;
  values: CatalogValue[];
}

interface UpdatePayload {
  display_name?: string;
  description?: string;
  values?: CatalogValue[];
  is_active?: boolean;
}

export default function CatalogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<CreatePayload>>({
    values: [],
  });

  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['catalogs', page, search],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        page_size: 20,
      };
      if (search) {
        params.q = search;
      }
      const { data } = await api.get('/api/v1/admin/catalogs', { params });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePayload) => {
      const { data: result } = await api.post('/api/v1/admin/catalogs', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      resetForm();
    },
    onError: (err: any) => {
      const message = err.response?.data?.detail || 'Error al crear catálogo';
      setFormErrors({ submit: message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdatePayload) => {
      if (!editingId) throw new Error('No ID provided');
      const { data: result } = await api.patch(`/api/v1/admin/catalogs/${editingId}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      resetForm();
    },
    onError: (err: any) => {
      const message = err.response?.data?.detail || 'Error al actualizar catálogo';
      setFormErrors({ submit: message });
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
    onError: (err: any) => {
      const message = err.response?.data?.detail || 'Error al eliminar catálogo';
      setFormErrors({ submit: message });
    },
  });

  const resetForm = () => {
    setFormData({ values: [] });
    setFormErrors({});
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddValue = () => {
    const values = Array.isArray(formData.values) ? formData.values : [];
    const newValue: CatalogValue = {
      label: '',
      value: '',
      order: values.length + 1,
      color: '#6b7280',
    };
    handleFormChange('values', [...values, newValue]);
  };

  const handleRemoveValue = (index: number) => {
    const values = Array.isArray(formData.values) ? formData.values : [];
    handleFormChange('values', values.filter((_, i) => i !== index));
  };

  const handleValueChange = (index: number, field: string, newValue: any) => {
    const values = Array.isArray(formData.values) ? [...formData.values] : [];
    if (values[index]) {
      values[index] = { ...values[index], [field]: newValue };
      handleFormChange('values', values);
    }
  };

  const handleMoveValue = (index: number, direction: 'up' | 'down') => {
    const values = Array.isArray(formData.values) ? [...formData.values] : [];
    if (direction === 'up' && index > 0) {
      [values[index - 1], values[index]] = [values[index], values[index - 1]];
    } else if (direction === 'down' && index < values.length - 1) {
      [values[index], values[index + 1]] = [values[index + 1], values[index]];
    }
    const reordered = values.map((v, i) => ({ ...v, order: i + 1 }));
    handleFormChange('values', reordered);
  };

  const handleSubmit = async () => {
    try {
      setFormErrors({});
      if (!formData.type && !editingId) {
        setFormErrors({ type: 'El tipo es obligatorio' });
        return;
      }
      if (!formData.display_name) {
        setFormErrors({ display_name: 'El nombre es obligatorio' });
        return;
      }

      if (editingId) {
        const payload: UpdatePayload = {};
        if (formData.display_name) payload.display_name = formData.display_name;
        if (formData.description !== undefined) payload.description = formData.description;
        if (formData.values) payload.values = formData.values;
        await updateMutation.mutateAsync(payload);
      } else {
        const payload: CreatePayload = {
          type: formData.type!,
          display_name: formData.display_name!,
          description: formData.description,
          values: formData.values || [],
        };
        await createMutation.mutateAsync(payload);
      }
    } catch (err) {
      // Error handling is in mutation callbacks
    }
  };

  const handleEdit = (row: Catalog) => {
    setEditingId(row.id);
    setFormData(row);
    setIsFormOpen(true);
  };

  const handleDelete = (row: Catalog) => {
    setDeleteId(row.id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  const catalogs = response?.data || [];
  const totalPages = response?.pages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogos</h1>
          <p className="text-sm text-muted-foreground">Gestiona catálogos y valores predefinidos</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingId(null);
            setFormData({ values: [] });
            setFormErrors({});
            setIsFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear catálogo
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por tipo o nombre..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* Catalogs List */}
      <div className="grid gap-4">
        {isLoading && <p className="text-muted-foreground">Cargando...</p>}
        {!isLoading && catalogs.length === 0 && (
          <p className="text-muted-foreground">No hay catálogos</p>
        )}
        {catalogs.map((catalog: Catalog) => (
          <Card key={catalog.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">{catalog.display_name}</h3>
                  <Badge variant={catalog.is_active ? 'default' : 'secondary'}>
                    {catalog.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Tipo: <code>{catalog.type}</code></p>
                {catalog.description && (
                  <p className="text-sm text-muted-foreground mb-2">{catalog.description}</p>
                )}
                {catalog.values.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-2">Valores ({catalog.values.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {catalog.values
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((v, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            style={v.color ? { borderColor: v.color } : undefined}
                          >
                            {v.label}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(catalog)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(catalog)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Catálogo' : 'Crear Catálogo'}
            </h2>

            <div className="space-y-4">
              {/* Type */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Tipo *
                  </label>
                  <Input
                    value={formData.type || ''}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    placeholder="ej: severidades"
                    disabled={!!editingId}
                  />
                  {formErrors.type && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.type}</p>
                  )}
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre *
                </label>
                <Input
                  value={formData.display_name || ''}
                  onChange={(e) => handleFormChange('display_name', e.target.value)}
                  placeholder="ej: Severidades de Vulnerabilidades"
                />
                {formErrors.display_name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.display_name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Descripción
                </label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Descripción del catálogo"
                  rows={2}
                />
              </div>

              {/* Values */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Valores</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddValue}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.isArray(formData.values) && formData.values.map((val, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-2 bg-secondary rounded">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveValue(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveValue(idx, 'up')}
                          disabled={idx === 0}
                        >
                          ▲
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveValue(idx, 'down')}
                          disabled={idx === (formData.values?.length || 0) - 1}
                        >
                          ▼
                        </Button>
                      </div>

                      <div className="flex-1 space-y-1">
                        <Input
                          value={val.label || ''}
                          onChange={(e) => handleValueChange(idx, 'label', e.target.value)}
                          placeholder="Label (ej: Crítica)"
                          size="sm"
                        />
                        <Input
                          value={val.value || ''}
                          onChange={(e) => handleValueChange(idx, 'value', e.target.value)}
                          placeholder="Value (ej: critica)"
                          size="sm"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={val.color || '#6b7280'}
                            onChange={(e) => handleValueChange(idx, 'color', e.target.value)}
                            className="w-12"
                          />
                          <Input
                            value={val.description || ''}
                            onChange={(e) => handleValueChange(idx, 'description', e.target.value)}
                            placeholder="Descripción (opcional)"
                            size="sm"
                          />
                        </div>
                      </div>

                      <Button
                        variant="danger"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveValue(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {formErrors.submit && (
                <p className="text-sm text-red-500">{formErrors.submit}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Guardando...'
                    : 'Guardar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Confirmar eliminación</h2>
            <p className="text-sm text-muted-foreground mb-4">
              ¿Está seguro que desea eliminar este catálogo?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteId(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
