'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
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
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Textarea,
} from '@/components/ui';
import {
  useCreateEtapaRelease,
  useDeleteEtapaRelease,
  useEtapaReleases,
  useUpdateEtapaRelease,
} from '@/hooks/useEtapaReleases';
import { useServiceReleases } from '@/hooks/useServiceReleases';
import { logger } from '@/lib/logger';
import {
  ESTADOS_ETAPA,
  ETAPAS_RELEASE,
  type EtapaRelease,
  type EtapaReleaseCreate,
  type EtapaReleaseUpdate,
} from '@/lib/schemas/etapa_release.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ALL = '' as const;

const etE = z.enum(ETAPAS_RELEASE);
const esE = z.enum(ESTADOS_ETAPA);

const etapaCreateFormSchema = z.object({
  service_release_id: z.string().uuid(),
  etapa: etE,
  estado: esE,
  aprobador_id: z.union([z.string().uuid(), z.literal('')]).optional(),
  justificacion: z.string().max(10_000).nullable().optional(),
  notas: z.string().max(10_000).nullable().optional(),
  fecha_completada: z.string().optional(),
});
type EtapaCreateForm = z.infer<typeof etapaCreateFormSchema>;

const etapaEditFormSchema = z.object({
  etapa: etE,
  estado: esE,
  justificacion: z.string().max(10_000).nullable().optional(),
  notas: z.string().max(10_000).nullable().optional(),
  fecha_completada: z.string().optional(),
});
type EtapaEditForm = z.infer<typeof etapaEditFormSchema>;

