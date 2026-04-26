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
import { Textarea } from '@/components/ui/Textarea';
import { validationRuleSchema, ValidationRule } from '@/lib/schemas/admin';
import { ZodError } from 'zod';
import { Play } from 'lucide-react';

const ENTITY_TYPES = [
  'vulnerabilidad',
  'iniciativa',
  'auditoria',
  'tema_emergente',
  'proyecto',
];

const RULE_TYPES = ['required', 'regex', 'range', 'custom'];

export default function ValidationRulesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [testData, setTestData] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<ValidationRule>>({
    rule_type: 'required',
    enabled: true,
  });

  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['validation-rules', page, search],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/validation-rules', {
        params: { page, page_size: 20, search },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ValidationRule>) => {
      const validated = validationRuleSchema.parse(data);
      const { data: result } = await api.post('/api/v1/admin/validation-rules', validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-rules'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ValidationRule>) => {
      if (!editingId) throw new Error('No ID provided');
      const validated = validationRuleSchema.parse(data);
      const { data: result } = await api.put(`/api/v1/admin/validation-rules/${editingId}`, validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-rules'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/admin/validation-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-rules'] });
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('No ID provided');
      const { data } = await api.post(`/api/v1/admin/validation-rules/${editingId}/test`, {
        sample_data: JSON.parse(testData),
      });
      return data;
    },
  });

  const resetForm = () => {
    setFormData({ rule_type: 'required', enabled: true });
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

  const handleEdit = (row: ValidationRule) => {
    setEditingId(row.id || null);
    setFormData(row);
    setIsFormOpen(true);
  };

  const handleDelete = (row: ValidationRule) => {
    setDeleteId(row.id || null);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  const handleTest = async (row: ValidationRule) => {
    setEditingId(row.id || null);
    setTestData(JSON.stringify({ sample: 'value' }, null, 2));
    setIsTestOpen(true);
  };

  const handleRunTest = async () => {
    try {
      const result = await testMutation.mutateAsync();
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: 'Error al ejecutar el test' });
    }
  };

  const validationRules = response?.data || [];
  const totalCount = response?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Validation Rules</h1>
          <p className="text-sm text-muted-foreground">Gestiona reglas de validación por entidad</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsFormOpen(true)}
          data-testid="create-validation-rule"
        >
          Crear nueva
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'entity_type', label: 'Entidad', render: (val) => <span className="capitalize">{val}</span> },
          { key: 'nombre', label: 'Nombre' },
          { key: 'rule_type', label: 'Tipo', render: (val) => <span className="capitalize">{val}</span> },
          {
            key: 'enabled',
            label: 'Estado',
            render: (val) => (
              <span className={val ? 'text-green-500' : 'text-gray-500'}>
                {val ? 'Habilitada' : 'Deshabilitada'}
              </span>
            ),
          },
          {
            key: 'deleted_at',
            label: 'Eliminado',
            render: (val) => (val ? 'Sí' : 'No'),
          },
        ]}
        data={validationRules.filter((r: ValidationRule) => !r.deleted_at)}
        isLoading={isLoading}
        error={error ? 'Error cargando datos' : undefined}
        totalCount={totalCount}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Buscar por nombre..."
        actions={[
          { label: 'Test', onClick: handleTest, variant: 'ghost' },
          { label: 'Editar', onClick: handleEdit, variant: 'ghost' },
          { label: 'Eliminar', onClick: handleDelete, variant: 'danger' },
        ]}
      />

      <FormModal
        isOpen={isFormOpen}
        title={editingId ? 'Editar Validation Rule' : 'Crear nueva Validation Rule'}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Entidad</label>
            <Select
              value={formData.entity_type || ''}
              onChange={(value) => handleFormChange('entity_type', value)}
              options={ENTITY_TYPES.map((t) => ({ value: t, label: t }))}
              data-testid="field-entity_type"
            />
            {formErrors.entity_type && (
              <p className="text-xs text-red-500 mt-1">{formErrors.entity_type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
            <Input
              value={formData.nombre || ''}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              placeholder="ej: validar_severidad"
              data-testid="field-nombre"
              className={formErrors.nombre ? 'border-red-500' : ''}
            />
            {formErrors.nombre && (
              <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tipo de regla</label>
            <Select
              value={formData.rule_type || 'required'}
              onChange={(value) => handleFormChange('rule_type', value)}
              options={RULE_TYPES.map((t) => ({ value: t, label: t }))}
              data-testid="field-rule_type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Condición (JSON)</label>
            <Textarea
              value={typeof formData.condition === 'string' ? formData.condition : JSON.stringify(formData.condition || {}, null, 2)}
              onChange={(e) => handleFormChange('condition', e.target.value)}
              placeholder='{"field": "value"}'
              rows={4}
              data-testid="field-condition"
              className={formErrors.condition ? 'border-red-500' : ''}
            />
            {formErrors.condition && (
              <p className="text-xs text-red-500 mt-1">{formErrors.condition}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled || false}
              onChange={(e) => handleFormChange('enabled', e.target.checked)}
              className="rounded"
              data-testid="field-enabled"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-foreground cursor-pointer">
              Habilitada
            </label>
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={isTestOpen}
        title="Test de Validation Rule"
        onSubmit={handleRunTest}
        onCancel={() => setIsTestOpen(false)}
        submitText="Ejecutar Test"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Datos de prueba (JSON)</label>
            <Textarea
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              rows={4}
              data-testid="field-test-data"
            />
          </div>
          {testResult && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <pre className="text-xs text-foreground overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </FormModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        isLoading={deleteMutation.isPending}
        message="¿Está seguro que desea eliminar esta validation rule?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
