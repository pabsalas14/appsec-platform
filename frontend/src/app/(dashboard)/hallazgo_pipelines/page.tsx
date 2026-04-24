'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bug, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { ESTADOS_HALLAZGO_PIPELINE, SEVERIDADES_HALLAZGO, vulnerabilidadOptions } from '@/lib/hallazgo-constants';
import {
  useCreateHallazgoPipeline,
  useDeleteHallazgoPipeline,
  useHallazgoPipelines,
  useUpdateHallazgoPipeline,
} from '@/hooks/useHallazgoPipelines';
import { usePipelineReleases } from '@/hooks/usePipelineReleases';
import { useRepositorios } from '@/hooks/useRepositorios';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { logger } from '@/lib/logger';
import {
  HallazgoPipelineCreateSchema,
  HallazgoPipelineFormCreateSchema,
  HallazgoPipelineUpdateSchema,
  type HallazgoPipeline,
  type HallazgoPipelineUpdate,
} from '@/lib/schemas/hallazgo_pipeline.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';
import { z } from 'zod';

const ALL = '' as const;
const sevE = z.enum(SEVERIDADES_HALLAZGO);
const estE = z.enum(ESTADOS_HALLAZGO_PIPELINE);
type FormCreateInput = z.infer<typeof HallazgoPipelineFormCreateSchema>;
const formEdit = z.object({
  vulnerabilidad_id: z.string().optional(),
  titulo: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sevE,
  archivo: z.string().max(500).nullable().optional(),
  linea: z.string().optional(),
  regla: z.string().max(500).nullable().optional(),
  estado: estE,
});
type FormEdit = z.infer<typeof formEdit>;

