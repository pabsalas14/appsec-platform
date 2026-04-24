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
import { localDateTimeToIso, isoToLocalDateTime } from '@/components/crud';
import {
  useCreateEvidenciaRegulacion,
  useDeleteEvidenciaRegulacion,
  useEvidenciaRegulacions,
  useUpdateEvidenciaRegulacion,
} from '@/hooks/useEvidenciaRegulacions';
import { useRegulacionControls } from '@/hooks/useRegulacionControls';
import { useServicioReguladoRegistros } from '@/hooks/useServicioReguladoRegistros';
import { useServicios } from '@/hooks/useServicios';
import { logger } from '@/lib/logger';
import {
  EvidenciaRegulacionCreateSchema,
  type EvidenciaRegulacion,
  type EvidenciaRegulacionCreate,
} from '@/lib/schemas/evidencia_regulacion.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = EvidenciaRegulacionCreateSchema;
type FormData = z.infer<typeof formSchema>;
const NO_CONTROL = '__none__';

function FormFields({
  initial,
  onSuccess,
  regOptions,
  ctrlOptions,
}: {
  initial?: EvidenciaRegulacion | null;
  onSuccess: () => void;
  regOptions: { value: string; label: string }[];
  ctrlOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateEvidenciaRegulacion();
  const updateMut = useUpdateEvidenciaRegulacion();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          registro_id: initial.registro_id,
          control_id: initial.control_id ?? null,
          descripcion: initial.descripcion,
          filename: initial.filename ?? null,
          sha256: initial.sha256 ?? null,
          fecha: initial.fecha,
        }
      : {
          registro_id: regOptions[0]?.value ?? '',
          control_id: null,
          descripcion: '',
          filename: null,
          sha256: null,
          fecha: new Date().toISOString(),
        },
  });
  const pending = createMut.isPending || updateMut.isPending;
  const [fechaLocal, setFechaLocal] = useState(() =>
    initial ? isoToLocalDateTime(initial.fecha) : isoToLocalDateTime(new Date().toISOString()),
  );

  useEffect(() => {
    if (initial) {
      setFechaLocal(isoToLocalDateTime(initial.fecha));
    }
  }, [initial]);

  useEffect(() => {
    if (!initial && regOptions[0] && !form.getValues('registro_id')) {
      form.setValue('registro_id', regOptions[0].value);
    }
  }, [initial, regOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const fechaIso = localDateTimeToIso(fechaLocal) || data.fecha;
    const payload: EvidenciaRegulacionCreate = {
      registro_id: data.registro_id,
      control_id: data.control_id && data.control_id.length > 0 ? data.control_id : null,
      descripcion: data.descripcion.trim(),
      filename: data.filename?.trim() || null,
      sha256: data.sha256?.trim() || null,
      fecha: fechaIso,
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
            logger.error('evidencia_regulacion.update.failed', { id: initial.id, error: e });
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
          logger.error('evidencia_regulacion.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  const ctrlSel = form.watch('control_id');
  const ctrlValue = ctrlSel ? ctrlSel : NO_CONTROL;

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Registro regulado</label>
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
          value={ctrlValue}
          onChange={(e) => {
            const v = e.target.value;
            form.setValue('control_id', v === NO_CONTROL ? null : v, { shouldValidate: true });
          }}
          options={[{ value: NO_CONTROL, label: '— Ninguno —' }, ...ctrlOptions]}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} {...form.register('descripcion')} />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha / hora</label>
        <Input className="mt-1" type="datetime-local" value={fechaLocal} onChange={(e) => setFechaLocal(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Archivo</label>
          <Input className="mt-1" {...form.register('filename')} />
        </div>
        <div>
          <label className="text-sm font-medium">SHA-256</label>
          <Input className="mt-1" {...form.register('sha256')} />
        </div>
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

export default function EvidenciaRegulacionsPage() {
  const { data: rows, isLoading, isError } = useEvidenciaRegulacions();
  const { data: regs } = useServicioReguladoRegistros();
  const { data: srvs } = useServicios();
  const { data: controls } = useRegulacionControls();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<EvidenciaRegulacion | null>(null);
  const deleteMut = useDeleteEvidenciaRegulacion();

  const regOptions = useMemo(() => {
    return (regs ?? []).map((r) => {
      const sn = (srvs ?? []).find((s) => s.id === r.servicio_id)?.nombre ?? '';
      return { value: r.id, label: `${r.nombre_regulacion} · ${sn || r.servicio_id.slice(0, 8)}` };
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
      (r) => r.descripcion.toLowerCase().includes(n) || regLabel(r.registro_id).toLowerCase().includes(n),
    );
  }, [rows, q, regLabel]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Evidencias de regulación" description="Evidencias en el marco de un registro de cumplimiento.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!regOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva evidencia</DialogTitle>
            </DialogHeader>
            <FormFields
              onSuccess={() => setCreateOpen(false)}
              regOptions={regOptions}
              ctrlOptions={ctrlOptions}
            />
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
                  <DataTableTh>Descripción</DataTableTh>
                  <DataTableTh>Fecha</DataTableTh>
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
                    <DataTableCell className="max-w-[200px] truncate text-sm">{item.descripcion}</DataTableCell>
                    <DataTableCell className="text-xs whitespace-nowrap">{formatDate(item.fecha)}</DataTableCell>
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
                                      logger.error('evidencia_regulacion.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar evidencia</DialogTitle>
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
