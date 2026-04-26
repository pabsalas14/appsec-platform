'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableRow,
  DataTableTh,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Textarea,
} from '@/components/ui';
import {
  useAuditorias,
  useCreateAuditoria,
  useDeleteAuditoria,
  useUpdateAuditoria,
} from '@/hooks/useAuditorias';
import { AuditoriaCreateSchema, type Auditoria } from '@/lib/schemas/auditoria.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const TIPOS_AUDITORIA = ['Interna', 'Externa', 'Regulatoria', 'Técnica', 'Cumplimiento'];
const ESTADOS_AUDITORIA = ['Planificada', 'En Progreso', 'Completada', 'Cancelada', 'En Revisión'];

const ESTADO_COLORS: Record<string, string> = {
  Planificada: 'bg-blue-100 text-blue-800',
  'En Progreso': 'bg-amber-100 text-amber-800',
  Completada: 'bg-green-100 text-green-800',
  Cancelada: 'bg-gray-100 text-gray-700',
  'En Revisión': 'bg-purple-100 text-purple-800',
};

const formSchema = AuditoriaCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function AuditoriasPage() {
  const { data: items = [], isLoading } = useAuditorias();
  const createMut = useCreateAuditoria();
  const updateMut = useUpdateAuditoria();
  const deleteMut = useDeleteAuditoria();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Auditoria | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { titulo: '', tipo: TIPOS_AUDITORIA[0], alcance: '', estado: ESTADOS_AUDITORIA[0], fecha_inicio: '', fecha_fin: null },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ titulo: '', tipo: TIPOS_AUDITORIA[0], alcance: '', estado: ESTADOS_AUDITORIA[0], fecha_inicio: '', fecha_fin: null });
    setCreateOpen(true);
  }, [form]);

  const openEdit = useCallback((item: Auditoria) => {
    form.reset({
      titulo: item.titulo,
      tipo: item.tipo,
      alcance: item.alcance,
      estado: item.estado,
      fecha_inicio: item.fecha_inicio?.slice(0, 16) ?? '',
      fecha_fin: item.fecha_fin?.slice(0, 16) ?? null,
    });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, ...values });
        toast.success('Auditoría actualizada');
        setEditTarget(null);
      } else {
        await createMut.mutateAsync(values);
        toast.success('Auditoría creada');
        setCreateOpen(false);
      }
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar auditoría'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Auditoría eliminada');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  const dialogForm = (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium">Título *</label>
        <Input className="mt-1" maxLength={255} {...form.register('titulo')} />
        {form.formState.errors.titulo && <p className="text-xs text-destructive mt-1">{form.formState.errors.titulo.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Tipo *</label>
          <Select
            className="mt-1"
            value={form.watch('tipo')}
            onChange={(e) => form.setValue('tipo', e.target.value, { shouldValidate: true })}
            options={TIPOS_AUDITORIA.map((x) => ({ value: x, label: x }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Estado *</label>
          <Select
            className="mt-1"
            value={form.watch('estado')}
            onChange={(e) => form.setValue('estado', e.target.value, { shouldValidate: true })}
            options={ESTADOS_AUDITORIA.map((x) => ({ value: x, label: x }))}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Alcance *</label>
        <Textarea className="mt-1" rows={3} {...form.register('alcance')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Fecha inicio *</label>
          <Input className="mt-1" type="datetime-local" {...form.register('fecha_inicio')} />
        </div>
        <div>
          <label className="text-sm font-medium">Fecha fin</label>
          <Input
            className="mt-1"
            type="datetime-local"
            value={form.watch('fecha_fin') ?? ''}
            onChange={(e) => form.setValue('fecha_fin', e.target.value || null)}
          />
        </div>
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
      <PageHeader title="Auditorías" description="Gestión de auditorías de seguridad internas y externas.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen}><Plus className="mr-2 h-4 w-4" />Nueva auditoría</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nueva auditoría</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Sin auditorías" description="Crea la primera auditoría con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Título</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Fecha inicio</DataTableTh>
                  <DataTableTh>Fecha fin</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-xs truncate">{item.titulo}</DataTableCell>
                    <DataTableCell>{item.tipo}</DataTableCell>
                    <DataTableCell>
                      <Badge className={ESTADO_COLORS[item.estado] ?? 'bg-gray-100 text-gray-700'} variant="outline">
                        {item.estado}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{formatDate(item.fecha_inicio)}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{item.fecha_fin ? formatDate(item.fecha_fin) : '—'}</DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Editar auditoría</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar auditoría</AlertDialogTitle>
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
