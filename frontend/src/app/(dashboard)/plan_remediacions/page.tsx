'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger, Badge, Button, Card, CardContent, DataTable, DataTableBody,
  DataTableCell, DataTableHead, DataTableRow, DataTableTh, Dialog, DialogClose,
  DialogContent, DialogHeader, DialogTitle, DialogTrigger, EmptyState, Input,
  PageHeader, PageWrapper, Select, Textarea,
} from '@/components/ui';
import { usePlanRemediacions, useCreatePlanRemediacion, useUpdatePlanRemediacion, useDeletePlanRemediacion } from '@/hooks/usePlanRemediacions';
import { useAuditorias } from '@/hooks/useAuditorias';
import { PlanRemediacionCreateSchema, type PlanRemediacion } from '@/lib/schemas/plan_remediacion.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ESTADOS = ['Pendiente', 'En Progreso', 'Completado', 'Cancelado'];
const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-gray-100 text-gray-700',
  'En Progreso': 'bg-amber-100 text-amber-800',
  Completado: 'bg-green-100 text-green-800',
  Cancelado: 'bg-red-100 text-red-800',
};

const formSchema = PlanRemediacionCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function PlanRemediacionsPage() {
  const planesQuery = usePlanRemediacions();
  const items = planesQuery?.data ?? [];
  const isLoading = Boolean(planesQuery?.isLoading);
  const auditoriasQuery = useAuditorias();
  const auditorias = auditoriasQuery?.data ?? [];
  const createMut = useCreatePlanRemediacion();
  const updateMut = useUpdatePlanRemediacion();
  const deleteMut = useDeletePlanRemediacion();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlanRemediacion | null>(null);

  const auditoriaOpts = auditorias.map((a) => ({ value: a.id, label: a.titulo }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { descripcion: '', acciones_recomendadas: '', responsable: '', fecha_limite: '', estado: ESTADOS[0], auditoria_id: '' },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ descripcion: '', acciones_recomendadas: '', responsable: '', fecha_limite: '', estado: ESTADOS[0], auditoria_id: auditoriaOpts[0]?.value ?? '' });
    setCreateOpen(true);
  }, [form, auditoriaOpts]);

  const openEdit = useCallback((item: PlanRemediacion) => {
    form.reset({ descripcion: item.descripcion, acciones_recomendadas: item.acciones_recomendadas, responsable: item.responsable, fecha_limite: item.fecha_limite?.slice(0, 16) ?? '', estado: item.estado, auditoria_id: item.auditoria_id });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      if (editTarget) {
        await updateMut?.mutateAsync?.({ id: editTarget.id, ...values });
        toast.success('Plan actualizado');
        setEditTarget(null);
      } else {
        await createMut?.mutateAsync?.(values);
        toast.success('Plan creado');
        setCreateOpen(false);
      }
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar plan'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut?.mutateAsync?.(id);
      toast.success('Plan eliminado');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  const dialogForm = (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium">Auditoría *</label>
        <Select className="mt-1" value={form.watch('auditoria_id')} onChange={(e) => form.setValue('auditoria_id', e.target.value, { shouldValidate: true })} options={auditoriaOpts} />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción *</label>
        <Textarea className="mt-1" rows={3} {...form.register('descripcion')} />
      </div>
      <div>
        <label className="text-sm font-medium">Acciones recomendadas *</label>
        <Textarea className="mt-1" rows={3} {...form.register('acciones_recomendadas')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Responsable *</label>
          <Input className="mt-1" maxLength={255} {...form.register('responsable')} />
        </div>
        <div>
          <label className="text-sm font-medium">Estado *</label>
          <Select className="mt-1" value={form.watch('estado')} onChange={(e) => form.setValue('estado', e.target.value, { shouldValidate: true })} options={ESTADOS.map((x) => ({ value: x, label: x }))} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Fecha límite *</label>
        <Input className="mt-1" type="datetime-local" {...form.register('fecha_limite')} />
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
      <PageHeader title="Planes de Remediación" description="Planes de acción asociados a auditorías de seguridad.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen} disabled={!auditoriaOpts.length}><Plus className="mr-2 h-4 w-4" />Nuevo plan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo plan de remediación</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="Sin planes de remediación" description="Crea el primer plan con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Descripción</DataTableTh>
                  <DataTableTh>Responsable</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Fecha límite</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="max-w-xs truncate">{item.descripcion}</DataTableCell>
                    <DataTableCell>{item.responsable}</DataTableCell>
                    <DataTableCell>
                      <Badge className={ESTADO_COLORS[item.estado] ?? 'bg-gray-100 text-gray-700'} variant="outline">{item.estado}</Badge>
                    </DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{formatDate(item.fecha_limite)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Editar plan de remediación</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar plan</AlertDialogTitle>
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