export default function HallazgoPipelinesPage() {
  const { data: rows, isLoading, isError } = useHallazgoPipelines();
  const { data: pipes } = usePipelineReleases();
  const { data: repos } = useRepositorios();
  const { data: vulns } = useVulnerabilidads();
  const [q, setQ] = useState('');
  const [pipeF, setPipeF] = useState<string>(ALL);
  const [sevF, setSevF] = useState<string>(ALL);
  const [estF, setEstF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<HallazgoPipeline | null>(null);
  const createMut = useCreateHallazgoPipeline();
  const updateMut = useUpdateHallazgoPipeline();
  const deleteMut = useDeleteHallazgoPipeline();

  const vOpts = useMemo(() => vulnerabilidadOptions(vulns), [vulns]);
  const pipeOptions = useMemo(
    () =>
      (pipes ?? []).map((p) => {
        const rn = (repos ?? []).find((r) => r.id === p.repositorio_id)?.nombre ?? '—';
        return { value: p.id, label: `${rn} · ${p.tipo} · ${p.rama}` };
      }),
    [pipes, repos],
  );
  const plLabel = useCallback(
    (id: string) => {
      const p = (pipes ?? []).find((x) => x.id === id);
      if (!p) return id.slice(0, 8);
      const rn = (repos ?? []).find((r) => r.id === p.repositorio_id)?.nombre ?? '—';
      return `${rn} · ${p.tipo} · ${p.rama}`;
    },
    [pipes, repos],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (pipeF === ALL ? true : r.pipeline_release_id === pipeF))
      .filter((r) => (sevF === ALL ? true : r.severidad === sevF))
      .filter((r) => (estF === ALL ? true : r.estado === estF))
      .filter((r) => {
        if (!s) return true;
        return (
          r.titulo.toLowerCase().includes(s) ||
          (r.descripcion && r.descripcion.toLowerCase().includes(s)) ||
          plLabel(r.pipeline_release_id).toLowerCase().includes(s)
        );
      });
  }, [rows, q, pipeF, sevF, estF, plLabel]);

  const formC = useForm<FormCreateInput>({
    resolver: zodResolver(HallazgoPipelineFormCreateSchema),
    defaultValues: {
      pipeline_release_id: pipeOptions[0]?.value ?? '',
      vulnerabilidad_id: '',
      titulo: '',
      descripcion: null,
      severidad: 'Media',
      archivo: null,
      linea: '',
      regla: null,
      estado: 'Abierto',
    },
  });
  const formE = useForm<FormEdit>({
    resolver: zodResolver(formEdit),
    defaultValues: {
      vulnerabilidad_id: '',
      titulo: '',
      descripcion: null,
      severidad: 'Media',
      archivo: null,
      linea: '',
      regla: null,
      estado: 'Abierto',
    },
  });
  useEffect(() => {
    if (!edit) return;
    formE.reset({
      vulnerabilidad_id: edit.vulnerabilidad_id ?? '',
      titulo: edit.titulo,
      descripcion: edit.descripcion ?? null,
      severidad: edit.severidad as (typeof SEVERIDADES_HALLAZGO)[number],
      archivo: edit.archivo ?? null,
      linea: edit.linea != null ? String(edit.linea) : '',
      regla: edit.regla ?? null,
      estado: edit.estado as (typeof ESTADOS_HALLAZGO_PIPELINE)[number],
    });
  }, [edit, formE]);

  const onCreate = formC.handleSubmit((d) => {
    const lineaStr = d.linea?.trim() ?? '';
    let linea: number | null = null;
    if (lineaStr !== '') {
      const n = parseInt(lineaStr, 10);
      if (Number.isNaN(n) || n < 1) {
        toast.error('Línea debe ser un entero ≥ 1');
        return;
      }
      linea = n;
    }
    const out = HallazgoPipelineCreateSchema.parse({
      ...d,
      descripcion: d.descripcion?.trim() || null,
      archivo: d.archivo?.trim() || null,
      regla: d.regla?.trim() || null,
      vulnerabilidad_id: d.vulnerabilidad_id && d.vulnerabilidad_id.length > 0 ? d.vulnerabilidad_id : null,
      linea,
    });
    createMut.mutate(out, {
      onSuccess: () => {
          toast.success('Hallazgo creado');
          setCreateOpen(false);
          formC.reset();
        },
        onError: (e) => {
          logger.error('hallazgo_pipeline.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      },
    );
  });

  const onEdit = formE.handleSubmit((d) => {
    if (!edit) return;
    const lineaStr = d.linea?.trim() ?? '';
    let linea: number | null = null;
    if (lineaStr !== '') {
      const n = parseInt(lineaStr, 10);
      if (Number.isNaN(n) || n < 1) {
        toast.error('Línea debe ser un entero ≥ 1');
        return;
      }
      linea = n;
    }
    const parsed = HallazgoPipelineUpdateSchema.safeParse({
      ...d,
      descripcion: d.descripcion?.trim() || null,
      archivo: d.archivo?.trim() || null,
      regla: d.regla?.trim() || null,
      linea,
      vulnerabilidad_id: d.vulnerabilidad_id && d.vulnerabilidad_id.length > 0 ? d.vulnerabilidad_id : null,
    });
    if (!parsed.success) {
      toast.error('Revisa el formulario');
      return;
    }
    const patch: HallazgoPipelineUpdate = {};
    const p0 = parsed.data;
    if ((p0.vulnerabilidad_id ?? null) !== (edit.vulnerabilidad_id ?? null)) patch.vulnerabilidad_id = p0.vulnerabilidad_id;
    if (p0.titulo !== edit.titulo) patch.titulo = p0.titulo;
    if ((p0.descripcion ?? null) !== (edit.descripcion ?? null)) patch.descripcion = p0.descripcion;
    if (p0.severidad !== edit.severidad) patch.severidad = p0.severidad;
    if ((p0.archivo ?? null) !== (edit.archivo ?? null)) patch.archivo = p0.archivo;
    if ((p0.linea ?? null) !== (edit.linea ?? null)) patch.linea = p0.linea;
    if ((p0.regla ?? null) !== (edit.regla ?? null)) patch.regla = p0.regla;
    if (p0.estado !== edit.estado) patch.estado = p0.estado;
    if (Object.keys(patch).length === 0) {
      setEdit(null);
      return;
    }
    updateMut.mutate(
      { id: edit.id, ...patch },
      {
        onSuccess: () => {
          toast.success('Guardado');
          setEdit(null);
        },
        onError: (e) => {
          logger.error('hallazgo_pipeline.update.failed', { id: String(edit.id), error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  });

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Hallazgos (pipeline SAST / DAST / SCA)"
        description="Vinculados a una ejecución de pipeline. Estado distinto a hallazgos de código/terceros."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!pipeOptions.length}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo hallazgo (pipeline)</DialogTitle>
            </DialogHeader>
            <form className="space-y-3" onSubmit={onCreate}>
              <div>
                <label className="text-sm font-medium">Pipeline *</label>
                <Select
                  className="mt-1"
                  value={formC.watch('pipeline_release_id')}
                  onChange={(e) => formC.setValue('pipeline_release_id', e.target.value, { shouldValidate: true })}
                  options={pipeOptions}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Vulnerabilidad (opcional)</label>
                <Select
                  className="mt-1"
                  value={formC.watch('vulnerabilidad_id') || ''}
                  onChange={(e) => formC.setValue('vulnerabilidad_id', e.target.value, { shouldValidate: true })}
                  options={vOpts}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input className="mt-1" maxLength={500} {...formC.register('titulo')} />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={formC.watch('descripcion') ?? ''}
                  onChange={(e) => formC.setValue('descripcion', e.target.value || null, { shouldValidate: true })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Severidad *</label>
                  <Select
                    className="mt-1"
                    value={formC.watch('severidad')}
                    onChange={(e) =>
                      formC.setValue('severidad', e.target.value as (typeof SEVERIDADES_HALLAZGO)[number], { shouldValidate: true })
                    }
                    options={SEVERIDADES_HALLAZGO.map((x) => ({ value: x, label: x }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Estado *</label>
                  <Select
                    className="mt-1"
                    value={formC.watch('estado')}
                    onChange={(e) =>
                      formC.setValue('estado', e.target.value as (typeof ESTADOS_HALLAZGO_PIPELINE)[number], { shouldValidate: true })
                    }
                    options={ESTADOS_HALLAZGO_PIPELINE.map((x) => ({ value: x, label: x }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Archivo</label>
                <Input
                  className="mt-1"
                  value={formC.watch('archivo') ?? ''}
                  onChange={(e) => formC.setValue('archivo', e.target.value || null, { shouldValidate: true })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Línea</label>
                  <Input
                    className="mt-1"
                    value={formC.watch('linea') ?? ''}
                    onChange={(e) => formC.setValue('linea', e.target.value, { shouldValidate: true })}
                    placeholder="número"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Regla</label>
                  <Input
                    className="mt-1"
                    value={formC.watch('regla') ?? ''}
                    onChange={(e) => formC.setValue('regla', e.target.value || null, { shouldValidate: true })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <Bug className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} registro(s)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-w-4xl">
            <Select
              value={pipeF}
              onChange={(e) => setPipeF(e.target.value)}
              options={[{ value: ALL, label: 'Todos los pipelines' }, ...pipeOptions]}
            />
            <Select
              value={sevF}
              onChange={(e) => setSevF(e.target.value)}
              options={[{ value: ALL, label: 'Severidad' }, ...SEVERIDADES_HALLAZGO.map((x) => ({ value: x, label: x }))]}
            />
            <Select
              value={estF}
              onChange={(e) => setEstF(e.target.value)}
              options={[{ value: ALL, label: 'Estado' }, ...ESTADOS_HALLAZGO_PIPELINE.map((x) => ({ value: x, label: x }))]}
            />
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Pipeline / título</DataTableTh>
                  <DataTableTh>Severidad</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => (
                  <DataTableRow key={r.id}>
                    <DataTableCell>
                      <div className="text-xs text-muted-foreground mb-0.5">{plLabel(r.pipeline_release_id)}</div>
                      <div className="font-medium line-clamp-2">{r.titulo}</div>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="primary">{r.severidad}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="default">{r.estado}</Badge>
                    </DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(r.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Button type="button" size="xs" variant="ghost" onClick={() => setEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" size="xs" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar hallazgo?</AlertDialogTitle>
                              <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(r.id, {
                                    onSuccess: () => toast.success('Eliminado'),
                                    onError: (e) => {
                                      logger.error('hallazgo_pipeline.delete.failed', { id: r.id, error: e });
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

      <Dialog open={!!edit} onOpenChange={() => setEdit(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar hallazgo (pipeline)</DialogTitle>
          </DialogHeader>
          {edit && (
            <form className="space-y-3" onSubmit={onEdit}>
              <p className="text-xs text-muted-foreground">Pipeline: {plLabel(edit.pipeline_release_id)}</p>
              <div>
                <label className="text-sm font-medium">Vulnerabilidad</label>
                <Select
                  className="mt-1"
                  value={formE.watch('vulnerabilidad_id') || ''}
                  onChange={(e) => formE.setValue('vulnerabilidad_id', e.target.value, { shouldValidate: true })}
                  options={vOpts}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input className="mt-1" maxLength={500} {...formE.register('titulo')} />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={formE.watch('descripcion') ?? ''}
                  onChange={(e) => formE.setValue('descripcion', e.target.value || null, { shouldValidate: true })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Severidad *</label>
                  <Select
                    className="mt-1"
                    value={formE.watch('severidad')}
                    onChange={(e) =>
                      formE.setValue('severidad', e.target.value as (typeof SEVERIDADES_HALLAZGO)[number], { shouldValidate: true })
                    }
                    options={SEVERIDADES_HALLAZGO.map((x) => ({ value: x, label: x }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Estado *</label>
                  <Select
                    className="mt-1"
                    value={formE.watch('estado')}
                    onChange={(e) =>
                      formE.setValue('estado', e.target.value as (typeof ESTADOS_HALLAZGO_PIPELINE)[number], { shouldValidate: true })
                    }
                    options={ESTADOS_HALLAZGO_PIPELINE.map((x) => ({ value: x, label: x }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Archivo</label>
                <Input
                  className="mt-1"
                  value={formE.watch('archivo') ?? ''}
                  onChange={(e) => formE.setValue('archivo', e.target.value || null, { shouldValidate: true })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Línea</label>
                  <Input
                    className="mt-1"
                    value={formE.watch('linea') ?? ''}
                    onChange={(e) => formE.setValue('linea', e.target.value, { shouldValidate: true })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Regla</label>
                  <Input
                    className="mt-1"
                    value={formE.watch('regla') ?? ''}
                    onChange={(e) => formE.setValue('regla', e.target.value || null, { shouldValidate: true })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cerrar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={updateMut.isPending}>
                  {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
