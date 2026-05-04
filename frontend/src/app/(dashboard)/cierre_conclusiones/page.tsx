'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useCierreConclusiones, useCreateCierreConclusion, useUpdateCierreConclusion, useDeleteCierreConclusion } from '@/hooks/useCierreConclusiones';
import { useTemaEmergentes } from '@/hooks/useTemaEmergentes';
import { CierreConclusionCreateSchema, type CierreConclusion } from '@/lib/schemas/cierre_conclusion.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = CierreConclusionCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function CierreConclusionesPagina() {
  const cierresQuery = useCierreConclusiones();
  const items = cierresQuery?.data ?? [];
  const isLoading = Boolean(cierresQuery?.isLoading);
  const temasQuery = useTemaEmergentes();
  const temas = temasQuery?.data ?? [];
  const createMut = useCreateCierreConclusion();
  const updateMut = useUpdateCierreConclusion();
  const deleteMut = useDeleteCierreConclusion();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CierreConclusion | null>(null);

  const temaOpts = temas.map((t) => ({ value: t.id, label: t.titulo }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { titulo: '', conclusion: '', recomendaciones: null, fecha_cierre: '', tema_id: '' },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ titulo: '', conclusion: '', recomendaciones: null, fecha_cierre: '', tema_id: temaOpts[0]?.value ?? '' });
    setCreateOpen(true);
  }, [form, temaOpts]);

  const openEdit = useCallback((item: CierreConclusion) => {
    form.reset({ titulo: item.titulo, conclusion: item.conclusion, recomendaciones: item.recomendaciones ?? null, fecha_cierre: item.fecha_cierre?.slice(0, 16) ?? '', tema_id: item.tema_id });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      const payload = { ...values, recomendaciones: values.recomendaciones || null };
      if (editTarget) {
        await updateMut?.mutateAsync?.({ id: editTarget.id, ...payload });
        toast.success('Cierre actualizado');
        setEditTarget(null);
      } else {
        await createMut?.mutateAsync?.(payload);
        toast.success('Cierre creado');
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
      toast.success('Cierre eliminado');
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
        <label className="text-sm font-medium">Conclusión *</label>
        <Textarea className="mt-1" rows={3} {...form.register('conclusion')} />
      </div>
      <div>
        <label className="text-sm font-medium">Recomendaciones</label>
        <Textarea className="mt-1" rows={3} value={form.watch('recomendaciones') ?? ''} onChange={(e) => form.setValue('recomendaciones', e.target.value || null)} />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha de cierre *</label>
        <Input className="mt-1" type="datetime-local" {...form.register('fecha_cierre')} />
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
      <PageHeader title="Cierres y Conclusiones" description="Documentación de cierres y aprendizajes de temas emergentes.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen}><Plus className="mr-2 h-4 w-4" />Nuevo cierre</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo cierre / conclusión</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={CheckSquare} title="Sin cierres registrados" description="Registra el primer cierre con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Título</DataTableTh>
                  <DataTableTh>Conclusión</DataTableTh>
                  <DataTableTh>Fecha cierre</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-[200px] truncate">{item.titulo}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground max-w-xs truncate">{item.conclusion}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{formatDate(item.fecha_cierre)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Editar cierre</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar cierre</AlertDialogTitle>
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
