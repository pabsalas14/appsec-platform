'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useHitoIniciativas, useCreateHitoIniciativa, useUpdateHitoIniciativa, useDeleteHitoIniciativa } from '@/hooks/useHitoIniciativas';
import { useIniciativas } from '@/hooks/useIniciativas';
import { HitoIniciativaCreateSchema, type HitoIniciativa } from '@/lib/schemas/hito_iniciativa.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = HitoIniciativaCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function HitoIniciativasPage() {
  const { data: items = [], isLoading } = useHitoIniciativas();
  const { data: iniciativas = [] } = useIniciativas();
  const createMut = useCreateHitoIniciativa();
  const updateMut = useUpdateHitoIniciativa();
  const deleteMut = useDeleteHitoIniciativa();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HitoIniciativa | null>(null);

  const iniciativaOpts = iniciativas.map((i) => ({ value: i.id, label: i.nombre ?? i.id }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nombre: '', descripcion: null, fecha_objetivo: '', iniciativa_id: '' },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ nombre: '', descripcion: null, fecha_objetivo: '', iniciativa_id: iniciativaOpts[0]?.value ?? '' });
    setCreateOpen(true);
  }, [form, iniciativaOpts]);

  const openEdit = useCallback((item: HitoIniciativa) => {
    form.reset({ nombre: item.nombre, descripcion: item.descripcion ?? null, fecha_objetivo: item.fecha_objetivo?.slice(0, 16) ?? '', iniciativa_id: item.iniciativa_id });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, ...values });
        toast.success('Hito actualizado');
        setEditTarget(null);
      } else {
        await createMut.mutateAsync(values);
        toast.success('Hito creado');
        setCreateOpen(false);
      }
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar hito'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Hito eliminado');
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
        <label className="text-sm font-medium">Nombre *</label>
        <Input className="mt-1" maxLength={255} {...form.register('nombre')} />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} value={form.watch('descripcion') ?? ''} onChange={(e) => form.setValue('descripcion', e.target.value || null)} />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha objetivo *</label>
        <Input className="mt-1" type="datetime-local" {...form.register('fecha_objetivo')} />
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
      <PageHeader title="Hitos de Iniciativas" description="Milestones y fechas clave de las iniciativas de seguridad.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen} disabled={!iniciativaOpts.length}><Plus className="mr-2 h-4 w-4" />Nuevo hito</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nuevo hito</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={Flag} title="Sin hitos" description="Crea el primer hito con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Descripción</DataTableTh>
                  <DataTableTh>Fecha objetivo</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground max-w-xs truncate">{item.descripcion ?? '—'}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{formatDate(item.fecha_objetivo)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Editar hito</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar hito</AlertDialogTitle>
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
