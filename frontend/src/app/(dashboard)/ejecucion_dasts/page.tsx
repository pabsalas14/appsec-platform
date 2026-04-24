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
import { isoToLocalDateTime, localDateTimeToIso } from '@/components/crud';
import {
  useCreateEjecucionDast,
  useDeleteEjecucionDast,
  useEjecucionDasts,
  useUpdateEjecucionDast,
} from '@/hooks/useEjecucionDasts';
import { useProgramaDasts } from '@/hooks/useProgramaDasts';
import { logger } from '@/lib/logger';
import { EjecucionDastCreateSchema, type EjecucionDast, type EjecucionDastCreate } from '@/lib/schemas/ejecucion_dast.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = EjecucionDastCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  pdOptions,
}: {
  initial?: EjecucionDast | null;
  onSuccess: () => void;
  pdOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateEjecucionDast();
  const updateMut = useUpdateEjecucionDast();
  const isEdit = Boolean(initial);
  const [ini, setIni] = useState(() => (initial ? isoToLocalDateTime(initial.fecha_inicio) : ''));
  const [fin, setFin] = useState(() => (initial?.fecha_fin ? isoToLocalDateTime(initial.fecha_fin) : ''));
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          programa_dast_id: initial.programa_dast_id,
          fecha_inicio: initial.fecha_inicio,
          fecha_fin: initial.fecha_fin ?? null,
          ambiente: initial.ambiente,
          herramienta: initial.herramienta ?? null,
          resultado: initial.resultado,
          notas: initial.notas ?? null,
        }
      : {
          programa_dast_id: pdOptions[0]?.value ?? '',
          fecha_inicio: new Date().toISOString(),
          fecha_fin: null,
          ambiente: 'QA',
          herramienta: null,
          resultado: 'Pendiente',
          notas: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (initial) {
      setIni(isoToLocalDateTime(initial.fecha_inicio));
      setFin(initial.fecha_fin ? isoToLocalDateTime(initial.fecha_fin) : '');
    }
  }, [initial]);

  useEffect(() => {
    if (!initial && pdOptions[0] && !form.getValues('programa_dast_id')) {
      form.setValue('programa_dast_id', pdOptions[0].value);
    }
  }, [initial, pdOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const fi = localDateTimeToIso(ini) || data.fecha_inicio;
    const ffin = fin.trim() ? localDateTimeToIso(fin) : null;
    const payload: EjecucionDastCreate = {
      programa_dast_id: data.programa_dast_id,
      fecha_inicio: fi,
      fecha_fin: ffin,
      ambiente: data.ambiente.trim(),
      herramienta: data.herramienta?.trim() || null,
      resultado: data.resultado.trim(),
      notas: data.notas?.trim() || null,
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
            logger.error('ejecucion_dast.update.failed', { id: initial.id, error: e });
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
          logger.error('ejecucion_dast.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Programa DAST</label>
        <Select
          className="mt-1"
          value={form.watch('programa_dast_id')}
          onChange={(e) => form.setValue('programa_dast_id', e.target.value, { shouldValidate: true })}
          options={pdOptions}
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
        <label className="text-sm font-medium">Ambiente</label>
        <Input className="mt-1" {...form.register('ambiente')} />
      </div>
      <div>
        <label className="text-sm font-medium">Herramienta</label>
        <Input className="mt-1" {...form.register('herramienta')} />
      </div>
      <div>
        <label className="text-sm font-medium">Resultado</label>
        <Textarea className="mt-1" rows={2} {...form.register('resultado')} />
      </div>
      <div>
        <label className="text-sm font-medium">Notas</label>
        <Textarea className="mt-1" rows={2} {...form.register('notas')} />
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !pdOptions.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function EjecucionDastsPage() {
  const { data: rows, isLoading, isError } = useEjecucionDasts();
  const { data: pds } = useProgramaDasts();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<EjecucionDast | null>(null);
  const deleteMut = useDeleteEjecucionDast();

  const pdOptions = useMemo(() => (pds ?? []).map((p) => ({ value: p.id, label: p.nombre })), [pds]);
  const pdName = useCallback(
    (id: string) => (pds ?? []).find((p) => p.id === id)?.nombre ?? id.slice(0, 8),
    [pds],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.ambiente.toLowerCase().includes(n) ||
        r.resultado.toLowerCase().includes(n) ||
        pdName(r.programa_dast_id).toLowerCase().includes(n),
    );
  }, [rows, q, pdName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Ejecuciones DAST" description="Ciclos de prueba dinámica por programa.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!pdOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva ejecución</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} pdOptions={pdOptions} />
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
                  <DataTableTh>Programa</DataTableTh>
                  <DataTableTh>Ambiente</DataTableTh>
                  <DataTableTh>Resultado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {pdName(item.programa_dast_id)}
                    </DataTableCell>
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
                                      logger.error('ejecucion_dast.delete.failed', { id: item.id, error: e });
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
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} pdOptions={pdOptions} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
