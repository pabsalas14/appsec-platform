'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger, Button, Card, CardContent, DataTable, DataTableBody,
  DataTableCell, DataTableHead, DataTableRow, DataTableTh, Dialog, DialogClose,
  DialogContent, DialogHeader, DialogTitle, DialogTrigger, EmptyState, Input,
  PageHeader, PageWrapper, Select, Textarea,
} from '@/components/ui';
import { useActualizacionIniciativas, useCreateActualizacionIniciativa, useUpdateActualizacionIniciativa, useDeleteActualizacionIniciativa } from '@/hooks/useActualizacionIniciativas';
import { useIniciativas } from '@/hooks/useIniciativas';
import { ActualizacionIniciativaCreateSchema, type ActualizacionIniciativa } from '@/lib/schemas/actualizacion_iniciativa.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = ActualizacionIniciativaCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function ActualizacionIniciativasPage() {
  const actualizacionesQuery = useActualizacionIniciativas();
  const items = actualizacionesQuery?.data ?? [];
  const isLoading = Boolean(actualizacionesQuery?.isLoading);
  const iniciativasQuery = useIniciativas();
  const iniciativas = iniciativasQuery?.data ?? [];
  const createMut = useCreateActualizacionIniciativa();
  const updateMut = useUpdateActualizacionIniciativa();
  const deleteMut = useDeleteActualizacionIniciativa();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActualizacionIniciativa | null>(null);

  const iniciativaOpts = iniciativas.map((i) => ({ value: i.id, label: i.titulo ?? i.id }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { titulo: '', contenido: '', iniciativa_id: '' },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ titulo: '', contenido: '', iniciativa_id: iniciativaOpts[0]?.value ?? '' });
    setCreateOpen(true);
  }, [form, iniciativaOpts]);

  const openEdit = useCallback((item: ActualizacionIniciativa) => {
    form.reset({ titulo: item.titulo, contenido: item.contenido, iniciativa_id: item.iniciativa_id });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, ...values });
        toast.success('Actualización guardada');
        setEditTarget(null);
      } else {
        await createMut.mutateAsync(values);
        toast.success('Actualización creada');
        setCreateOpen(false);
      }
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Actualización eliminada');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  const dialogForm = (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium">Iniciativa *</label>
        <Select className="mt-1" value={form.watch('iniciativa_id')} onChange={(e) => form.setValue('iniciativa_id', e.target.value, { shouldValidate: true })} options={iniciativaOpts} />
      </div>
      <div>
        <label className="text-sm font-medium">Título *</label>
        <Input className="mt-1" maxLength={255} {...form.register('titulo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Contenido *</label>
        <Textarea className="mt-1" rows={4} {...form.register('contenido')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={() => { setEditTarget(null); form.reset(); }}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
          {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editTarget ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Actualizaciones de Iniciativas" description="Registro de avances y novedades de las iniciativas de seguridad.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen} disabled={!iniciativaOpts.length}><Plus className="mr-2 h-4 w-4" />Nueva actualización</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nueva actualización</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={FileText} title="Sin actualizaciones" description="Registra la primera actualización con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Título</DataTableTh>
                  <DataTableTh>Contenido</DataTableTh>
                  <DataTableTh>Fecha</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-[200px] truncate">{item.titulo}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground max-w-xs truncate">{item.contenido}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{formatDate(item.created_at)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Editar actualización</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar actualización</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void onDelete(item.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
