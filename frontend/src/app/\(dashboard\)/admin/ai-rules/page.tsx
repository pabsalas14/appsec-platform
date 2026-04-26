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
import { aiRuleSchema, AIRule } from '@/lib/schemas/admin';
import { ZodError } from 'zod';
import { Play } from 'lucide-react';

const TRIGGER_TYPES = ['event', 'schedule', 'manual'];
const ACTION_TYPES = ['create', 'update', 'notify', 'execute'];

export default function AIRulesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<AIRule>>({
    trigger_type: 'event',
    action_type: 'create',
    enabled: true,
  });

  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['ai-rules', page, search],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/ai-rules', {
        params: { page, page_size: 20, search },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<AIRule>) => {
      const validated = aiRuleSchema.parse(data);
      const { data: result } = await api.post('/api/v1/admin/ai-rules', validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-rules'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AIRule>) => {
      if (!editingId) throw new Error('No ID provided');
      const validated = aiRuleSchema.parse(data);
      const { data: result } = await api.put(`/api/v1/admin/ai-rules/${editingId}`, validated);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-rules'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/admin/ai-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-rules'] });
      setIsDeleteOpen(false);
      setDeleteId(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('No ID provided');
      const { data } = await api.post(`/api/v1/admin/ai-rules/${editingId}/dry-run`, {
        config: formData,
      });
      return data;
    },
  });

  const resetForm = () => {
    setFormData({ trigger_type: 'event', action_type: 'create', enabled: true });
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

  const handleEdit = (row: AIRule) => {
    setEditingId(row.id || null);
    setFormData(row);
    setIsFormOpen(true);
  };

  const handleDelete = (row: AIRule) => {
    setDeleteId(row.id || null);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  const handleTest = (row: AIRule) => {
    setEditingId(row.id || null);
    setIsTestOpen(true);
    setTestResult(null);
  };

  const handleRunTest = async () => {
    try {
      const result = await testMutation.mutateAsync();
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: 'Error al ejecutar el dry-run' });
    }
  };

  const aiRules = response?.data || [];
  const totalCount = response?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Automation Rules</h1>
          <p className="text-sm text-muted-foreground">Gestiona reglas de automatización con IA</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsFormOpen(true)}
          data-testid="create-ai-rule"
        >
          Crear nueva
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'nombre', label: 'Nombre' },
          {
            key: 'trigger_type',
            label: 'Trigger',
            render: (val) => <span className="capitalize text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">{val}</span>,
          },
          {
            key: 'action_type',
            label: 'Acción',
            render: (val) => <span className="capitalize text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">{val}</span>,
          },
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
        data={aiRules.filter((r: AIRule) => !r.deleted_at)}
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
        title={editingId ? 'Editar AI Rule' : 'Crear nueva AI Rule'}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
            <Input
              value={formData.nombre || ''}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              placeholder="ej: auto_remediate_high_severity"
              data-testid="field-nombre"
              className={formErrors.nombre ? 'border-red-500' : ''}
            />
            {formErrors.nombre && (
              <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tipo de trigger</label>
              <Select
                value={formData.trigger_type || 'event'}
                onChange={(value) => handleFormChange('trigger_type', value)}
                options={TRIGGER_TYPES.map((t) => ({ value: t, label: t }))}
                data-testid="field-trigger_type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tipo de acción</label>
              <Select
                value={formData.action_type || 'create'}
                onChange={(value) => handleFormChange('action_type', value)}
                options={ACTION_TYPES.map((t) => ({ value: t, label: t }))}
                data-testid="field-action_type"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Configuración de trigger (JSON)</label>
            <Textarea
              value={typeof formData.trigger_config === 'string' ? formData.trigger_config : JSON.stringify(formData.trigger_config || {}, null, 2)}
              onChange={(e) => handleFormChange('trigger_config', e.target.value)}
              placeholder='{"event": "vulnerability.created", "condition": "severity === high"}'
              rows={3}
              data-testid="field-trigger_config"
              className={formErrors.trigger_config ? 'border-red-500' : ''}
            />
            {formErrors.trigger_config && (
              <p className="text-xs text-red-500 mt-1">{formErrors.trigger_config}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Configuración de acción (JSON)</label>
            <Textarea
              value={typeof formData.action_config === 'string' ? formData.action_config : JSON.stringify(formData.action_config || {}, null, 2)}
              onChange={(e) => handleFormChange('action_config', e.target.value)}
              placeholder='{"message": "Auto-remediating high severity vulnerability"}'
              rows={3}
              data-testid="field-action_config"
              className={formErrors.action_config ? 'border-red-500' : ''}
            />
            {formErrors.action_config && (
              <p className="text-xs text-red-500 mt-1">{formErrors.action_config}</p>
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
        title="Dry-run de AI Rule"
        onSubmit={handleRunTest}
        onCancel={() => setIsTestOpen(false)}
        submitText="Ejecutar Dry-run"
        isLoading={testMutation.isPending}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Prueba la regla sin ejecutarla en producción
          </p>
          {testResult && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg max-h-48 overflow-auto">
              <pre className="text-xs text-foreground font-mono">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </FormModal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        isLoading={deleteMutation.isPending}
        message="¿Está seguro que desea eliminar esta AI rule?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
