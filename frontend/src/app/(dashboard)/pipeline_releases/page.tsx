'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { GitBranch, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
} from '@/components/ui';
import {
  useCreatePipelineRelease,
  useDeletePipelineRelease,
  usePipelineReleases,
  useUpdatePipelineRelease,
} from '@/hooks/usePipelineReleases';
import { useRepositorios } from '@/hooks/useRepositorios';
import { useServiceReleases } from '@/hooks/useServiceReleases';
import { logger } from '@/lib/logger';
import {
  PipelineReleaseFormCreateSchema,
  RESULTADOS_PIPELINE,
  TIPOS_PIPELINE,
  type PipelineRelease,
  type PipelineReleaseCreate,
  type PipelineReleaseUpdate,
} from '@/lib/schemas/pipeline_release.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ALL = '' as const;

const pipelineEditSchema = z.object({
  rama: z.string().min(1).max(255),
  commit_sha: z.string().max(64).nullable().optional(),
  resultado: z.enum(RESULTADOS_PIPELINE),
  herramienta: z.string().max(200).nullable().optional(),
});
type PipelineEditForm = z.infer<typeof pipelineEditSchema>;

function PipelineCreateForm({ onSuccess, repoOptions, releaseOptions }: { onSuccess: () => void; repoOptions: { value: string; label: string }[]; releaseOptions: { value: string; label: string }[] }) {
  const createMut = useCreatePipelineRelease();
  const form = useForm<z.infer<typeof PipelineReleaseFormCreateSchema>>({
    resolver: zodResolver(PipelineReleaseFormCreateSchema),
    defaultValues: {
      service_release_id: '',
      repositorio_id: repoOptions[0]?.value ?? '',
      rama: 'main',
      commit_sha: null,
      tipo: 'SAST',
      resultado: 'Pendiente',
      herramienta: null,
    },
  });
  const pending = createMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: PipelineReleaseCreate = {
      service_release_id: data.service_release_id && data.service_release_id.length > 0 ? data.service_release_id : null,
      repositorio_id: data.repositorio_id,
      rama: data.rama.trim(),
      commit_sha: data.commit_sha?.trim() || null,
      tipo: data.tipo,
      resultado: data.resultado,
      herramienta: data.herramienta?.trim() || null,
    };
    createMut.mutate(payload, {
      onSuccess: () => {
        toast.success('Ejecución de pipeline creada');
        onSuccess();
      },
      onError: (e) => {
        logger.error('pipeline_release.create.failed', { error: e });
        toast.error(extractErrorMessage(e, 'Error al crear'));
      },
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Liberación de servicio (opcional)</label>
        <Select
          className="mt-1"
          value={form.watch('service_release_id') || ''}
          onChange={(e) => form.setValue('service_release_id', e.target.value, { shouldValidate: true })}
          options={[
            { value: '', label: 'Ninguna' },
            ...releaseOptions,
          ]}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Repositorio *</label>
        <Select
          className="mt-1"
          value={form.watch('repositorio_id')}
          onChange={(e) => form.setValue('repositorio_id', e.target.value, { shouldValidate: true })}
          options={repoOptions}
          placeholder="Repositorio"
        />
        {form.formState.errors.repositorio_id && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.repositorio_id.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Rama *</label>
        <Input className="mt-1" maxLength={255} {...form.register('rama')} />
        {form.formState.errors.rama && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.rama.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Commit (SHA)</label>
        <Input
          className="mt-1 font-mono text-xs"
          maxLength={64}
          value={form.watch('commit_sha') ?? ''}
          onChange={(e) => form.setValue('commit_sha', e.target.value || null, { shouldValidate: true })}
          placeholder="abc123…"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Tipo *</label>
        <Select
          className="mt-1"
          value={form.watch('tipo')}
          onChange={(e) => form.setValue('tipo', e.target.value as (typeof TIPOS_PIPELINE)[number], { shouldValidate: true })}
          options={TIPOS_PIPELINE.map((t) => ({ value: t, label: t }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Resultado *</label>
        <Select
          className="mt-1"
          value={form.watch('resultado')}
          onChange={(e) => form.setValue('resultado', e.target.value as (typeof RESULTADOS_PIPELINE)[number], { shouldValidate: true })}
          options={RESULTADOS_PIPELINE.map((r) => ({ value: r, label: r }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Herramienta</label>
        <Input
          className="mt-1"
          maxLength={200}
          value={form.watch('herramienta') ?? ''}
          onChange={(e) => form.setValue('herramienta', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !form.watch('repositorio_id')}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear
        </Button>
      </div>
    </form>
  );
}

function PipelineEditForm({ initial, onSuccess, repoName }: { initial: PipelineRelease; onSuccess: () => void; repoName: string }) {
  const updateMut = useUpdatePipelineRelease();
  const form = useForm<PipelineEditForm>({
    resolver: zodResolver(pipelineEditSchema),
    defaultValues: {
      rama: initial.rama,
      commit_sha: initial.commit_sha ?? null,
      resultado: initial.resultado as (typeof RESULTADOS_PIPELINE)[number],
      herramienta: initial.herramienta ?? null,
    },
  });
  const pending = updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const patch: PipelineReleaseUpdate = {};
    if (data.rama.trim() !== initial.rama) patch.rama = data.rama.trim();
    if ((data.commit_sha ?? null) !== (initial.commit_sha ?? null)) patch.commit_sha = data.commit_sha?.trim() || null;
    if (data.resultado !== initial.resultado) patch.resultado = data.resultado;
    if ((data.herramienta ?? null) !== (initial.herramienta ?? null)) patch.herramienta = data.herramienta?.trim() || null;
    if (Object.keys(patch).length === 0) {
      onSuccess();
      return;
    }
    updateMut.mutate(
      { id: initial.id, ...patch },
      {
        onSuccess: () => {
          toast.success('Pipeline actualizado');
          onSuccess();
        },
        onError: (e) => {
          logger.error('pipeline_release.update.failed', { id: String(initial.id), error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="rounded-md border border-white/10 p-3 text-sm space-y-1">
        <p>
          <span className="text-muted-foreground">Repositorio: </span>
          {repoName}
        </p>
        <p>
          <span className="text-muted-foreground">Tipo: </span>
          {initial.tipo}
        </p>
        <p className="text-xs text-muted-foreground">No se puede cambiar repositorio, tipo ni liberación; solo rama, commit, resultado y herramienta.</p>
      </div>
      <div>
        <label className="text-sm font-medium">Rama *</label>
        <Input className="mt-1" maxLength={255} {...form.register('rama')} />
        {form.formState.errors.rama && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.rama.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Commit (SHA)</label>
        <Input
          className="mt-1 font-mono text-xs"
          maxLength={64}
          value={form.watch('commit_sha') ?? ''}
          onChange={(e) => form.setValue('commit_sha', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Resultado *</label>
        <Select
          className="mt-1"
          value={form.watch('resultado')}
          onChange={(e) => form.setValue('resultado', e.target.value as (typeof RESULTADOS_PIPELINE)[number], { shouldValidate: true })}
          options={RESULTADOS_PIPELINE.map((r) => ({ value: r, label: r }))}
        />
        {form.formState.errors.resultado && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.resultado.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Herramienta</label>
        <Input
          className="mt-1"
          maxLength={200}
          value={form.watch('herramienta') ?? ''}
          onChange={(e) => form.setValue('herramienta', e.target.value || null, { shouldValidate: true })}
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

export default function PipelineReleasesPage() {
  const { data: rows, isLoading, isError } = usePipelineReleases();
  const { data: repos } = useRepositorios();
  const { data: releases } = useServiceReleases();
  const [q, setQ] = useState('');
  const [repoF, setRepoF] = useState<string>(ALL);
  const [tipoF, setTipoF] = useState<string>(ALL);
  const [resF, setResF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<PipelineRelease | null>(null);
  const deleteMut = useDeletePipelineRelease();

  const repoOptions = useMemo(
    () => (repos ?? []).map((r) => ({ value: r.id, label: r.nombre })),
    [repos],
  );
  const releaseOptions = useMemo(
    () => (releases ?? []).map((r) => ({ value: r.id, label: `${r.nombre} ${r.version}`.trim() })),
    [releases],
  );
  const repoName = useCallback(
    (id: string) => (repos ?? []).find((x) => x.id === id)?.nombre ?? id.slice(0, 8),
    [repos],
  );
  const releaseLabel = useCallback((id: string | null | undefined) => {
    if (!id) return '—';
    const r = (releases ?? []).find((x) => x.id === id);
    return r ? `${r.nombre} ${r.version}` : id.slice(0, 8);
  }, [releases]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (repoF === ALL ? true : r.repositorio_id === repoF))
      .filter((r) => (tipoF === ALL ? true : r.tipo === tipoF))
      .filter((r) => (resF === ALL ? true : r.resultado === resF))
      .filter((r) => {
        if (!s) return true;
        return (
          r.rama.toLowerCase().includes(s) ||
          (r.commit_sha && r.commit_sha.toLowerCase().includes(s)) ||
          (r.herramienta && r.herramienta.toLowerCase().includes(s)) ||
          repoName(r.repositorio_id).toLowerCase().includes(s)
        );
      });
  }, [rows, q, repoF, tipoF, resF, repoName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Pipelines (SAST / DAST / SCA)"
        description="Ejecuciones de análisis vinculadas a un repositorio (y opcionalmente a una liberación de servicio)."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!repoOptions.length}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva ejecución de pipeline</DialogTitle>
            </DialogHeader>
            <PipelineCreateForm
              onSuccess={() => setCreateOpen(false)}
              repoOptions={repoOptions}
              releaseOptions={releaseOptions}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <GitBranch className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} registro(s)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl">
            <div>
              <label className="text-sm font-medium">Repositorio</label>
              <Select
                className="mt-1"
                value={repoF}
                onChange={(e) => setRepoF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...repoOptions,
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select
                className="mt-1"
                value={tipoF}
                onChange={(e) => setTipoF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...TIPOS_PIPELINE.map((t) => ({ value: t, label: t })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Resultado</label>
              <Select
                className="mt-1"
                value={resF}
                onChange={(e) => setResF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...RESULTADOS_PIPELINE.map((r) => ({ value: r, label: r })),
                ]}
              />
            </div>
            <div className="max-w-md">
              <label className="text-sm font-medium">Buscar</label>
              <Input className="mt-1" placeholder="Rama, commit, repo…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-destructive">No se pudo cargar el listado.</p>}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay pipelines. Defina repositorios primero.</p>
          )}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Repo / tipo</DataTableTh>
                  <DataTableTh>Rama</DataTableTh>
                  <DataTableTh>Resultado</DataTableTh>
                  <DataTableTh>Liberación</DataTableTh>
                  <DataTableTh>Herramienta</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => (
                  <DataTableRow key={r.id}>
                    <DataTableCell>
                      <div className="font-medium">{repoName(r.repositorio_id)}</div>
                      <Badge variant="primary" className="mt-0.5">
                        {r.tipo}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell className="font-mono text-xs">{r.rama}</DataTableCell>
                    <DataTableCell>
                      <Badge variant="default">{r.resultado}</Badge>
                    </DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      <span title={releaseLabel(r.service_release_id)}>{releaseLabel(r.service_release_id)}</span>
                    </DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground">{r.herramienta ?? '—'}</DataTableCell>
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
                              <AlertDialogTitle>¿Eliminar registro de pipeline?</AlertDialogTitle>
                              <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(r.id, {
                                    onSuccess: () => toast.success('Eliminado'),
                                    onError: (e) => {
                                      logger.error('pipeline_release.delete.failed', { id: r.id, error: e });
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
            <DialogTitle>Editar pipeline</DialogTitle>
          </DialogHeader>
          {edit && (
            <PipelineEditForm
              key={edit.id}
              initial={edit}
              onSuccess={() => setEdit(null)}
              repoName={repoName(edit.repositorio_id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
