'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { EntityCustomFieldsCard } from '@/components/modules/EntityCustomFieldsCard';
import {
  useCreateTemaEmergente,
  useDeleteTemaEmergente,
  useTemaEmergentes,
  useUpdateTemaEmergente,
} from '@/hooks/useTemaEmergentes';
import { useCelulas } from '@/hooks/useCelulas';
import { TemaEmergenteCreateSchema, type TemaEmergente } from '@/lib/schemas/tema_emergente.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const TIPOS_TEMA = ['CVE', 'Regulatorio', 'Técnico', 'Operacional', 'Amenaza Externa', 'Otro'];
const IMPACTOS = ['Crítico', 'Alto', 'Medio', 'Bajo'];
const ESTADOS_TEMA = ['Nuevo', 'En Análisis', 'Mitigado', 'Cerrado', 'Desestimado'];

const IMPACTO_COLORS: Record<string, string> = {
  Crítico: 'bg-red-100 text-red-800',
  Alto: 'bg-orange-100 text-orange-800',
  Medio: 'bg-amber-100 text-amber-800',
  Bajo: 'bg-green-100 text-green-800',
};

const formSchema = TemaEmergenteCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function TemaEmergentesPage() {
  const temasQuery = useTemaEmergentes();
  const items = temasQuery?.data ?? [];
  const isLoading = Boolean(temasQuery?.isLoading);
  const celulasQuery = useCelulas();
  const celulas = celulasQuery?.data ?? [];
  const createMut = useCreateTemaEmergente();
  const updateMut = useUpdateTemaEmergente();
  const deleteMut = useDeleteTemaEmergente();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TemaEmergente | null>(null);

  const celulasOpts = [
    { value: '', label: '— Sin célula —' },
    ...celulas.map((c) => ({ value: c.id, label: c.nombre })),
  ];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { titulo: '', descripcion: '', tipo: TIPOS_TEMA[0], impacto: IMPACTOS[2], estado: ESTADOS_TEMA[0], fuente: '', celula_id: null },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ titulo: '', descripcion: '', tipo: TIPOS_TEMA[0], impacto: IMPACTOS[2], estado: ESTADOS_TEMA[0], fuente: '', celula_id: null });
    setCreateOpen(true);
  }, [form]);

  const openEdit = useCallback((item: TemaEmergente) => {
    form.reset({
      titulo: item.titulo,
      descripcion: item.descripcion,
      tipo: item.tipo,
      impacto: item.impacto,
      estado: item.estado,
      fuente: item.fuente,
      celula_id: item.celula_id ?? null,
    });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      const payload = { ...values, celula_id: values.celula_id || null };
      if (editTarget) {
        await updateMut?.mutateAsync?.({ id: editTarget.id, ...payload });
        toast.success('Tema actualizado');
        setEditTarget(null);
      } else {
        await createMut?.mutateAsync?.(payload);
        toast.success('Tema creado');
        setCreateOpen(false);
      }
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar tema'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut?.mutateAsync?.(id);
      toast.success('Tema eliminado');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  const dialogForm = (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium">Título *</label>
        <Input className="mt-1" maxLength={255} {...form.register('titulo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción *</label>
        <Textarea className="mt-1" rows={3} {...form.register('descripcion')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Tipo *</label>
          <Select className="mt-1" value={form.watch('tipo')} onChange={(e) => form.setValue('tipo', e.target.value, { shouldValidate: true })} options={TIPOS_TEMA.map((x) => ({ value: x, label: x }))} />
        </div>
        <div>
          <label className="text-sm font-medium">Impacto *</label>
          <Select className="mt-1" value={form.watch('impacto')} onChange={(e) => form.setValue('impacto', e.target.value, { shouldValidate: true })} options={IMPACTOS.map((x) => ({ value: x, label: x }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Estado *</label>
          <Select className="mt-1" value={form.watch('estado')} onChange={(e) => form.setValue('estado', e.target.value, { shouldValidate: true })} options={ESTADOS_TEMA.map((x) => ({ value: x, label: x }))} />
        </div>
        <div>
          <label className="text-sm font-medium">Célula</label>
          <Select className="mt-1" value={form.watch('celula_id') ?? ''} onChange={(e) => form.setValue('celula_id', e.target.value || null)} options={celulasOpts} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Fuente *</label>
        <Input className="mt-1" maxLength={255} placeholder="CVE, blog, proveedor…" {...form.register('fuente')} />
      </div>
      {editTarget ? (
        <div className="border-t border-border pt-3">
          <EntityCustomFieldsCard entityType="tema_emergente" entityId={editTarget.id} />
        </div>
      ) : null}
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
      <PageHeader
        title="Registros — Temas emergentes"
        description="Alta, edición y listado. El tablero analítico está en la otra pestaña."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen}><Plus className="mr-2 h-4 w-4" />Nuevo tema</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo tema emergente</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Sin temas emergentes" description="Registra el primer tema con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Título</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Impacto</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Fuente</DataTableTh>
                  <DataTableTh>Creado</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-xs truncate">{item.titulo}</DataTableCell>
                    <DataTableCell>{item.tipo}</DataTableCell>
                    <DataTableCell>
                      <Badge className={IMPACTO_COLORS[item.impacto] ?? 'bg-gray-100 text-gray-700'} variant="outline">{item.impacto}</Badge>
                    </DataTableCell>
                    <DataTableCell>{item.estado}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground truncate max-w-[140px]">{item.fuente}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{formatDate(item.created_at)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Editar tema emergente</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar tema</AlertDialogTitle>
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
