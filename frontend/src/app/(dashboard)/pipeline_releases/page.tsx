'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, GitBranch, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Alert,
  AlertDescription,
  AlertTitle,
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
import { useActivoWebs } from '@/hooks/useActivoWebs';
import {
  useCreatePipelineRelease,
  useDeletePipelineRelease,
  usePipelineReleases,
  useUpdatePipelineRelease,
} from '@/hooks/usePipelineReleases';
import { useRepositorios } from '@/hooks/useRepositorios';
import { useServiceReleases } from '@/hooks/useServiceReleases';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { logger } from '@/lib/logger';
import {
  PipelineMesOptions,
  PipelineReleaseFormCreateSchema,
  RESULTADOS_PIPELINE,
  TIPOS_PIPELINE,
  type PipelineRelease,
  type PipelineReleaseCreate,
  type PipelineReleaseUpdate,
} from '@/lib/schemas/pipeline_release.schema';
import { UrlFilterChips, type UrlFilterChipItem } from '@/components/filters/UrlFilterChips';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ALL = '' as const;

const pipelineEditSchema = z.object({
  repositorio_id: z.union([z.string().uuid(), z.literal('')]).optional(),
  activo_web_id: z.union([z.string().uuid(), z.literal('')]).optional(),
  rama: z.string().min(1).max(255),
  commit_sha: z.string().max(64).nullable().optional(),
  scan_id: z.string().max(255).nullable().optional(),
  mes: z
    .string()
    .optional()
    .refine((s) => s === undefined || s === '' || /^([1-9]|1[0-2])$/.test(s), { message: 'Mes entre 1 y 12' }),
  resultado: z.enum(RESULTADOS_PIPELINE),
  herramienta: z.string().max(200).nullable().optional(),
  liberado_con_vulns_criticas_o_altas: z.boolean().nullable().optional(),
});
type PipelineEditForm = z.infer<typeof pipelineEditSchema>;
type FormCreate = z.infer<typeof PipelineReleaseFormCreateSchema>;

