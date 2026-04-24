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
  useAplicacionMovils,
} from '@/hooks/useAplicacionMovils';
import {
  useCreateEjecucionMAST,
  useDeleteEjecucionMAST,
  useEjecucionMASTs,
  useUpdateEjecucionMAST,
} from '@/hooks/useEjecucionMASTs';
import { logger } from '@/lib/logger';
import { EjecucionMASTCreateSchema, type EjecucionMAST, type EjecucionMASTCreate } from '@/lib/schemas/ejecucion_mast.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = EjecucionMASTCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  appOptions,
}: {
  initial?: EjecucionMAST | null;
  onSuccess: () => void;
  appOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateEjecucionMAST();
  const updateMut = useUpdateEjecucionMAST();
  const isEdit = Boolean(initial);
  const [ini, setIni] = useState(() => (initial ? isoToLocalDateTime(initial.fecha_inicio) : ''));
  const [fin, setFin] = useState(() => (initial ? isoToLocalDateTime(initial.fecha_fin) : ''));
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          aplicacion_movil_id: initial.aplicacion_movil_id,
          ambiente: initial.ambiente,
          fecha_inicio: initial.fecha_inicio,
          fecha_fin: initial.fecha_fin,
          resultado: initial.resultado,
          url_reporte: initial.url_reporte ?? null,
        }
      : {
          aplicacion_movil_id: appOptions[0]?.value ?? '',
          ambiente: 'QA',
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          resultado: 'Pendiente',
          url_reporte: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (initial) {
      setIni(isoToLocalDateTime(initial.fecha_inicio));
      setFin(isoToLocalDateTime(initial.fecha_fin));
    }
  }, [initial]);

  useEffect(() => {
    if (!initial && appOptions[0] && !form.getValues('aplicacion_movil_id')) {
      form.setValue('aplicacion_movil_id', appOptions[0].value);
    }
  }, [initial, appOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const fi = localDateTimeToIso(ini) || data.fecha_inicio;
    const ff = localDateTimeToIso(fin) || data.fecha_fin;
    const payload: EjecucionMASTCreate = {
      aplicacion_movil_id: data.aplicacion_movil_id,
      ambiente: data.ambiente.trim(),
      fecha_inicio: fi,
      fecha_fin: ff,
      resultado: data.resultado.trim(),
      url_reporte: data.url_reporte?.trim() || null,
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
            logger.error('ejecucion_mast.update.failed', { id: initial.id, error: e });
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
          logger.error('ejecucion_mast.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Aplicación móvil</label>
        <Select
          className="mt-1"
          value={form.watch('aplicacion_movil_id')}
          onChange={(e) => form.setValue('aplicacion_movil_id', e.target.value, { shouldValidate: true })}
          options={appOptions}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Ambiente</label>
        <Input className="mt-1" {...form.register('ambiente')} />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha inicio</label>
        <Input className="mt-1" type="datetime-local" value={ini} onChange={(e) => setIni(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha fin</label>
        <Input className="mt-1" type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Resultado</label>
        <Textarea className="mt-1" rows={2} {...form.register('resultado')} />
      </div>
      <div>
        <label className="text-sm font-medium">URL reporte</label>
        <Input className="mt-1" type="url" {...form.register('url_reporte')} />
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !appOptions.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function EjecucionMastsPage() {
  const { data: rows, isLoading, isError } = useEjecucionMASTs();
  const { data: apps } = useAplicacionMovils();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<EjecucionMAST | null>(null);
  const deleteMut = useDeleteEjecucionMAST();

  const appOptions = useMemo(
    () => (apps ?? []).map((a) => ({ value: a.id, label: a.nombre })),
    [apps],
  );
  const appName = useCallback(
    (id: string) => (apps ?? []).find((a) => a.id === id)?.nombre ?? id.slice(0, 8),
    [apps],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.ambiente.toLowerCase().includes(n) ||
        r.resultado.toLowerCase().includes(n) ||
        appName(r.aplicacion_movil_id).toLowerCase().includes(n),
    );
  }, [rows, q, appName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Ejecuciones MAST" description="Pruebas móviles enlazadas a una aplicación.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!appOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva ejecución</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} appOptions={appOptions} />
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
                  <DataTableTh>App</DataTableTh>
                  <DataTableTh>Ambiente</DataTableTh>
                  <DataTableTh>Resultado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-sm text-muted-foreground">{appName(item.aplicacion_movil_id)}</DataTableCell>
                    <DataTableCell>{item.ambiente}</DataTableCell>
                    <DataTableCell className="max-w-[200px] truncate text-sm">{item.resultado}</DataTableCell>
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
                                      logger.error('ejecucion_mast.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar ejecución</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} appOptions={appOptions} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
