'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Play, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

interface Formula {
  id: string;
  nombre: string;
  description: string | null;
  formula_text: string;
  motor: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface FormulaTestResult {
  success: boolean;
  result: unknown;
  error: string | null;
}

interface SupportedFunction {
  name: string;
  description: string;
  syntax: string;
}

const EMPTY_FORM = { nombre: '', description: '', formula_text: '', enabled: true };

export default function FormulaAdminPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [testFormulaId, setTestFormulaId] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('{}');
  const [testResult, setTestResult] = useState<FormulaTestResult | null>(null);
  const [showFunctions, setShowFunctions] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Fetch formulas
  const { data, isLoading } = useQuery({
    queryKey: ['admin-formulas'],
    queryFn: async () => {
      logger.info('admin.formulas.list');
      const res = await apiClient.get('/admin/formulas?limit=100');
      return res.data.data as { items: Formula[]; total: number };
    },
  });

  // Fetch supported functions
  const { data: functions } = useQuery({
    queryKey: ['admin-formulas-functions'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/formulas/functions/supported');
      return res.data.data as SupportedFunction[];
    },
    enabled: showFunctions,
  });

  // Create
  const createMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY_FORM) => {
      const res = await apiClient.post('/admin/formulas', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-formulas'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al guardar';
      setFormError(msg);
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<typeof EMPTY_FORM> }) => {
      const res = await apiClient.patch(`/admin/formulas/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-formulas'] });
      setEditingFormula(null);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al actualizar';
      setFormError(msg);
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/formulas/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-formulas'] }),
  });

  // Test formula
  const testMutation = useMutation({
    mutationFn: async ({ formula_text, data }: { formula_text: string; data: Record<string, unknown> }) => {
      const res = await apiClient.post('/admin/formulas/test', { formula_text, data });
      return res.data.data as FormulaTestResult;
    },
    onSuccess: (result) => setTestResult(result),
  });

  const handleSubmit = () => {
    if (!form.nombre.trim() || !form.formula_text.trim()) {
      setFormError('Nombre y fórmula son requeridos');
      return;
    }
    setFormError('');
    if (editingFormula) {
      updateMutation.mutate({ id: editingFormula.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (f: Formula) => {
    setEditingFormula(f);
    setForm({ nombre: f.nombre, description: f.description || '', formula_text: f.formula_text, enabled: f.enabled });
    setShowForm(true);
    setFormError('');
  };

  const openNew = () => {
    setEditingFormula(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setFormError('');
  };

  const handleTest = (formula: Formula) => {
    setTestFormulaId(formula.id);
    setTestInput('{}');
    setTestResult(null);
  };

  const runTest = () => {
    const formula = data?.items.find((f) => f.id === testFormulaId);
    if (!formula) return;
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(testInput);
    } catch {
      setTestResult({ success: false, result: null, error: 'JSON inválido en datos de prueba' });
      return;
    }
    testMutation.mutate({ formula_text: formula.formula_text, data: parsed });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formula Engine</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de fórmulas reutilizables para indicadores y reglas de validación
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFunctions(!showFunctions)}>
            <BookOpen className="h-4 w-4 mr-2" />
            {showFunctions ? 'Ocultar' : 'Ver'} funciones
          </Button>
          <Button size="sm" onClick={openNew} data-testid="new-formula-btn">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Fórmula
          </Button>
        </div>
      </div>

      {/* Funciones soportadas */}
      {showFunctions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Funciones disponibles en el motor</CardTitle>
          </CardHeader>
          <CardContent>
            {!functions ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {functions.map((fn) => (
                  <div key={fn.name} className="p-3 border rounded-lg bg-muted/30">
                    <p className="font-mono text-sm font-semibold text-blue-600">{fn.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fn.description}</p>
                    <p className="font-mono text-xs mt-1 text-green-700">{fn.syntax}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de fórmulas */}
      <Card>
        <CardHeader>
          <CardTitle>Fórmulas registradas</CardTitle>
          <CardDescription>{data?.total ?? 0} fórmula(s) en total</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !data?.items.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay fórmulas registradas.</p>
              <Button variant="link" onClick={openNew}>Crear la primera</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((formula) => (
                <div
                  key={formula.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  data-testid={`formula-row-${formula.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{formula.nombre}</p>
                      <Badge variant={formula.enabled ? 'default' : 'secondary'}>
                        {formula.enabled ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{formula.motor}</Badge>
                    </div>
                    {formula.description && (
                      <p className="text-sm text-muted-foreground truncate">{formula.description}</p>
                    )}
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block truncate">
                      {formula.formula_text}
                    </code>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Probar"
                      onClick={() => handleTest(formula)}
                      data-testid={`test-btn-${formula.id}`}
                    >
                      <Play className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      onClick={() => openEdit(formula)}
                      data-testid={`edit-btn-${formula.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Eliminar" data-testid={`delete-btn-${formula.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar fórmula?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La fórmula &quot;{formula.nombre}&quot; será eliminada.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(formula.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear / Editar */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setFormError(''); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFormula ? 'Editar Fórmula' : 'Nueva Fórmula'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="ej. Tasa de remediación mensual"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                data-testid="formula-nombre-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                placeholder="Descripción breve del propósito"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fórmula *</label>
              <Textarea
                placeholder="ej. percentage(closed_vulns, total_vulns)"
                value={form.formula_text}
                onChange={(e) => setForm((p) => ({ ...p, formula_text: e.target.value }))}
                rows={3}
                className="font-mono text-sm"
                data-testid="formula-text-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa las funciones disponibles (ver &quot;Ver funciones&quot; arriba).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={form.enabled}
                onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="enabled" className="text-sm">Fórmula activa</label>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setShowForm(false); setFormError(''); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="save-formula-btn"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Probar fórmula */}
      <Dialog open={!!testFormulaId} onOpenChange={(open) => { if (!open) { setTestFormulaId(null); setTestResult(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Probar Fórmula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm font-medium mb-1">Fórmula</p>
              <code className="block text-sm bg-muted px-3 py-2 rounded">
                {data?.items.find((f) => f.id === testFormulaId)?.formula_text}
              </code>
            </div>
            <div>
              <label className="text-sm font-medium">Datos de prueba (JSON)</label>
              <Textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={4}
                className="font-mono text-sm"
                placeholder='{"total_vulns": 100, "closed_vulns": 72}'
                data-testid="test-data-input"
              />
            </div>
            {testResult && (
              <div className={`p-3 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {testResult.success
                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                    : <XCircle className="h-4 w-4 text-red-600" />}
                  <span className="text-sm font-semibold">{testResult.success ? 'Éxito' : 'Error'}</span>
                </div>
                <code className="text-sm">
                  {testResult.success
                    ? JSON.stringify(testResult.result)
                    : testResult.error}
                </code>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setTestFormulaId(null); setTestResult(null); }}>
                Cerrar
              </Button>
              <Button
                onClick={runTest}
                disabled={testMutation.isPending}
                data-testid="run-test-btn"
              >
                <Play className="h-4 w-4 mr-2" />
                {testMutation.isPending ? 'Ejecutando...' : 'Ejecutar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
