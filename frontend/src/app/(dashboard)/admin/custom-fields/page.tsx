'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from '@/components/ui/alert-dialog';
import { CustomField, ENTITY_TYPES, FIELD_TYPES, customFieldSchema } from '@/lib/schemas/admin';
import {
  useCustomFields,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
  useReorderCustomFields,
} from '@/hooks/useCustomFields';
import { ZodError } from 'zod';

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: '📝 Texto',
  number: '🔢 Número',
  date: '📅 Fecha',
  select: '📋 Selección',
  boolean: '✓ Booleano',
  url: '🔗 URL',
  user_ref: '👤 Referencia Usuario',
};

export default function CustomFieldsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('vulnerabilidad');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [previewField, setPreviewField] = useState<CustomField | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CustomField>>({
    field_type: 'text',
    is_required: false,
    is_searchable: false,
    order: 0,
  });

  const { data: response, isLoading, error } = useCustomFields(page, 20, search, activeTab);
  const createMutation = useCreateCustomField();
  const updateMutation = useUpdateCustomField(editingField?.id || '');
  const deleteMutation = useDeleteCustomField();
  const reorderMutation = useReorderCustomFields();

  const fields = useMemo(() => {
    if (!response?.data) return [];
    const filtered = response.data.filter((f: CustomField) => !f.deleted_at);
    return filtered.sort((a: CustomField, b: CustomField) => (a.order || 0) - (b.order || 0));
  }, [response]);

  const totalCount = response?.pagination?.total || 0;
  const totalPages = response?.pagination?.total_pages || 1;

  const handleOpenForm = (field?: CustomField) => {
    if (field) {
      setEditingField(field);
      setFormData(field);
    } else {
      setEditingField(null);
      setFormData({
        entity_type: activeTab as typeof ENTITY_TYPES[number],
        field_type: 'text',
        is_required: false,
        is_searchable: false,
        order: fields.length,
      });
    }
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      const payload: Partial<CustomField> = {
        name: formData.name || '',
        field_type: formData.field_type || 'text',
        entity_type: (formData.entity_type || activeTab) as typeof ENTITY_TYPES[number],
        label: formData.label,
        description: formData.description,
        is_required: formData.is_required || false,
        is_searchable: formData.is_searchable || false,
        order: formData.order || 0,
        config: formData.config,
      };

      customFieldSchema.parse(payload);

      if (editingField?.id) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload as Omit<CustomField, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>);
      }

      setIsFormOpen(false);
      setEditingField(null);
      setFormData({});
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((error) => {
          const path = String(error.path[0] || 'general');
          errors[path] = error.message;
        });
        setFormErrors(errors);
      }
    }
  };

  const handleDeleteClick = (field: CustomField) => {
    setDeleteFieldId(field.id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteFieldId) {
      await deleteMutation.mutateAsync(deleteFieldId);
      setIsDeleteOpen(false);
      setDeleteFieldId(null);
    }
  };

  const handlePreview = (field: CustomField) => {
    setPreviewField(field);
    setIsPreviewOpen(true);
  };

  // Drag-Drop handlers
  const handleDragStart = (e: React.DragEvent, field: CustomField) => {
    setDraggedItemId(field.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetField: CustomField) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetField.id) {
      setDraggedItemId(null);
      return;
    }

    // Encontrar índices
    const draggedIdx = fields.findIndex((f: CustomField) => f.id === draggedItemId);
    const targetIdx = fields.findIndex((f: CustomField) => f.id === targetField.id);

    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedItemId(null);
      return;
    }

    // Crear nuevos órdenes
    const updates = fields.map((field: CustomField, idx: number) => {
      let newOrder = field.order || idx;
      if (idx === draggedIdx) newOrder = targetField.order || targetIdx;
      else if (draggedIdx < targetIdx && idx > draggedIdx && idx <= targetIdx) newOrder = (field.order || idx) - 1;
      else if (draggedIdx > targetIdx && idx < draggedIdx && idx >= targetIdx) newOrder = (field.order || idx) + 1;

      return { id: field.id, order: newOrder };
    });

    await reorderMutation.mutateAsync(updates);
    setDraggedItemId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Fields</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona campos personalizados para cada tipo de entidad (arrastra para reordenar)
          </p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Crear Campo
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar campos por nombre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Tabs por Entity Type */}
      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        setPage(1);
        setSearch('');
      }}>
        <TabsList className="grid w-full grid-cols-5">
          {ENTITY_TYPES.map((type) => (
            <TabsTrigger key={type} value={type} className="capitalize">
              {type.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        {ENTITY_TYPES.map((type) => (
          <TabsContent key={type} value={type}>
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">Cargando...</div>
            )}
            {error && (
              <div className="text-center py-8 text-destructive">Error cargando datos</div>
            )}
            {fields.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                No hay campos personalizados para esta entidad
              </div>
            )}

            {fields.length > 0 && (
              <div className="space-y-3">
                {fields.map((field: CustomField) => (
                  <Card
                    key={field.id}
                    className={`hover:shadow-md transition-all ${
                      draggedItemId === field.id ? 'opacity-50' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, field)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, field)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab active:cursor-grabbing" />
                          <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{field.name}</h3>
                            <Badge variant="primary">
                              {FIELD_TYPE_LABELS[field.field_type]}
                            </Badge>
                              {field.is_required && (
                                <Badge variant="primary">Requerido</Badge>
                              )}
                              {field.is_searchable && (
                                <Badge variant="success">Searchable</Badge>
                              )}
                            </div>
                            {field.label && (
                              <p className="text-sm text-muted-foreground">
                                Label: <span className="font-medium">{field.label}</span>
                              </p>
                            )}
                            {field.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {field.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(field)}
                            title="Vista previa"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(field)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(field)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Editar Campo' : 'Crear Nuevo Campo'}
            </DialogTitle>
            <DialogDescription>
              Define un nuevo campo personalizado para {activeTab}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium">Nombre del campo *</label>
              <Input
                value={formData.name || ''}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="ej: severidad_custom, riesgo_especifico"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Field Type */}
            <div>
              <label className="text-sm font-medium">Tipo de campo *</label>
              <select
                value={formData.field_type || 'text'}
                onChange={(e) => handleFormChange('field_type', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {FIELD_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Label */}
            <div>
              <label className="text-sm font-medium">Etiqueta (Label)</label>
              <Input
                value={formData.label || ''}
                onChange={(e) => handleFormChange('label', e.target.value)}
                placeholder="ej: Severidad Personalizada"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe el propósito de este campo"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Is Required */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_required || false}
                  onChange={(e) => handleFormChange('is_required', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Campo requerido</span>
              </label>

              {/* Is Searchable */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_searchable || false}
                  onChange={(e) => handleFormChange('is_searchable', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Searchable</span>
              </label>
            </div>

            {/* Config (JSON) */}
            <div>
              <label className="text-sm font-medium">Configuración (JSON)</label>
              <textarea
                value={formData.config || ''}
                onChange={(e) => handleFormChange('config', e.target.value)}
                placeholder='{"options": [{"label": "Opción 1", "value": "opt1"}]}'
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm font-mono"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para select: {`{"options": [{"label": "...", "value": "..."}]}`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : editingField
                  ? 'Actualizar'
                  : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista Previa - {previewField?.name}</DialogTitle>
          </DialogHeader>

          {previewField && (
            <div className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>{previewField.label || previewField.name}</CardTitle>
                  {previewField.description && (
                    <CardDescription>{previewField.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">{previewField.label || previewField.name}</label>
                      <div className="mt-2 p-3 border border-input rounded-md bg-muted/50 text-muted-foreground text-sm">
                        [Preview: {FIELD_TYPE_LABELS[previewField.field_type]}]
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Tipo</span>
                        <p className="text-sm font-medium mt-1">
                          {FIELD_TYPE_LABELS[previewField.field_type]}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Nombre técnico</span>
                        <p className="text-sm font-medium mt-1 font-mono">{previewField.name}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Requerido</span>
                        <p className="text-sm font-medium mt-1">
                          {previewField.is_required ? '✓ Sí' : '✗ No'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Searchable</span>
                        <p className="text-sm font-medium mt-1">
                          {previewField.is_searchable ? '✓ Sí' : '✗ No'}
                        </p>
                      </div>
                    </div>

                    {previewField.config && (
                      <div className="pt-4 border-t">
                        <span className="text-xs font-medium text-muted-foreground">Configuración</span>
                        <pre className="text-xs font-mono bg-muted p-2 rounded mt-2 overflow-auto max-h-40">
                          {previewField.config}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar campo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar este campo personalizado? Esta acción no es reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
