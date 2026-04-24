'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bug, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
  ESTADOS_HALLAZGO_SAST_DAST,
  SEVERIDADES_HALLAZGO,
  vulnerabilidadOptions,
} from '@/lib/hallazgo-constants';
import {
  useCreateHallazgoDast,
  useDeleteHallazgoDast,
  useHallazgoDasts,
  useUpdateHallazgoDast,
} from '@/hooks/useHallazgoDasts';
import { useEjecucionDasts } from '@/hooks/useEjecucionDasts';
import { useProgramaDasts } from '@/hooks/useProgramaDasts';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { logger } from '@/lib/logger';
import {
  HallazgoDastCreateSchema,
  HallazgoDastFormCreateSchema,
  HallazgoDastUpdateSchema,
  type HallazgoDast,
  type HallazgoDastUpdate,
} from '@/lib/schemas/hallazgo_dast.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ALL = '' as const;
const sevE = z.enum(SEVERIDADES_HALLAZGO);
const estSd = z.enum(ESTADOS_HALLAZGO_SAST_DAST);
type FormCreateInput = z.infer<typeof HallazgoDastFormCreateSchema>;
const formEdit = z.object({
  vulnerabilidad_id: z.string().optional(),
  titulo: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  severidad: sevE,
  url: z.string().max(500).optional(),
  parametro: z.string().max(255).nullable().optional(),
  estado: estSd,
});
type FormEdit = z.infer<typeof formEdit>;

