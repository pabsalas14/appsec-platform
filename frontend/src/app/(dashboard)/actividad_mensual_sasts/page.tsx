'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownAZ, ArrowUpAZ, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
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
import { CatalogPaginationBar } from '@/components/catalog/CatalogPaginationBar';
import {
  useActividadMensualSasts,
  useActividadMensualSastScoringConfig,
  useCreateActividadMensualSast,
  useDeleteActividadMensualSast,
  useSincronizarHallazgosActividadMensualSast,
  useUpdateActividadMensualSast,
} from '@/hooks/useActividadMensualSasts';
import { useClientPagedList } from '@/hooks/useClientPagedList';
import { useProgramaSasts } from '@/hooks/useProgramaSasts';
import { logger } from '@/lib/logger';
import {
  ActividadMensualSastCreateSchema,
  type ActividadMensualSast,
  type ActividadMensualSastCreate,
} from '@/lib/schemas/actividad_mensual_sast.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = ActividadMensualSastCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  progOptions,
  subEstadoOptions,
}: {
  initial?: ActividadMensualSast | null;
  onSuccess: () => void;
  progOptions: { value: string; label: string }[];
  subEstadoOptions: string[];
}) {
  const createMut = useCreateActividadMensualSast();
  const updateMut = useUpdateActividadMensualSast();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          programa_sast_id: initial.programa_sast_id,
          mes: initial.mes,
          ano: initial.ano,
          total_hallazgos: initial.total_hallazgos ?? null,
          criticos: initial.criticos ?? null,
          altos: initial.altos ?? null,
          medios: initial.medios ?? null,
          bajos: initial.bajos ?? null,
          sub_estado: initial.sub_estado ?? null,
          notas: initial.notas ?? null,
        }
      : {
          programa_sast_id: progOptions[0]?.value ?? '',
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          total_hallazgos: null,
          criticos: null,
          altos: null,
          medios: null,
          bajos: null,
          sub_estado: null,
          notas: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!initial && progOptions[0] && !form.getValues('programa_sast_id')) {
      form.setValue('programa_sast_id', progOptions[0].value);
    }
  }, [initial, progOptions, form]);

  const nOpt = (name: keyof FormData) =>
    form.register(name, { valueAsNumber: true, setValueAs: (v) => (v === '' || v == null ? null : Number(v)) });

  const onSubmit = form.handleSubmit((data) => {
    const payload: ActividadMensualSastCreate = {
      programa_sast_id: data.programa_sast_id,
      mes: data.mes,
      ano: data.ano,
      total_hallazgos: data.total_hallazgos ?? null,
      criticos: data.criticos ?? null,
      altos: data.altos ?? null,
      medios: data.medios ?? null,
      bajos: data.bajos ?? null,
      sub_estado: data.sub_estado?.trim() || null,
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
            logger.error('actividad_mensual_sast.update.failed', { id: initial.id, error: e });
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
          logger.error('actividad_mensual_sast.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Programa SAST</label>
        <Select
          className="mt-1"
          value={form.watch('programa_sast_id')}
          onChange={(e) => form.setValue('programa_sast_id', e.target.value, { shouldValidate: true })}
          options={progOptions}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Mes (1-12)</label>
          <Input className="mt-1" type="number" min={1} max={12} {...form.register('mes', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="text-sm font-medium">Año</label>
          <Input className="mt-1" type="number" {...form.register('ano', { valueAsNumber: true })} />
        </div>
      </div>
      {(['total_hallazgos', 'criticos', 'altos', 'medios', 'bajos'] as const).map((f) => (
        <div key={f}>
          <label className="text-sm font-medium">{f}</label>
          <Input className="mt-1" type="number" {...nOpt(f)} />
        </div>
      ))}
      <div>
        <label className="text-sm font-medium">Sub-estado</label>
        {subEstadoOptions.length > 0 ? (
          <Select
            className="mt-1"
            value={form.watch('sub_estado') ?? ''}
            onChange={(e) => form.setValue('sub_estado', e.target.value || null)}
            options={[
              { value: '', label: '— Sin sub-estado' },
              ...subEstadoOptions.map((s) => ({ value: s, label: s })),
            ]}
          />
        ) : (
          <Input className="mt-1" placeholder="P. ej. Pendiente, En análisis…" {...form.register('sub_estado')} />
        )}
      </div>
      {isEdit && initial && (
        <p className="text-xs text-muted-foreground">
          Score: {initial.score != null ? initial.score.toFixed(2) : '—'} (recalculado al sincronizar hallazgos)
        </p>
      )}
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
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function ActividadMensualSastsPage() {
  const { data: rows, isLoading, isError } = useActividadMensualSasts();
  const { data: progs } = useProgramaSasts();
  const { data: scoringCfg } = useActividadMensualSastScoringConfig();
  const [q, setQ] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<ActividadMensualSast | null>(null);
  const deleteMut = useDeleteActividadMensualSast();
  const syncMut = useSincronizarHallazgosActividadMensualSast();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const progOptions = useMemo(
    () => (progs ?? []).map((p) => ({ value: p.id, label: p.nombre })),
    [progs],
  );
  const progName = useCallback(
    (id: string) => (progs ?? []).find((p) => p.id === id)?.nombre ?? id.slice(0, 8),
    [progs],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        String(r.mes).includes(n) ||
        String(r.ano).includes(n) ||
        progName(r.programa_sast_id).toLowerCase().includes(n) ||
        (r.notas && r.notas.toLowerCase().includes(n)) ||
        (r.sub_estado && r.sub_estado.toLowerCase().includes(n)),
    );
  }, [rows, q, progName]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const ta = a.ano * 100 + a.mes;
      const tb = b.ano * 100 + b.mes;
      const cmp = ta - tb;
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [filtered, sortDesc]);

  const list = useClientPagedList(sorted, [q, sortDesc]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Actividad mensual SAST" description="Métricas agregadas por mes y programa SAST.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva actividad</DialogTitle>
            </DialogHeader>
            <FormFields
              onSuccess={() => setCreateOpen(false)}
              progOptions={progOptions}
              subEstadoOptions={scoringCfg?.sub_estados_mes ?? []}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="max-w-md flex-1">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                className="mt-1"
                placeholder="Programa, mes, año, notas, sub-estado…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSortDesc((v) => !v)}>
              {sortDesc ? <ArrowDownAZ className="mr-2 h-4 w-4" /> : <ArrowUpAZ className="mr-2 h-4 w-4" />}
              Periodo: {sortDesc ? 'reciente primero' : 'antiguo primero'}
            </Button>
          </div>
          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin datos.</p>}
          {list.total > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Programa</DataTableTh>
                  <DataTableTh>Mes / año</DataTableTh>
                  <DataTableTh>Sub-estado</DataTableTh>
                  <DataTableTh>Total</DataTableTh>
                  <DataTableTh>Score</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[140px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.paged.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {progName(item.programa_sast_id)}
                    </DataTableCell>
                    <DataTableCell>
                      {item.mes}/{item.ano}
                    </DataTableCell>
                    <DataTableCell className="text-sm">{item.sub_estado ?? '—'}</DataTableCell>
                    <DataTableCell>{item.total_hallazgos ?? '—'}</DataTableCell>
                    <DataTableCell className="text-sm tabular-nums">
                      {item.score != null ? item.score.toFixed(2) : '—'}
                    </DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          title="Sincronizar conteos y score desde hallazgos SAST"
                          disabled={syncMut.isPending}
                          onClick={() => {
                            setSyncingId(item.id);
                            syncMut.mutate(item.id, {
                              onSuccess: () => toast.success('Hallazgos sincronizados'),
                              onError: (e) => {
                                logger.error('actividad_mensual_sast.sync.failed', { id: item.id, error: e });
                                toast.error(extractErrorMessage(e, 'Error al sincronizar'));
                              },
                              onSettled: () => setSyncingId(null),
                            });
                          }}
                        >
                          {syncMut.isPending && syncingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
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
                                      logger.error('actividad_mensual_sast.delete.failed', { id: item.id, error: e });
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
          <CatalogPaginationBar
            page={list.page}
            pageCount={list.pageCount}
            total={list.total}
            from={list.from}
            to={list.to}
            pageSize={list.pageSize}
            onPageChange={list.setPage}
            onPageSizeChange={(n) => {
              list.setPageSize(n);
              list.setPage(0);
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar actividad</DialogTitle>
          </DialogHeader>
          {edit && (
            <FormFields
              key={edit.id}
              initial={edit}
              onSuccess={() => setEdit(null)}
              progOptions={progOptions}
              subEstadoOptions={scoringCfg?.sub_estados_mes ?? []}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
