'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { GitBranch, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
  PageHeader, PageWrapper,
} from '@/components/ui';
import { useFlujoEstatus, useCreateFlujoEstatus, useUpdateFlujoEstatus, useDeleteFlujoEstatus } from '@/hooks/useFlujoEstatus';
import { FlujoEstatusCreateSchema, type FlujoEstatus } from '@/lib/schemas/flujo_estatus.schema';
import { extractErrorMessage } from '@/lib/utils';

const ENTITY_TYPES = ['Vulnerabilidad', 'Auditoria', 'Iniciativa', 'TemaEmergente', 'ServiceRelease', 'HallazgoSast', 'HallazgoDast', 'Otro'];

const formSchema = FlujoEstatusCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function FlujoEstatusPage() {
  const { data: items = [], isLoading } = useFlujoEstatus();
  const createMut = useCreateFlujoEstatus();
  const updateMut = useUpdateFlujoEstatus();
  const deleteMut = useDeleteFlujoEstatus();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FlujoEstatus | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { entity_type: ENTITY_TYPES[0], from_status: '', to_status: '', allowed: true, requires_justification: false, requires_approval: false },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ entity_type: ENTITY_TYPES[0], from_status: '', to_status: '', allowed: true, requires_justification: false, requires_approval: false });
    setCreateOpen(true);
  }, [form]);

  const openEdit = useCallback((item: FlujoEstatus) => {
    form.reset({ entity_type: item.entity_type, from_status: item.from_status, to_status: item.to_status, allowed: item.allowed, requires_justification: item.requires_justification, requires_approval: item.requires_approval });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, ...values });
        toast.success('Flujo actualizado');
        setEditTarget(null);
      } else {
        await createMut.mutateAsync(values);
        toast.success('Flujo creado');
        setCreateOpen(false);
      }
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar flujo'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Flujo eliminado');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  const dialogForm = (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium">Entidad *</label>
        <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.watch('entity_type')} onChange={(e) => form.setValue('entity_type', e.target.value, { shouldValidate: true })}>
          {ENTITY_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Estado origen *</label>
          <Input className="mt-1" maxLength={100} placeholder="Ej. Abierto" {...form.register('from_status')} />
        </div>
        <div>
          <label className="text-sm font-medium">Estado destino *</label>
          <Input className="mt-1" maxLength={100} placeholder="Ej. En Revisión" {...form.register('to_status')} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.watch('allowed')} onChange={(e) => form.setValue('allowed', e.target.checked)} />
          Transición permitida
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.watch('requires_justification')} onChange={(e) => form.setValue('requires_justification', e.target.checked)} />
          Requiere justificación
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.watch('requires_approval')} onChange={(e) => form.setValue('requires_approval', e.target.checked)} />
          Requiere aprobación
        </label>
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
      <PageHeader title="Flujos de Estatus" description="Define las transiciones de estado permitidas entre entidades del sistema.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen}><Plus className="mr-2 h-4 w-4" />Nueva transición</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nueva transición de estado</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={GitBranch} title="Sin flujos de estatus" description="Define la primera transición con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Entidad</DataTableTh>
                  <DataTableTh>Origen</DataTableTh>
                  <DataTableTh>Destino</DataTableTh>
                  <DataTableTh>Permitida</DataTableTh>
                  <DataTableTh>Justif.</DataTableTh>
                  <DataTableTh>Aprobación</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-mono text-xs">{item.entity_type}</DataTableCell>
                    <DataTableCell>{item.from_status}</DataTableCell>
                    <DataTableCell>{item.to_status}</DataTableCell>
                    <DataTableCell>
                      <Badge className={item.allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} variant="outline">{item.allowed ? 'Sí' : 'No'}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge className={item.requires_justification ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'} variant="outline">{item.requires_justification ? 'Sí' : 'No'}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge className={item.requires_approval ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'} variant="outline">{item.requires_approval ? 'Sí' : 'No'}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Editar transición</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar flujo</AlertDialogTitle>
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