export default function HallazgoDastsPage() {
  const { data: rows, isLoading, isError } = useHallazgoDasts();
  const { data: ejecuciones } = useEjecucionDasts();
  const { data: programas } = useProgramaDasts();
  const { data: vulns } = useVulnerabilidads();
  const [q, setQ] = useState('');
  const [ejF, setEjF] = useState<string>(ALL);
  const [sevF, setSevF] = useState<string>(ALL);
  const [estF, setEstF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<HallazgoDast | null>(null);
  const createMut = useCreateHallazgoDast();
  const updateMut = useUpdateHallazgoDast();
  const deleteMut = useDeleteHallazgoDast();

  const vOpts = useMemo(() => vulnerabilidadOptions(vulns), [vulns]);

  const ejLabel = useCallback(
    (id: string) => {
      const e = (ejecuciones ?? []).find((x) => x.id === id);
      if (!e) return id.slice(0, 8);
      const p = (programas ?? []).find((pr) => pr.id === e.programa_dast_id);
      const nm = p?.nombre ?? '—';
      return `${nm} · ${e.ambiente} · ${formatDate(e.fecha_inicio)}`;
    },
    [ejecuciones, programas],
  );

  const ejecucionOptions = useMemo(
    () =>
      (ejecuciones ?? []).map((e) => {
        const p = (programas ?? []).find((pr) => pr.id === e.programa_dast_id);
        const nm = p?.nombre ?? '—';
        return { value: e.id, label: `${nm} · ${e.ambiente} · ${formatDate(e.fecha_inicio)}` };
      }),
    [ejecuciones, programas],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (ejF === ALL ? true : r.ejecucion_dast_id === ejF))
      .filter((r) => (sevF === ALL ? true : r.severidad === sevF))
      .filter((r) => (estF === ALL ? true : r.estado === estF))
      .filter((r) => {
        if (!s) return true;
        return (
          r.titulo.toLowerCase().includes(s) ||
          (r.descripcion && r.descripcion.toLowerCase().includes(s)) ||
          (r.url && r.url.toLowerCase().includes(s)) ||
          ejLabel(r.ejecucion_dast_id).toLowerCase().includes(s)
        );
      });
  }, [rows, q, ejF, sevF, estF, ejLabel]);

  const formC = useForm<FormCreateInput>({
    resolver: zodResolver(HallazgoDastFormCreateSchema),
    defaultValues: {
      ejecucion_dast_id: ejecucionOptions[0]?.value ?? '',
      vulnerabilidad_id: '',
      titulo: '',
      descripcion: null,
      severidad: 'Media',
      url: '',
      parametro: null,
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
      url: '',
      parametro: null,
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
      url: edit.url ?? '',
      parametro: edit.parametro ?? null,
      estado: edit.estado as (typeof ESTADOS_HALLAZGO_SAST_DAST)[number],
    });
  }, [edit, formE]);

  const onCreate = formC.handleSubmit((d) => {
    const out = HallazgoDastCreateSchema.parse({
      ...d,
      descripcion: d.descripcion?.trim() || null,
      parametro: d.parametro?.trim() || null,
      url: d.url?.trim() || null,
    });
    createMut.mutate(out, {
      onSuccess: () => {
        toast.success('Hallazgo creado');
        setCreateOpen(false);
        formC.reset();
      },
      onError: (e) => {
        logger.error('hallazgo_dast.create.failed', { error: e });
        toast.error(extractErrorMessage(e, 'Error al crear'));
      },
    });
  });

  const onEdit = formE.handleSubmit((d) => {
    if (!edit) return;
    const urlTrim = d.url?.trim() || null;
    const parsed = HallazgoDastUpdateSchema.safeParse({
      ...d,
      descripcion: d.descripcion?.trim() || null,
      parametro: d.parametro?.trim() || null,
      url: urlTrim,
      vulnerabilidad_id: d.vulnerabilidad_id && d.vulnerabilidad_id.length > 0 ? d.vulnerabilidad_id : null,
    });
    if (!parsed.success) {
      toast.error('Revisa el formulario');
      return;
    }
    const patch: HallazgoDastUpdate = {};
    const p0 = parsed.data;
    if ((p0.vulnerabilidad_id ?? null) !== (edit.vulnerabilidad_id ?? null)) patch.vulnerabilidad_id = p0.vulnerabilidad_id;
    if (p0.titulo !== edit.titulo) patch.titulo = p0.titulo;
    if ((p0.descripcion ?? null) !== (edit.descripcion ?? null)) patch.descripcion = p0.descripcion;
    if (p0.severidad !== edit.severidad) patch.severidad = p0.severidad;
    if ((p0.url ?? null) !== (edit.url ?? null)) patch.url = p0.url;
    if ((p0.parametro ?? null) !== (edit.parametro ?? null)) patch.parametro = p0.parametro;
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
          logger.error('hallazgo_dast.update.failed', { id: String(edit.id), error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  });

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Hallazgos DAST" description="Vinculados a una ejecución DAST del programa.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!ejecucionOptions.length}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo hallazgo (DAST)</DialogTitle>
            </DialogHeader>
            <form className="space-y-3" onSubmit={onCreate}>
              <div>
                <label className="text-sm font-medium">Ejecución DAST *</label>
                <Select
                  className="mt-1"
                  value={formC.watch('ejecucion_dast_id')}
                  onChange={(e) => formC.setValue('ejecucion_dast_id', e.target.value, { shouldValidate: true })}
                  options={ejecucionOptions}
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
                <Input className="mt-1" maxLength={255} {...formC.register('titulo')} />
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
                      formC.setValue('severidad', e.target.value as (typeof SEVERIDADES_HALLAZGO)[number], {
                        shouldValidate: true,
                      })
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
                      formC.setValue('estado', e.target.value as (typeof ESTADOS_HALLAZGO_SAST_DAST)[number], {
                        shouldValidate: true,
                      })
                    }
                    options={ESTADOS_HALLAZGO_SAST_DAST.map((x) => ({ value: x, label: x }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  className="mt-1"
                  value={formC.watch('url') ?? ''}
                  onChange={(e) => formC.setValue('url', e.target.value, { shouldValidate: true })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Parámetro</label>
                <Input
                  className="mt-1"
                  value={formC.watch('parametro') ?? ''}
                  onChange={(e) => formC.setValue('parametro', e.target.value || null, { shouldValidate: true })}
                />
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
              value={ejF}
              onChange={(e) => setEjF(e.target.value)}
              options={[{ value: ALL, label: 'Todas las ejecuciones' }, ...ejecucionOptions]}
            />
            <Select
              value={sevF}
              onChange={(e) => setSevF(e.target.value)}
              options={[{ value: ALL, label: 'Severidad' }, ...SEVERIDADES_HALLAZGO.map((x) => ({ value: x, label: x }))]}
            />
            <Select
              value={estF}
              onChange={(e) => setEstF(e.target.value)}
              options={[
                { value: ALL, label: 'Estado' },
                ...ESTADOS_HALLAZGO_SAST_DAST.map((x) => ({ value: x, label: x })),
              ]}
            />
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Ejecución / título</DataTableTh>
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
                      <div className="text-xs text-muted-foreground mb-0.5">{ejLabel(r.ejecucion_dast_id)}</div>
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
                                      logger.error('hallazgo_dast.delete.failed', { id: r.id, error: e });
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
            <DialogTitle>Editar hallazgo (DAST)</DialogTitle>
          </DialogHeader>
          {edit && (
            <form className="space-y-3" onSubmit={onEdit}>
              <p className="text-xs text-muted-foreground">Ejecución: {ejLabel(edit.ejecucion_dast_id)}</p>
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
                <Input className="mt-1" maxLength={255} {...formE.register('titulo')} />
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
                      formE.setValue('severidad', e.target.value as (typeof SEVERIDADES_HALLAZGO)[number], {
                        shouldValidate: true,
                      })
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
                      formE.setValue('estado', e.target.value as (typeof ESTADOS_HALLAZGO_SAST_DAST)[number], {
                        shouldValidate: true,
                      })
                    }
                    options={ESTADOS_HALLAZGO_SAST_DAST.map((x) => ({ value: x, label: x }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  className="mt-1"
                  value={formE.watch('url') ?? ''}
                  onChange={(e) => formE.setValue('url', e.target.value, { shouldValidate: true })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Parámetro</label>
                <Input
                  className="mt-1"
                  value={formE.watch('parametro') ?? ''}
                  onChange={(e) => formE.setValue('parametro', e.target.value || null, { shouldValidate: true })}
                />
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