function PipelineCreateForm({ onSuccess, repoOptions, releaseOptions, activoOptions }: { onSuccess: () => void; repoOptions: { value: string; label: string }[]; releaseOptions: { value: string; label: string }[]; activoOptions: { value: string; label: string }[] }) {
  const createMut = useCreatePipelineRelease();
  const form = useForm<FormCreate>({
    resolver: zodResolver(PipelineReleaseFormCreateSchema),
    defaultValues: {
      service_release_id: '',
      repositorio_id: repoOptions[0]?.value ?? '',
      rama: 'main',
      commit_sha: null,
      scan_id: null,
      mes: '',
      activo_web_id: '',
      tipo: 'SAST',
      resultado: 'Pendiente',
      herramienta: null,
      liberado_con_vulns_criticas_o_altas: null,
    },
  });
  const tipo = form.watch('tipo');
  const pending = createMut.isPending;
  useUnsavedChanges(form.formState.isDirty);

  const onSubmit = form.handleSubmit((data) => {
    const mesStr = data.mes?.trim() ?? '';
    const mes = mesStr ? parseInt(mesStr, 10) : null;
    const payload: PipelineReleaseCreate = {
      service_release_id: data.service_release_id && data.service_release_id.length > 0 ? data.service_release_id : null,
      repositorio_id: data.repositorio_id && data.repositorio_id.length > 0 ? data.repositorio_id : null,
      rama: data.rama.trim(),
      commit_sha: data.commit_sha?.trim() || null,
      scan_id: data.scan_id?.trim() || null,
      mes,
      activo_web_id: data.activo_web_id && data.activo_web_id.length > 0 ? data.activo_web_id : null,
      tipo: data.tipo,
      resultado: data.resultado,
      herramienta: data.herramienta?.trim() || null,
      liberado_con_vulns_criticas_o_altas: data.liberado_con_vulns_criticas_o_altas ?? null,
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

  const canCreate = repoOptions.length > 0 || activoOptions.length > 0;

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
        <label className="text-sm font-medium">Tipo *</label>
        <Select
          className="mt-1"
          value={form.watch('tipo')}
          onChange={(e) => {
            const t = e.target.value as (typeof TIPOS_PIPELINE)[number];
            form.setValue('tipo', t, { shouldValidate: true });
            if (t === 'DAST' && !form.getValues('repositorio_id')) {
              /* permitir DAST sin repo hasta que elijan activo */
            }
          }}
          options={TIPOS_PIPELINE.map((t) => ({ value: t, label: t }))}
        />
        <p className="text-xs text-muted-foreground mt-1">DAST: repositorio y/o activo web (al menos uno). SAST/SCA: repositorio obligatorio.</p>
      </div>
      <div>
        <label className="text-sm font-medium">Repositorio{tipo === 'DAST' ? ' (opcional si hay activo)' : ' *'}</label>
        <Select
          className="mt-1"
          value={form.watch('repositorio_id') || ''}
          onChange={(e) => form.setValue('repositorio_id', e.target.value, { shouldValidate: true })}
          options={[
            { value: '', label: '—' },
            ...repoOptions,
          ]}
        />
        {form.formState.errors.repositorio_id && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.repositorio_id.message}</p>
        )}
      </div>
      {tipo === 'DAST' && (
        <div>
          <label className="text-sm font-medium">Activo web (DAST)</label>
          <Select
            className="mt-1"
            value={form.watch('activo_web_id') || ''}
            onChange={(e) => form.setValue('activo_web_id', e.target.value, { shouldValidate: true })}
            options={[
              { value: '', label: '—' },
              ...activoOptions,
            ]}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Scan ID (DAST/CI)</label>
          <Input
            className="mt-1 font-mono text-xs"
            value={form.watch('scan_id') ?? ''}
            onChange={(e) => form.setValue('scan_id', e.target.value || null, { shouldValidate: true })}
            placeholder="id del job o escaneo"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Mes (1–12, cohorte DAST)</label>
          <Select
            className="mt-1"
            value={form.watch('mes') ?? ''}
            onChange={(e) => form.setValue('mes', e.target.value, { shouldValidate: true })}
            options={PipelineMesOptions}
          />
        </div>
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
      {tipo === 'DAST' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="libCrit"
            checked={Boolean(form.watch('liberado_con_vulns_criticas_o_altas'))}
            onChange={(e) => form.setValue('liberado_con_vulns_criticas_o_altas', e.target.checked, { shouldValidate: true })}
            className="h-4 w-4"
          />
          <label htmlFor="libCrit" className="text-sm">
            Marcado: liberado con vulnerabilidades críticas/altas (BRD)
          </label>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !canCreate}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear
        </Button>
      </div>
    </form>
  );
}

function PipelineEditForm({
  initial,
  onSuccess,
  repoName,
  activoName,
  repoOptions,
  activoOptions,
}: {
  initial: PipelineRelease;
  onSuccess: () => void;
  repoName: string;
  activoName: string;
  repoOptions: { value: string; label: string }[];
  activoOptions: { value: string; label: string }[];
}) {
  const updateMut = useUpdatePipelineRelease();
  const form = useForm<PipelineEditForm>({
    resolver: zodResolver(pipelineEditSchema),
    defaultValues: {
      repositorio_id: initial.repositorio_id ?? '',
      activo_web_id: initial.activo_web_id ?? '',
      rama: initial.rama,
      commit_sha: initial.commit_sha ?? null,
      scan_id: initial.scan_id ?? null,
      mes: initial.mes != null ? String(initial.mes) : '',
      resultado: initial.resultado as (typeof RESULTADOS_PIPELINE)[number],
      herramienta: initial.herramienta ?? null,
      liberado_con_vulns_criticas_o_altas: initial.liberado_con_vulns_criticas_o_altas ?? null,
    },
  });
  const pending = updateMut.isPending;
  const tipo = initial.tipo;
  useUnsavedChanges(form.formState.isDirty);

  const onSubmit = form.handleSubmit((data) => {
    const patch: PipelineReleaseUpdate = {};
    if (data.rama.trim() !== initial.rama) patch.rama = data.rama.trim();
    if ((data.commit_sha ?? null) !== (initial.commit_sha ?? null)) patch.commit_sha = data.commit_sha?.trim() || null;
    if (data.resultado !== initial.resultado) patch.resultado = data.resultado;
    if ((data.herramienta ?? null) !== (initial.herramienta ?? null)) patch.herramienta = data.herramienta?.trim() || null;
    const scan = data.scan_id?.trim() || null;
    if (scan !== (initial.scan_id ?? null)) patch.scan_id = scan;
    const mesStr = data.mes?.trim() ?? '';
    const mes = mesStr ? parseInt(mesStr, 10) : null;
    if (mes !== (initial.mes ?? null)) patch.mes = mes;
    const newRepo = data.repositorio_id && data.repositorio_id.length > 0 ? data.repositorio_id : null;
    const newAct = data.activo_web_id && data.activo_web_id.length > 0 ? data.activo_web_id : null;
    if (newRepo !== (initial.repositorio_id ?? null)) patch.repositorio_id = newRepo;
    if (newAct !== (initial.activo_web_id ?? null)) patch.activo_web_id = newAct;
    if ((data.liberado_con_vulns_criticas_o_altas ?? null) !== (initial.liberado_con_vulns_criticas_o_altas ?? null)) {
      patch.liberado_con_vulns_criticas_o_altas = data.liberado_con_vulns_criticas_o_altas ?? null;
    }
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
          <span className="text-muted-foreground">Tipo: </span>
          {tipo}
        </p>
        <p>
          <span className="text-muted-foreground">Repositorio: </span>
          {initial.repositorio_id ? repoName : '—'}
        </p>
        {tipo === 'DAST' && (
          <p>
            <span className="text-muted-foreground">Activo web: </span>
            {initial.activo_web_id ? activoName : '—'}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Ajusta rama, scan, activo u resultado según la política DAST/CI.</p>
      </div>
      {tipo === 'DAST' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium">Repositorio (opcional)</label>
            <Select
              className="mt-1"
              value={form.watch('repositorio_id') || ''}
              onChange={(e) => form.setValue('repositorio_id', e.target.value, { shouldValidate: true })}
              options={[{ value: '', label: '—' }, ...repoOptions]}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Activo web (opcional)</label>
            <Select
              className="mt-1"
              value={form.watch('activo_web_id') || ''}
              onChange={(e) => form.setValue('activo_web_id', e.target.value, { shouldValidate: true })}
              options={[{ value: '', label: '—' }, ...activoOptions]}
            />
          </div>
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Scan ID (CI / correlación)</label>
        <Input
          className="mt-1 font-mono text-xs"
          value={form.watch('scan_id') ?? ''}
          onChange={(e) => form.setValue('scan_id', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Mes (1–12, series)</label>
        <Select
          className="mt-1"
          value={form.watch('mes') ?? ''}
          onChange={(e) => form.setValue('mes', e.target.value, { shouldValidate: true })}
          options={PipelineMesOptions}
        />
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
      {tipo === 'DAST' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="libCritE"
            checked={Boolean(form.watch('liberado_con_vulns_criticas_o_altas'))}
            onChange={(e) => form.setValue('liberado_con_vulns_criticas_o_altas', e.target.checked, { shouldValidate: true })}
            className="h-4 w-4"
          />
          <label htmlFor="libCritE" className="text-sm">
            Liberado con vulns críticas/altas
          </label>
        </div>
      )}
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
  const { getParam, setParam, clearAll } = useUrlFilters();
  const q = getParam('q') ?? '';
  const repoF = getParam('repo') ?? ALL;
  const releaseF = getParam('rel') ?? ALL;
  const tipoF = getParam('tipo') ?? ALL;
  const resF = getParam('res') ?? ALL;
  const mesF = getParam('mes') ?? ALL;
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<PipelineRelease | null>(null);
  const deleteMut = useDeletePipelineRelease();

  const { data: repos } = useRepositorios();
  const { data: releases } = useServiceReleases();
  const { data: activos } = useActivoWebs();

  const listParams = useMemo(() => {
    const p: { repositorio_id?: string; service_release_id?: string; tipo?: string; mes?: number } = {};
    if (repoF !== ALL) p.repositorio_id = repoF;
    if (releaseF !== ALL) p.service_release_id = releaseF;
    if (tipoF !== ALL) p.tipo = tipoF;
    if (mesF !== ALL) p.mes = parseInt(mesF, 10);
    return Object.keys(p).length ? p : undefined;
  }, [repoF, releaseF, tipoF, mesF]);

  const { data: rows, isLoading, isError } = usePipelineReleases(listParams);

  const repoOptions = useMemo(
    () => (repos ?? []).map((r) => ({ value: r.id, label: r.nombre })),
    [repos],
  );
  const activoOptions = useMemo(
    () => (activos ?? []).map((a) => ({ value: a.id, label: a.nombre })),
    [activos],
  );
  const releaseOptions = useMemo(
    () => (releases ?? []).map((r) => ({ value: r.id, label: `${r.nombre} ${r.version}`.trim() })),
    [releases],
  );
  const activoById = useCallback(
    (id: string | null | undefined) => (id ? (activos ?? []).find((x) => x.id === id)?.nombre : undefined) ?? '—',
    [activos],
  );
  const repoName = useCallback(
    (id: string | null | undefined) => (id ? (repos ?? []).find((x) => x.id === id)?.nombre : undefined) ?? '—',
    [repos],
  );
  const releaseLabel = useCallback(
    (id: string | null | undefined) => {
    if (!id) return '—';
    const r = (releases ?? []).find((x) => x.id === id);
    return r ? `${r.nombre} ${r.version}` : id.slice(0, 8);
  },
    [releases],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (resF === ALL ? true : r.resultado === resF))
      .filter((r) => {
        if (!s) return true;
        return (
          r.rama.toLowerCase().includes(s) ||
          (r.commit_sha && r.commit_sha.toLowerCase().includes(s)) ||
          (r.herramienta && r.herramienta.toLowerCase().includes(s)) ||
          (r.scan_id && r.scan_id.toLowerCase().includes(s)) ||
          repoName(r.repositorio_id).toLowerCase().includes(s) ||
          activoById(r.activo_web_id).toLowerCase().includes(s)
        );
      });
  }, [rows, q, resF, repoName, activoById]);

  const urlChipItems = useMemo((): UrlFilterChipItem[] => {
    const chips: UrlFilterChipItem[] = [];
    if (q.trim()) {
      chips.push({
        key: 'q',
        label: `Buscar: ${q}`,
        onRemove: () => setParam('q', null),
      });
    }
    if (repoF !== ALL) {
      chips.push({
        key: 'repo',
        label: `Repo: ${repoName(repoF)}`,
        onRemove: () => setParam('repo', null),
      });
    }
    if (releaseF !== ALL) {
      chips.push({
        key: 'rel',
        label: `Liberación: ${releaseLabel(releaseF)}`,
        onRemove: () => setParam('rel', null),
      });
    }
    if (tipoF !== ALL) {
      chips.push({
        key: 'tipo',
        label: `Tipo: ${tipoF}`,
        onRemove: () => setParam('tipo', null),
      });
    }
    if (mesF !== ALL) {
      chips.push({
        key: 'mes',
        label: `Mes: ${mesF}`,
        onRemove: () => setParam('mes', null),
      });
    }
    if (resF !== ALL) {
      chips.push({
        key: 'res',
        label: `Resultado: ${resF}`,
        onRemove: () => setParam('res', null),
      });
    }
    return chips;
  }, [q, repoF, releaseF, tipoF, mesF, resF, repoName, releaseLabel, setParam]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Pipelines (SAST / DAST / SCA)"
        description="Ejecuciones vinculadas a repositorio (SAST/SCA) o a repositorio y/o activo web (DAST). Filtros de lista en servidor: repo, liberación, tipo, mes (BRD 10.2)."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!repoOptions.length && !activoOptions.length}>
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
              activoOptions={activoOptions}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Alert>
        <AlertTitle>Correlación con hallazgos de pipeline</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed">
          El import CSV de hallazgos usa una coincidencia estricta por <code className="rounded bg-muted px-1">scan_id</code> y{' '}
          <code className="rounded bg-muted px-1">branch</code> (rama) con el registro de pipeline correspondiente. Completa esos
          campos en cada ejecución antes de importar. Ver{' '}
          <Link href="/hallazgo_pipelines" className="font-medium text-primary underline underline-offset-2">
            Hallazgos pipeline
          </Link>{' '}
          y el botón de enlace en cada fila.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <GitBranch className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} registro(s)
            {listParams && ' (filtrados en servidor)'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 max-w-6xl">
            <div>
              <label className="text-sm font-medium">Repositorio</label>
              <Select
                className="mt-1"
                value={repoF}
                onChange={(e) => setParam('repo', e.target.value === ALL ? null : e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...repoOptions,
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Liberación</label>
              <Select
                className="mt-1"
                value={releaseF}
                onChange={(e) => setParam('rel', e.target.value === ALL ? null : e.target.value)}
                options={[
                  { value: ALL, label: 'Todas' },
                  ...releaseOptions,
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select
                className="mt-1"
                value={tipoF}
                onChange={(e) => setParam('tipo', e.target.value === ALL ? null : e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...TIPOS_PIPELINE.map((t) => ({ value: t, label: t })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mes</label>
              <Select
                className="mt-1"
                value={mesF}
                onChange={(e) => setParam('mes', e.target.value === ALL ? null : e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Resultado</label>
              <Select
                className="mt-1"
                value={resF}
                onChange={(e) => setParam('res', e.target.value === ALL ? null : e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...RESULTADOS_PIPELINE.map((r) => ({ value: r, label: r })),
                ]}
              />
            </div>
            <div className="max-w-md">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                className="mt-1"
                placeholder="Rama, commit, scan, repo, activo…"
                value={q}
                onChange={(e) => setParam('q', e.target.value.trim() ? e.target.value : null)}
              />
            </div>
          </div>

          <UrlFilterChips items={urlChipItems} onClearAll={clearAll} className="border-t border-border pt-4" />

          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-destructive">No se pudo cargar el listado.</p>}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay pipelines. Defina repositorios o activos web.</p>
          )}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Origen / tipo</DataTableTh>
                  <DataTableTh>Rama</DataTableTh>
                  <DataTableTh>Scan / mes</DataTableTh>
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
                      <div className="font-medium text-sm">{r.repositorio_id ? repoName(r.repositorio_id) : '—'}</div>
                      {r.tipo === 'DAST' && r.activo_web_id && (
                        <div className="text-xs text-muted-foreground">Activo: {activoById(r.activo_web_id)}</div>
                      )}
                      <Badge variant="primary" className="mt-0.5">
                        {r.tipo}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell className="font-mono text-xs">{r.rama}</DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground">
                      {r.scan_id ?? '—'}
                      {r.mes != null ? ` · m${r.mes}` : ''}
                    </DataTableCell>
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
                        <Link
                          href={`/hallazgo_pipelines?pipe=${r.id}`}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                          title="Hallazgos correlacionados"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
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
              activoName={activoById(edit.activo_web_id)}
              repoOptions={repoOptions}
              activoOptions={activoOptions}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
