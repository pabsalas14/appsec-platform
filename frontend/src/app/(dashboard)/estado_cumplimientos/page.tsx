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
import {
  useCreateEstadoCumplimiento,
  useDeleteEstadoCumplimiento,
  useEstadoCumplimientos,
  useUpdateEstadoCumplimiento,
} from '@/hooks/useEstadoCumplimientos';
import { useRegulacionControls } from '@/hooks/useRegulacionControls';
import { useServicioReguladoRegistros } from '@/hooks/useServicioReguladoRegistros';
import { useServicios } from '@/hooks/useServicios';
import { logger } from '@/lib/logger';
import {
  EstadoCumplimientoCreateSchema,
  type EstadoCumplimiento,
  type EstadoCumplimientoCreate,
} from '@/lib/schemas/estado_cumplimiento.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = EstadoCumplimientoCreateSchema;
type FormData = z.infer<typeof formSchema>;
const NO_CTRL = '__none__';

function FormFields({
  initial,
  onSuccess,
  regOptions,
  ctrlOptions,
}: {
  initial?: EstadoCumplimiento | null;
  onSuccess: () => void;
  regOptions: { value: string; label: string }[];
  ctrlOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateEstadoCumplimiento();
  const updateMut = useUpdateEstadoCumplimiento();
  const isEdit = Boolean(initial);
  const [evalDate, setEvalDate] = useState(
    () => (initial ? isoToDateOnly(initial.fecha_evaluacion) : new Date().toISOString().slice(0, 10)),
  );
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          registro_id: initial.registro_id,
          control_id: initial.control_id ?? null,
          estado: initial.estado,
          porcentaje: initial.porcentaje ?? null,
          notas: initial.notas ?? null,
          fecha_evaluacion: initial.fecha_evaluacion,
        }
      : {
          registro_id: regOptions[0]?.value ?? '',
          control_id: null,
          estado: 'No evaluado',
          porcentaje: null,
          notas: null,
          fecha_evaluacion: new Date().toISOString(),
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (initial) {
      setEvalDate(isoToDateOnly(initial.fecha_evaluacion));
    }
  }, [initial]);

  useEffect(() => {
    if (!initial && regOptions[0] && !form.getValues('registro_id')) {
      form.setValue('registro_id', regOptions[0].value);
    }
  }, [initial, regOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const fecha = dateOnlyToIsoEndOfDay(evalDate) || data.fecha_evaluacion;
    const payload: EstadoCumplimientoCreate = {
      registro_id: data.registro_id,
      control_id: data.control_id && data.control_id.length > 0 ? data.control_id : null,
      estado: data.estado.trim(),
      porcentaje: data.porcentaje ?? null,
      notas: data.notas?.trim() || null,
      fecha_evaluacion: fecha,
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
            logger.error('estado_cumplimiento.update.failed', { id: initial.id, error: e });
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
          logger.error('estado_cumplimiento.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  const cVal = form.watch('control_id');
  const cSel = cVal && cVal.length > 0 ? cVal : NO_CTRL;

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Registro</label>
        <Select
          className="mt-1"
          value={form.watch('registro_id')}
          onChange={(e) => form.setValue('registro_id', e.target.value, { shouldValidate: true })}
          options={regOptions}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Control (opcional)</label>
        <Select
          className="mt-1"
          value={cSel}
          onChange={(e) => {
            const v = e.target.value;
            form.setValue('control_id', v === NO_CTRL ? null : v, { shouldValidate: true });
          }}
          options={[{ value: NO_CTRL, label: '— Ninguno —' }, ...ctrlOptions]}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Estado</label>
        <Input className="mt-1" {...form.register('estado')} />
      </div>
      <div>
        <label className="text-sm font-medium">Porcentaje (0-100)</label>
        <Input
          className="mt-1"
          type="number"
          min={0}
          max={100}
          {...form.register('porcentaje', { valueAsNumber: true, setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha evaluación</label>
        <Input className="mt-1" type="date" value={evalDate} onChange={(e) => setEvalDate(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Notas</label>
        <Textarea className="mt-1" rows={2} {...form.register('notas')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !regOptions.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function EstadoCumplimientosPage() {
  const { data: rows, isLoading, isError } = useEstadoCumplimientos();
  const { data: regs } = useServicioReguladoRegistros();
  const { data: srvs } = useServicios();
  const { data: controls } = useRegulacionControls();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<EstadoCumplimiento | null>(null);
  const deleteMut = useDeleteEstadoCumplimiento();

  const regOptions = useMemo(() => {
    return (regs ?? []).map((r) => {
      const sn = (srvs ?? []).find((s) => s.id === r.servicio_id)?.nombre ?? '';
      return { value: r.id, label: `${r.nombre_regulacion} · ${sn || 'servicio'}` };
    });
  }, [regs, srvs]);
  const ctrlOptions = useMemo(
    () =>
      (controls ?? []).map((c) => ({
        value: c.id,
        label: `${c.nombre_regulacion} / ${c.nombre_control}`,
      })),
    [controls],
  );
  const regLabel = useCallback(
    (id: string) => regOptions.find((o) => o.value === id)?.label ?? id.slice(0, 8),
    [regOptions],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) => r.estado.toLowerCase().includes(n) || regLabel(r.registro_id).toLowerCase().includes(n),
    );
  }, [rows, q, regLabel]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Estado de cumplimiento" description="Evaluación por registro (y control opcional).">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!regOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo registro de cumplimiento</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} regOptions={regOptions} ctrlOptions={ctrlOptions} />
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
                  <DataTableTh>Registro</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>%</DataTableTh>
                  <DataTableTh>Evaluación</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {regLabel(item.registro_id)}
                    </DataTableCell>
                    <DataTableCell className="font-medium">{item.estado}</DataTableCell>
                    <DataTableCell>{item.porcentaje ?? '—'}</DataTableCell>
                    <DataTableCell className="text-xs whitespace-nowrap">{formatDate(item.fecha_evaluacion)}</DataTableCell>
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
                                      logger.error('estado_cumplimiento.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar</DialogTitle>
          </DialogHeader>
          {edit && (
            <FormFields
              key={edit.id}
              initial={edit}
              onSuccess={() => setEdit(null)}
              regOptions={regOptions}
              ctrlOptions={ctrlOptions}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