function toDatetimeLocal(s: string | null | undefined): string {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string | undefined) {
  if (!s || !s.trim()) return null;
  const t = new Date(s).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

function EtapaCreateForm({
  onSuccess,
  releaseOptions,
}: {
  onSuccess: () => void;
  releaseOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateEtapaRelease();
  const form = useForm<EtapaCreateForm>({
    resolver: zodResolver(etapaCreateFormSchema),
    defaultValues: {
      service_release_id: releaseOptions[0]?.value ?? '',
      etapa: 'Design Review',
      estado: 'Pendiente',
      aprobador_id: '',
      justificacion: null,
      notas: null,
      fecha_completada: '',
    },
  });
  const pending = createMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: EtapaReleaseCreate = {
      service_release_id: data.service_release_id,
      etapa: data.etapa,
      estado: data.estado,
      aprobador_id: data.aprobador_id && data.aprobador_id.length > 0 ? data.aprobador_id : null,
      justificacion: data.justificacion?.trim() || null,
      notas: data.notas?.trim() || null,
      fecha_completada: fromDatetimeLocal(data.fecha_completada),
    };
    createMut.mutate(payload, {
      onSuccess: () => {
        toast.success('Etapa creada');
        onSuccess();
      },
      onError: (e) => {
        logger.error('etapa_release.create.failed', { error: e });
        toast.error(extractErrorMessage(e, 'Error al crear'));
      },
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Liberación de servicio *</label>
        <Select
          className="mt-1"
          value={form.watch('service_release_id')}
          onChange={(e) => form.setValue('service_release_id', e.target.value, { shouldValidate: true })}
          options={releaseOptions}
          placeholder="Selecciona liberación"
        />
        {form.formState.errors.service_release_id && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.service_release_id.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Etapa *</label>
        <Select
          className="mt-1"
          value={form.watch('etapa')}
          onChange={(e) => form.setValue('etapa', e.target.value as (typeof ETAPAS_RELEASE)[number], { shouldValidate: true })}
          options={ETAPAS_RELEASE.map((e) => ({ value: e, label: e }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Estado *</label>
        <Select
          className="mt-1"
          value={form.watch('estado')}
          onChange={(e) => form.setValue('estado', e.target.value as (typeof ESTADOS_ETAPA)[number], { shouldValidate: true })}
          options={ESTADOS_ETAPA.map((e) => ({ value: e, label: e }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">ID aprobador (UUID opcional)</label>
        <Input
          className="mt-1 font-mono text-xs"
          value={form.watch('aprobador_id') || ''}
          onChange={(e) => form.setValue('aprobador_id', e.target.value, { shouldValidate: true })}
          placeholder="uuid…"
        />
        {form.formState.errors.aprobador_id && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.aprobador_id.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Justificación</label>
        <Textarea
          className="mt-1"
          rows={2}
          value={form.watch('justificacion') ?? ''}
          onChange={(e) => form.setValue('justificacion', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Notas</label>
        <Textarea
          className="mt-1"
          rows={2}
          value={form.watch('notas') ?? ''}
          onChange={(e) => form.setValue('notas', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha completada</label>
        <Input
          className="mt-1"
          type="datetime-local"
          value={form.watch('fecha_completada') ?? ''}
          onChange={(e) => form.setValue('fecha_completada', e.target.value, { shouldValidate: true })}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear
        </Button>
      </div>
    </form>
  );
}

function EtapaEditForm({ initial, onSuccess, releaseLabel }: { initial: EtapaRelease; onSuccess: () => void; releaseLabel: string }) {
  const updateMut = useUpdateEtapaRelease();
  const form = useForm<EtapaEditForm>({
    resolver: zodResolver(etapaEditFormSchema),
    defaultValues: {
      etapa: initial.etapa as (typeof ETAPAS_RELEASE)[number],
      estado: initial.estado as (typeof ESTADOS_ETAPA)[number],
      justificacion: initial.justificacion ?? null,
      notas: initial.notas ?? null,
      fecha_completada: toDatetimeLocal(initial.fecha_completada),
    },
  });
  const pending = updateMut.isPending;

  const nIso = (s: string | null | undefined) => (s ? new Date(s).toISOString() : null);

  const onSubmit = form.handleSubmit((data) => {
    const next = {
      etapa: data.etapa,
      estado: data.estado,
      justificacion: data.justificacion?.trim() || null,
      notas: data.notas?.trim() || null,
      fecha_completada: fromDatetimeLocal(data.fecha_completada),
    };
    const patch: EtapaReleaseUpdate = {};
    if (next.etapa !== initial.etapa) patch.etapa = next.etapa;
    if (next.estado !== initial.estado) patch.estado = next.estado;
    if ((next.justificacion ?? null) !== (initial.justificacion ?? null)) patch.justificacion = next.justificacion;
    if ((next.notas ?? null) !== (initial.notas ?? null)) patch.notas = next.notas;
    if (nIso(next.fecha_completada) !== nIso(initial.fecha_completada ?? null)) patch.fecha_completada = next.fecha_completada;
    if (Object.keys(patch).length === 0) {
      onSuccess();
      return;
    }
    updateMut.mutate(
      { id: initial.id, ...patch },
      {
        onSuccess: () => {
          toast.success('Etapa actualizada');
          onSuccess();
        },
        onError: (e) => {
          logger.error('etapa_release.update.failed', { id: String(initial.id), error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="rounded-md border border-white/10 p-3 text-sm text-muted-foreground">Liberación: {releaseLabel}</div>
      <div>
        <label className="text-sm font-medium">Etapa *</label>
        <Select
          className="mt-1"
          value={form.watch('etapa') ?? 'Design Review'}
          onChange={(e) => form.setValue('etapa', e.target.value as (typeof ETAPAS_RELEASE)[number], { shouldValidate: true })}
          options={ETAPAS_RELEASE.map((e) => ({ value: e, label: e }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Estado *</label>
        <Select
          className="mt-1"
          value={form.watch('estado') ?? 'Pendiente'}
          onChange={(e) => form.setValue('estado', e.target.value as (typeof ESTADOS_ETAPA)[number], { shouldValidate: true })}
          options={ESTADOS_ETAPA.map((e) => ({ value: e, label: e }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Justificación</label>
        <Textarea
          className="mt-1"
          rows={2}
          value={form.watch('justificacion') ?? ''}
          onChange={(e) => form.setValue('justificacion', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Notas</label>
        <Textarea
          className="mt-1"
          rows={2}
          value={form.watch('notas') ?? ''}
          onChange={(e) => form.setValue('notas', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha completada</label>
        <Input
          className="mt-1"
          type="datetime-local"
          value={form.watch('fecha_completada') ?? ''}
          onChange={(e) => form.setValue('fecha_completada', e.target.value, { shouldValidate: true })}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
      </div>
    </form>
  );
}

export default function EtapaReleasesPage() {
  const { data: rows, isLoading, isError } = useEtapaReleases();
  const { data: releases } = useServiceReleases();
  const [q, setQ] = useState('');
  const [releaseF, setReleaseF] = useState<string>(ALL);
  const [etapaF, setEtapaF] = useState<string>(ALL);
  const [estadoF, setEstadoF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<EtapaRelease | null>(null);
  const deleteMut = useDeleteEtapaRelease();

  const releaseOptions = useMemo(
    () => (releases ?? []).map((r) => ({ value: r.id, label: `${r.nombre} ${r.version}`.trim() })),
    [releases],
  );
  const relLabel = useCallback((id: string) => {
    const r = (releases ?? []).find((x) => x.id === id);
    return r ? `${r.nombre} ${r.version}`.trim() : id.slice(0, 8);
  }, [releases]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (releaseF === ALL ? true : r.service_release_id === releaseF))
      .filter((r) => (etapaF === ALL ? true : r.etapa === etapaF))
      .filter((r) => (estadoF === ALL ? true : r.estado === estadoF))
      .filter((r) => {
        if (!s) return true;
        return (
          r.etapa.toLowerCase().includes(s) ||
          r.estado.toLowerCase().includes(s) ||
          relLabel(r.service_release_id).toLowerCase().includes(s) ||
          (r.notas && r.notas.toLowerCase().includes(s)) ||
          (r.justificacion && r.justificacion.toLowerCase().includes(s))
        );
      });
  }, [rows, q, releaseF, etapaF, estadoF, relLabel]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Etapas de liberación"
        description="Etapas del flujo (diseño, validación, pruebas, aprobación, QA, producción) por liberación de servicio."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva etapa</DialogTitle>
            </DialogHeader>
            <EtapaCreateForm onSuccess={() => setCreateOpen(false)} releaseOptions={releaseOptions} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <ListChecks className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} etapa(s)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl">
            <div>
              <label className="text-sm font-medium">Liberación</label>
              <Select
                className="mt-1"
                value={releaseF}
                onChange={(e) => setReleaseF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todas' },
                  ...releaseOptions,
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Etapa</label>
              <Select
                className="mt-1"
                value={etapaF}
                onChange={(e) => setEtapaF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todas' },
                  ...ETAPAS_RELEASE.map((e) => ({ value: e, label: e })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select
                className="mt-1"
                value={estadoF}
                onChange={(e) => setEstadoF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...ESTADOS_ETAPA.map((e) => ({ value: e, label: e })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <Input className="mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Texto…" />
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-destructive">No se pudo cargar el listado.</p>}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay etapas. Cree liberaciones de servicio primero.</p>
          )}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Liberación</DataTableTh>
                  <DataTableTh>Etapa</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Completada</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => (
                  <DataTableRow key={r.id}>
                    <DataTableCell className="text-sm max-w-[200px]">
                      <span className="line-clamp-2" title={relLabel(r.service_release_id)}>
                        {relLabel(r.service_release_id)}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="primary">{r.etapa}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="default">{r.estado}</Badge>
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {r.fecha_completada ? formatDate(r.fecha_completada) : '—'}
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(r.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="xs" onClick={() => setEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="ghost" size="xs">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar etapa?</AlertDialogTitle>
                              <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(r.id, {
                                    onSuccess: () => toast.success('Eliminada'),
                                    onError: (e) => {
                                      logger.error('etapa_release.delete.failed', { id: r.id, error: e });
                                      toast.error(extractErrorMessage(e, 'No se pudo eliminar'));
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
            <DialogTitle>Editar etapa</DialogTitle>
          </DialogHeader>
          {edit && (
            <EtapaEditForm
              key={edit.id}
              initial={edit}
              onSuccess={() => setEdit(null)}
              releaseLabel={relLabel(edit.service_release_id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
