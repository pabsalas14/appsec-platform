'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileSearch, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Textarea,
} from '@/components/ui';
import { useAuditorias } from '@/hooks/useAuditorias';
import {
  useCreateHallazgoAuditoria,
  useDeleteHallazgoAuditoria,
  useHallazgoAuditorias,
  useUpdateHallazgoAuditoria,
} from '@/hooks/useHallazgoAuditorias';
import { logger } from '@/lib/logger';
import {
  HallazgoAuditoriaCreateSchema,
  type HallazgoAuditoria,
  type HallazgoAuditoriaCreate,
} from '@/lib/schemas/hallazgo_auditoria.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formCreate = HallazgoAuditoriaCreateSchema;
const formEdit = HallazgoAuditoriaCreateSchema.partial().extend({
  titulo: z.string().min(1).max(255).optional(),
  descripcion: z.string().min(1).optional(),
});

type FormCreate = z.infer<typeof formCreate>;
type FormEdit = z.infer<typeof formEdit>;

const defaultCreate: FormCreate = {
  titulo: '',
  descripcion: '',
  severidad: 'Media',
  auditoria_id: '',
  categoria: 'General',
  estado: 'Abierto',
};

export default function HallazgoAuditoriasPage() {
  const { data: rows, isLoading, isError } = useHallazgoAuditorias();
  const { data: auds } = useAuditorias();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<HallazgoAuditoria | null>(null);
  const createMut = useCreateHallazgoAuditoria();
  const updateMut = useUpdateHallazgoAuditoria();
  const deleteMut = useDeleteHallazgoAuditoria();

  const audOpts = useMemo(
    () => (auds ?? []).map((a) => ({ value: a.id, label: `${a.titulo} — ${a.tipo}` })),
    [auds],
  );
  const audLabel = useCallback(
    (id: string) => (auds ?? []).find((a) => a.id === id)?.titulo ?? id.slice(0, 8),
    [auds],
  );
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (!s) return true;
      return (
        r.titulo.toLowerCase().includes(s) ||
        r.severidad.toLowerCase().includes(s) ||
        r.estado.toLowerCase().includes(s) ||
        r.descripcion.toLowerCase().includes(s) ||
        audLabel(r.auditoria_id).toLowerCase().includes(s)
      );
    });
  }, [rows, q, audLabel]);

  const formC = useForm<FormCreate>({
    resolver: zodResolver(formCreate),
    defaultValues: {
      ...defaultCreate,
      auditoria_id: audOpts[0]?.value ?? '',
    },
  });
  const formE = useForm<FormEdit>({ resolver: zodResolver(formEdit), defaultValues: {} });

  useEffect(() => {
    if (createOpen && audOpts.length && !formC.getValues('auditoria_id')) {
      formC.setValue('auditoria_id', audOpts[0].value);
    }
  }, [createOpen, audOpts, formC]);

  useEffect(() => {
    if (!edit) return;
    formE.reset({
      titulo: edit.titulo,
      descripcion: edit.descripcion,
      severidad: edit.severidad,
      categoria: edit.categoria,
      estado: edit.estado,
    });
  }, [edit, formE]);

  const onCreate = formC.handleSubmit((d) => {
    const payload: HallazgoAuditoriaCreate = {
      titulo: d.titulo.trim(),
      descripcion: d.descripcion.trim(),
      severidad: d.severidad.trim(),
      auditoria_id: d.auditoria_id,
      categoria: d.categoria.trim() || 'General',
      estado: d.estado.trim() || 'Abierto',
    };
    createMut.mutate(payload, {
      onSuccess: () => {
        toast.success('Hallazgo creado');
        setCreateOpen(false);
        formC.reset({ ...defaultCreate, auditoria_id: audOpts[0]?.value ?? '' });
      },
      onError: (e) => {
        logger.error('hallazgo_auditoria.create.failed', { error: e });
        toast.error(extractErrorMessage(e, 'Error al crear'));
      },
    });
  });

  const onEdit = formE.handleSubmit((d) => {
    if (!edit) return;
    const patch: Record<string, string> = {};
    if (d.titulo !== undefined && d.titulo !== edit.titulo) patch.titulo = d.titulo;
    if (d.descripcion !== undefined && d.descripcion !== edit.descripcion) patch.descripcion = d.descripcion;
    if (d.severidad !== undefined && d.severidad !== edit.severidad) patch.severidad = d.severidad;
    if (d.categoria !== undefined && d.categoria !== edit.categoria) patch.categoria = d.categoria;
    if (d.estado !== undefined && d.estado !== edit.estado) patch.estado = d.estado;
    if (Object.keys(patch).length === 0) {
      setEdit(null);
      return;
    }
    updateMut.mutate(
      { id: edit.id, ...patch },
      {
        onSuccess: () => {
          toast.success('Guardado');
          setEdit(null);
        },
        onError: (e) => {
          logger.error('hallazgo_auditoria.update.failed', { id: edit.id, error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  });

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Hallazgos (auditoría)"
        description="Hallazgos vinculados a una auditoría interna. Categoría y estado por defecto alineados con la API."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!audOpts.length}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo hallazgo (auditoría)</DialogTitle>
            </DialogHeader>
            <form className="space-y-3" onSubmit={onCreate}>
              <div>
                <label className="text-sm font-medium">Auditoría *</label>
                <Select
                  className="mt-1"
                  value={formC.watch('auditoria_id')}
                  onChange={(e) => formC.setValue('auditoria_id', e.target.value, { shouldValidate: true })}
                  options={audOpts}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input className="mt-1" maxLength={255} {...formC.register('titulo')} />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción *</label>
                <Textarea className="mt-1" rows={3} {...formC.register('descripcion')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Severidad *</label>
                  <Input className="mt-1" {...formC.register('severidad')} />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoría *</label>
                  <Input className="mt-1" placeholder="General" {...formC.register('categoria')} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Estado *</label>
                <Input className="mt-1" placeholder="Abierto" {...formC.register('estado')} />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <FileSearch className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} registro(s)
          </p>
          <div className="max-w-md">
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Auditoría / título</DataTableTh>
                  <DataTableTh>Severidad</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => (
                  <DataTableRow key={r.id}>
                    <DataTableCell>
                      <div className="text-xs text-muted-foreground mb-0.5">{audLabel(r.auditoria_id)}</div>
                      <div className="font-medium line-clamp-2">{r.titulo}</div>
                    </DataTableCell>
                    <DataTableCell>{r.severidad}</DataTableCell>
                    <DataTableCell>{r.estado}</DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(r.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Button type="button" size="xs" variant="ghost" onClick={() => setEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" size="xs" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar hallazgo?</AlertDialogTitle>
                              <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(r.id, {
                                    onSuccess: () => toast.success('Eliminado'),
                                    onError: (e) => {
                                      logger.error('hallazgo_auditoria.delete.failed', { id: r.id, error: e });
                                      toast.error(extractErrorMessage(e, 'Error'));
                                    },
                                  })
                                }
                              >
                                Eliminar
                              </AlertDialogAction>
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

      <Dialog open={!!edit} onOpenChange={() => setEdit(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar hallazgo (auditoría)</DialogTitle>
          </DialogHeader>
          {edit && (
            <form className="space-y-3" onSubmit={onEdit}>
              <p className="text-xs text-muted-foreground">Auditoría: {audLabel(edit.auditoria_id)}</p>
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input className="mt-1" maxLength={255} {...formE.register('titulo')} />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción *</label>
                <Textarea className="mt-1" rows={3} {...formE.register('descripcion')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Severidad *</label>
                  <Input className="mt-1" {...formE.register('severidad')} />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoría *</label>
                  <Input className="mt-1" {...formE.register('categoria')} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Estado *</label>
                <Input className="mt-1" {...formE.register('estado')} />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cerrar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={updateMut.isPending}>
                  {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
