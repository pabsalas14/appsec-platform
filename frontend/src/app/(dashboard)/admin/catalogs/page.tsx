'use client';

import { useState } from 'react';
import { Plus, Loader2, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PageHeader,
  PageWrapper,
  Button,
  Input,
  Textarea,
  Badge,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useCatalogs, useCreateCatalog, useUpdateCatalog, useDeleteCatalog } from '@/hooks/useCatalogs';
import type { CatalogRead } from '@/lib/schemas/catalog.schema';

const catalogFormSchema = z.object({
  type: z.string().min(1, 'El tipo es requerido'),
  display_name: z.string().min(1, 'El nombre mostrable es requerido'),
  description: z.string().optional(),
  values: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      color: z.string().optional(),
      order: z.number().optional(),
      description: z.string().optional(),
    })
  ).optional(),
  is_active: z.boolean().optional(),
});

type CatalogFormValues = z.infer<typeof catalogFormSchema>;

export default function CatalogsPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const { data, isLoading } = useCatalogs(1, 50, undefined, searchQ);
  const createMutation = useCreateCatalog();
  const updateMutation = useUpdateCatalog(editingId || '');
  const deleteMutation = useDeleteCatalog();

  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      type: '',
      display_name: '',
      description: '',
      values: [],
      is_active: true,
    },
  });

  const onSubmit = async (values: CatalogFormValues) => {
    try {
      if (editingId) {
        const { type: _type, ...payload } = values;
        await updateMutation.mutateAsync(payload);
        setEditingId(null);
      } else {
        await createMutation.mutateAsync(values);
      }
      form.reset();
      setOpen(false);
    } catch (_error) {
      // Error ya es manejado por el hook
    }
  };

  const handleDelete = async (catalogId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este catálogo?')) return;
    await deleteMutation.mutateAsync(catalogId);
  };

  const handleEdit = (catalog: CatalogRead) => {
    form.reset(catalog);
    setEditingId(catalog.id);
    setOpen(true);
  };

  const handleNewClick = () => {
    form.reset({
      type: '',
      display_name: '',
      description: '',
      values: [],
      is_active: true,
    });
    setEditingId(null);
    setOpen(true);
  };

  const handleAddValue = () => {
    const currentValues = form.getValues('values') || [];
    form.setValue('values', [
      ...currentValues,
      { label: '', value: '', color: '#3b82f6', order: currentValues.length + 1 },
    ]);
  };

  const handleRemoveValue = (index: number) => {
    const currentValues = form.getValues('values') || [];
    form.setValue(
      'values',
      currentValues.filter((_, i) => i !== index)
    );
  };

  const handleMoveValue = (index: number, direction: 'up' | 'down') => {
    const currentValues = form.getValues('values') || [];
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === currentValues.length - 1)) {
      return;
    }
    const newValues = [...currentValues];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newValues[index], newValues[swapIndex]] = [newValues[swapIndex], newValues[index]];
    form.setValue('values', newValues);
  };

  const catalogs = data?.data || [];

  return (
    <PageWrapper>
      <PageHeader
        title="Gestión de Catálogos"
        description="Administra enumeraciones dinámicas sin hardcoding"
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por tipo o nombre..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
          <Button onClick={handleNewClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Catálogo
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Valores</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : catalogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay catálogos
                  </TableCell>
                </TableRow>
              ) : (
                catalogs.map((catalog: CatalogRead) => (
                  <TableRow key={catalog.id}>
                    <TableCell className="font-mono text-sm">{catalog.type}</TableCell>
                    <TableCell>{catalog.display_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                      {catalog.description || '—'}
                    </TableCell>
                    <TableCell>{(catalog.values || []).length} items</TableCell>
                    <TableCell>
                      <Badge variant={catalog.is_active ? 'default' : 'secondary'}>
                        {catalog.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(catalog)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(catalog.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Catálogo' : 'Crear Nuevo Catálogo'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo (identificador único)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="severidades" disabled={!!editingId} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Mostrable</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Severidades" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripción del catálogo..." />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Activo</FormLabel>
                      <FormDescription>
                        Los catálogos inactivos no aparecerán en la API pública
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Valores</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddValue}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Valor
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.watch('values')?.map((_, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <FormField
                            control={form.control}
                            name={`values.${index}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Etiqueta</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Crítica" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`values.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="critica" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`values.${index}.color`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Color</FormLabel>
                                <FormControl>
                                  <div className="flex gap-2">
                                    <Input type="color" {...field} className="w-12" />
                                    <Input {...field} placeholder="#dc2626" className="flex-1" />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex gap-1 ml-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveValue(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveValue(index, 'down')}
                            disabled={index === (form.watch('values')?.length || 0) - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveValue(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} type="button">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingId ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
