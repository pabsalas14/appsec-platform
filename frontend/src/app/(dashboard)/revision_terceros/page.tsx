'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
} from '@/components/ui';
import { isoToLocalDateTime, localDateTimeToIso } from '@/components/crud';
import { useActivoWebs } from '@/hooks/useActivoWebs';
import {
  useCreateRevisionTercero,
  useDeleteRevisionTercero,
  useRevisionTerceros,
  useUpdateRevisionTercero,
} from '@/hooks/useRevisionTerceros';
import { useServicios } from '@/hooks/useServicios';
import { REVISION_TERCERO_ESTADOS, REVISION_TERCERO_TIPOS } from '@/lib/revision-tercero-constants';
import { logger } from '@/lib/logger';
import { RevisionTerceroCreateSchema, type RevisionTercero, type RevisionTerceroCreate } from '@/lib/schemas/revision_tercero.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = RevisionTerceroCreateSchema;
type FormData = z.infer<typeof formSchema>;
const NONE = '';

function FormFields({
  initial,
  onSuccess,
  srvOpts,
  awOpts,
}: {
  initial?: RevisionTercero | null;
  onSuccess: () => void;
  srvOpts: { value: string; label: string }[];
  awOpts: { value: string; label: string }[];
}) {
  const createMut = useCreateRevisionTercero();
  const updateMut = useUpdateRevisionTercero();
  const isEdit = Boolean(initial);
  const [ini, setIni] = useState(() => (initial ? isoToLocalDateTime(initial.fecha_inicio) : ''));
  const [fin, setFin] = useState(() => (initial?.fecha_fin ? isoToLocalDateTime(initial.fecha_fin) : ''));
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre_empresa: initial.nombre_empresa,
          tipo: initial.tipo,
          servicio_id: initial.servicio_id ?? null,
          activo_web_id: initial.activo_web_id ?? null,
          fecha_inicio: initial.fecha_inicio,
          fecha_fin: initial.fecha_fin ?? null,
          estado: initial.estado,
          informe_filename: initial.informe_filename ?? null,
          informe_sha256: initial.informe_sha256 ?? null,
        }
      : {
          nombre_empresa: '',
          tipo: REVISION_TERCERO_TIPOS[0],
          servicio_id: srvOpts[0]?.value || null,
          activo_web_id: null,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: null,
          estado: 'Planificada',
          informe_filename: null,
          informe_sha256: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;
  const sv = form.watch('servicio_id');
  const aw = form.watch('activo_web_id');

  useEffect(() => {
    if (initial) {
      setIni(isoToLocalDateTime(initial.fecha_inicio));
      setFin(initial.fecha_fin ? isoToLocalDateTime(initial.fecha_fin) : '');
    }
  }, [initial]);

  const onSubmit = form.handleSubmit((data) => {
    const s = data.servicio_id && data.servicio_id.length > 0 ? data.servicio_id : null;
    const a = data.activo_web_id && data.activo_web_id.length > 0 ? data.activo_web_id : null;
    if (!s && !a) {
      toast.error('Debe indicar al menos un servicio o un activo web.');
      return;
    }
    const fi = localDateTimeToIso(ini) || data.fecha_inicio;
    const ff = fin.trim() ? localDateTimeToIso(fin) : null;
    const payload: RevisionTerceroCreate = {
      nombre_empresa: data.nombre_empresa.trim(),
      tipo: data.tipo,
      servicio_id: s,
      activo_web_id: a,
      fecha_inicio: fi,
      fecha_fin: ff,
      estado: data.estado,
      informe_filename: data.informe_filename?.trim() || null,
      informe_sha256: data.informe_sha256?.trim() || null,
    };
    if (isEdit && initial) {
      updateMut.mutate(
        { id: initial.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Actualizado');
            onSuccess();
          },
          onError: (e) => {
            logger.error('revision_tercero.update.failed', { id: initial.id, error: e });
            toast.error(extractErrorMessage(e, 'Error al guardar'));
          },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Creada');
          onSuccess();
        },
        onError: (e) => {
          logger.error('revision_tercero.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Empresa / nombre</label>
        <Input className="mt-1" {...form.register('nombre_empresa')} />
      </div>
      <div>
        <label className="text-sm font-medium">Tipo</label>
        <Select
          className="mt-1"
          value={form.watch('tipo')}
          onChange={(e) => form.setValue('tipo', e.target.value, { shouldValidate: true })}
          options={REVISION_TERCERO_TIPOS.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Servicio</label>
        <Select
          className="mt-1"
          value={sv ?? NONE}
          onChange={(e) => form.setValue('servicio_id', e.target.value === NONE ? null : e.target.value, { shouldValidate: true })}
          options={[{ value: NONE, label: '— Ninguno —' }, ...srvOpts]}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Activo web</label>
        <Select
          className="mt-1"
          value={aw ?? NONE}
          onChange={(e) => form.setValue('activo_web_id', e.target.value === NONE ? null : e.target.value, { shouldValidate: true })}
          options={[{ value: NONE, label: '— Ninguno —' }, ...awOpts]}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Inicio</label>
        <Input className="mt-1" type="datetime-local" value={ini} onChange={(e) => setIni(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Fin (opcional)</label>
        <Input className="mt-1" type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Estado</label>
        <Select
          className="mt-1"
          value={form.watch('estado')}
          onChange={(e) => form.setValue('estado', e.target.value, { shouldValidate: true })}
          options={REVISION_TERCERO_ESTADOS.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Informe (nombre archivo)</label>
        <Input className="mt-1" {...form.register('informe_filename')} />
      </div>
      <div>
        <label className="text-sm font-medium">SHA-256 informe</label>
        <Input className="mt-1" {...form.register('informe_sha256')} />
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function RevisionTercerosPage() {
  const { data: rows, isLoading, isError } = useRevisionTerceros();
  const { data: srvs } = useServicios();
  const { data: aws } = useActivoWebs();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<RevisionTercero | null>(null);
  const deleteMut = useDeleteRevisionTercero();

  const srvOpts = useMemo(() => (srvs ?? []).map((s) => ({ value: s.id, label: s.nombre })), [srvs]);
  const awOpts = useMemo(() => (aws ?? []).map((a) => ({ value: a.id, label: a.nombre })), [aws]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) => r.nombre_empresa.toLowerCase().includes(n) || r.tipo.toLowerCase().includes(n) || r.estado.toLowerCase().includes(n),
    );
  }, [rows, q]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Revisiones tercero"
        description="Pentest y revisiones de terceros; requieren al menos un servicio o activo web."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva revisión</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} srvOpts={srvOpts} awOpts={awOpts} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 max-w-md">
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin revisiones.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Empresa</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-[200px] truncate">{item.nombre_empresa}</DataTableCell>
                    <DataTableCell className="text-sm">{item.tipo}</DataTableCell>
                    <DataTableCell>{item.estado}</DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="xs" onClick={() => setEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="ghost" size="xs" aria-label="Eliminar">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                              <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(item.id, {
                                    onSuccess: () => toast.success('Eliminado'),
                                    onError: (e) => {
                                      logger.error('revision_tercero.delete.failed', { id: item.id, error: e });
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

      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar revisión</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} srvOpts={srvOpts} awOpts={awOpts} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
