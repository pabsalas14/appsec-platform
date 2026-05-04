'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { dateOnlyToIsoEndOfDay, isoToDateOnly } from '@/components/crud';
import { useAceptacionRiesgos, useCreateAceptacionRiesgo, useDeleteAceptacionRiesgo, useUpdateAceptacionRiesgo } from '@/hooks/useAceptacionRiesgos';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { ESTADOS_GESTION_RIESGO } from '@/lib/excepcion-aceptacion-estados';
import { logger } from '@/lib/logger';
import { AceptacionRiesgoCreateSchema, type AceptacionRiesgo, type AceptacionRiesgoCreate } from '@/lib/schemas/aceptacion_riesgo.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = AceptacionRiesgoCreateSchema.extend({
  propietario_riesgo_id: z.string().min(1, 'UUID requerido'),
  aprobador_id: z.string().nullable().optional(),
});
type FormData = z.infer<typeof formSchema>;

function FormFields({ initial, onSuccess, vOpts }: { initial?: AceptacionRiesgo | null; onSuccess: () => void; vOpts: { value: string; label: string }[] }) {
  const createMut = useCreateAceptacionRiesgo();
  const updateMut = useUpdateAceptacionRiesgo();
  const isEdit = Boolean(initial);
  const [revDate, setRevDate] = useState(
    () => (initial ? isoToDateOnly(initial.fecha_revision_obligatoria) : new Date().toISOString().slice(0, 10)),
  );
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          vulnerabilidad_id: initial.vulnerabilidad_id,
          justificacion_negocio: initial.justificacion_negocio,
          propietario_riesgo_id: initial.propietario_riesgo_id,
          fecha_revision_obligatoria: initial.fecha_revision_obligatoria,
          estado: initial.estado,
          aprobador_id: initial.aprobador_id ?? null,
          fecha_aprobacion: initial.fecha_aprobacion ?? null,
          notas_aprobador: initial.notas_aprobador ?? null,
        }
      : {
          vulnerabilidad_id: vOpts[0]?.value ?? '',
          justificacion_negocio: '',
          propietario_riesgo_id: '',
          fecha_revision_obligatoria: new Date().toISOString(),
          estado: 'Pendiente',
          aprobador_id: null,
          fecha_aprobacion: null,
          notas_aprobador: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (initial) {
      setRevDate(isoToDateOnly(initial.fecha_revision_obligatoria));
    }
  }, [initial]);

  useEffect(() => {
    if (!initial && vOpts[0] && !form.getValues('vulnerabilidad_id')) {
      form.setValue('vulnerabilidad_id', vOpts[0].value);
    }
  }, [initial, vOpts, form]);

  const onSubmit = form.handleSubmit((data) => {
    const frio = dateOnlyToIsoEndOfDay(revDate) || data.fecha_revision_obligatoria;
    const aprob = data.aprobador_id?.trim();
    const po = data.propietario_riesgo_id?.trim();
    if (!po || !z.string().uuid().safeParse(po).success) {
      toast.error('Propietario del riesgo: UUID requerido');
      return;
    }
    const payload: AceptacionRiesgoCreate = {
      vulnerabilidad_id: data.vulnerabilidad_id,
      justificacion_negocio: data.justificacion_negocio.trim(),
      propietario_riesgo_id: po,
      fecha_revision_obligatoria: frio,
      estado: data.estado,
      aprobador_id: aprob && z.string().uuid().safeParse(aprob).success ? aprob : null,
      fecha_aprobacion: data.fecha_aprobacion?.trim() || null,
      notas_aprobador: data.notas_aprobador?.trim() || null,
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
            logger.error('aceptacion_riesgo.update.failed', { id: initial.id, error: e });
            toast.error(extractErrorMessage(e, 'Error al guardar'));
          },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Creado');
          onSuccess();
        },
        onError: (e) => {
          logger.error('aceptacion_riesgo.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Vulnerabilidad</label>
        <Select
          className="mt-1"
          value={form.watch('vulnerabilidad_id')}
          onChange={(e) => form.setValue('vulnerabilidad_id', e.target.value, { shouldValidate: true })}
          options={vOpts}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Justificación de negocio</label>
        <Textarea className="mt-1" rows={3} {...form.register('justificacion_negocio')} />
      </div>
      <div>
        <label className="text-sm font-medium">Propietario riesgo (user UUID) *</label>
        <Input className="mt-1" {...form.register('propietario_riesgo_id')} />
      </div>
      <div>
        <label className="text-sm font-medium">Revisión obligatoria (fecha)</label>
        <Input className="mt-1" type="date" value={revDate} onChange={(e) => setRevDate(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Estado</label>
        <Select
          className="mt-1"
          value={form.watch('estado')}
          onChange={(e) => form.setValue('estado', e.target.value, { shouldValidate: true })}
          options={ESTADOS_GESTION_RIESGO.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Aprobador (UUID, opcional)</label>
        <Input
          className="mt-1"
          value={form.watch('aprobador_id') ?? ''}
          onChange={(e) => form.setValue('aprobador_id', e.target.value.trim() || null)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha aprobación (ISO opcional)</label>
        <Input className="mt-1" {...form.register('fecha_aprobacion')} />
      </div>
      <div>
        <label className="text-sm font-medium">Notas aprobador</label>
        <Textarea className="mt-1" rows={2} {...form.register('notas_aprobador')} />
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

export default function AceptacionRiesgosPage() {
  const { data: rows, isLoading, isError } = useAceptacionRiesgos();
  const { data: vulns } = useVulnerabilidads();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<AceptacionRiesgo | null>(null);
  const deleteMut = useDeleteAceptacionRiesgo();

  const vOpts = useMemo(
    () => (vulns ?? []).map((v) => ({ value: v.id, label: v.titulo.slice(0, 50) })),
    [vulns],
  );
  const vLabel = useCallback(
    (id: string) => (vulns ?? []).find((v) => v.id === id)?.titulo ?? id.slice(0, 8),
    [vulns],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) => r.justificacion_negocio.toLowerCase().includes(n) || r.estado.toLowerCase().includes(n) || vLabel(r.vulnerabilidad_id).toLowerCase().includes(n),
    );
  }, [rows, q, vLabel]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Aceptación de riesgo" description="Aceptación formal vinculada a vulnerabilidad.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva aceptación</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} vOpts={vOpts} />
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
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin datos.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Vulnerabilidad</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Revisión</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                      {vLabel(item.vulnerabilidad_id)}
                    </DataTableCell>
                    <DataTableCell>{item.estado}</DataTableCell>
                    <DataTableCell className="text-xs whitespace-nowrap">{formatDate(item.fecha_revision_obligatoria)}</DataTableCell>
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
                                      logger.error('aceptacion_riesgo.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar aceptación</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} vOpts={vOpts} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
