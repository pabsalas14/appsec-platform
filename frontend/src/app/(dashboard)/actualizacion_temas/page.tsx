'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useActualizacionTemas, useCreateActualizacionTema, useUpdateActualizacionTema, useDeleteActualizacionTema } from '@/hooks/useActualizacionTemas';
import { useTemaEmergentes } from '@/hooks/useTemaEmergentes';
import { ActualizacionTemaCreateSchema, type ActualizacionTema } from '@/lib/schemas/actualizacion_tema.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = ActualizacionTemaCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function ActualizacionTemasPage() {
  const actualizacionesQuery = useActualizacionTemas();
  const items = actualizacionesQuery?.data ?? [];
  const isLoading = Boolean(actualizacionesQuery?.isLoading);
  const temasQuery = useTemaEmergentes();
  const temas = temasQuery?.data ?? [];
  const createMut = useCreateActualizacionTema();
  const updateMut = useUpdateActualizacionTema();
  const deleteMut = useDeleteActualizacionTema();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActualizacionTema | null>(null);

  const temaOpts = temas.map((t) => ({ value: t.id, label: t.titulo }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { titulo: '', contenido: '', fuente: null, tema_id: '' },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ titulo: '', contenido: '', fuente: null, tema_id: temaOpts[0]?.value ?? '' });
    setCreateOpen(true);
  }, [form, temaOpts]);

  const openEdit = useCallback((item: ActualizacionTema) => {
    form.reset({ titulo: item.titulo, contenido: item.contenido, fuente: item.fuente ?? null, tema_id: item.tema_id });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      const payload = { ...values, fuente: values.fuente || null };
      if (editTarget) {
        await updateMut?.mutateAsync?.({ id: editTarget.id, ...payload });
        toast.success('Actualización guardada');
        setEditTarget(null);
      } else {
        await createMut?.mutateAsync?.(payload);
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
      await deleteMut?.mutateAsync?.(id);
      toast.success('Actualización eliminada');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  const dialogForm = (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium">Tema emergente *</label>
        <Select className="mt-1" value={form.watch('tema_id')} onChange={(e) => form.setValue('tema_id', e.target.value, { shouldValidate: true })} options={temaOpts} />
      </div>
      <div>
        <label className="text-sm font-medium">Título *</label>
        <Input className="mt-1" maxLength={255} {...form.register('titulo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Contenido *</label>
        <Textarea className="mt-1" rows={4} {...form.register('contenido')} />
      </div>
      <div>
        <label className="text-sm font-medium">Fuente</label>
        <Input className="mt-1" maxLength={255} placeholder="URL, blog, CVE…" value={form.watch('fuente') ?? ''} onChange={(e) => form.setValue('fuente', e.target.value || null)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={() => { setEditTarget(null); form.reset(); }}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={Boolean(createMut?.isPending) || Boolean(updateMut?.isPending)}>
          {(Boolean(createMut?.isPending) || Boolean(updateMut?.isPending)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editTarget ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Actualizaciones de Temas Emergentes" description="Seguimiento de novedades asociadas a temas de seguridad emergentes.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen} disabled={!temaOpts.length}><Plus className="mr-2 h-4 w-4" />Nueva actualización</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nueva actualización de tema</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={MessageSquare} title="Sin actualizaciones" description="Registra la primera actualización con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Título</DataTableTh>
                  <DataTableTh>Contenido</DataTableTh>
                  <DataTableTh>Fuente</DataTableTh>
                  <DataTableTh>Fecha</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-[180px] truncate">{item.titulo}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground max-w-xs truncate">{item.contenido}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{item.fuente ?? '—'}</DataTableCell>
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
