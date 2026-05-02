'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bug, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
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
import { ESTADOS_HALLAZGO_PIPELINE, SEVERIDADES_HALLAZGO, vulnerabilidadOptions } from '@/lib/hallazgo-constants';
import {
  useCreateHallazgoTercero,
  useDeleteHallazgoTercero,
  useHallazgoTerceros,
  useUpdateHallazgoTercero,
} from '@/hooks/useHallazgoTerceros';
import { useRevisionTerceros } from '@/hooks/useRevisionTerceros';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { logger } from '@/lib/logger';
import {
  HallazgoTerceroCreateSchema,
  HallazgoTerceroFormCreateSchema,
  HallazgoTerceroUpdateSchema,
  type HallazgoTercero,
  type HallazgoTerceroUpdate,
} from '@/lib/schemas/hallazgo_tercero.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ALL = '' as const;
const sevE = z.enum(SEVERIDADES_HALLAZGO);
const estP = z.enum(ESTADOS_HALLAZGO_PIPELINE);
type FormCreateInput = z.infer<typeof HallazgoTerceroFormCreateSchema>;
const formEdit = z.object({
  vulnerabilidad_id: z.string().optional(),
  titulo: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sevE,
  cvss_score: z.string().optional(),
  cwe_id: z.string().max(32).nullable().optional(),
  estado: estP,
});
type FormEdit = z.infer<typeof formEdit>;

function parseCvss(s: string | undefined): { ok: true; n: number | null } | { ok: false } {
  const t = s?.trim() ?? '';
  if (t === '') return { ok: true, n: null };
  const n = parseFloat(t);
  if (Number.isNaN(n) || n < 0 || n > 10) return { ok: false };
  return { ok: true, n };
}

function cvssEq(a: number | null | undefined, b: number | null | undefined) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 1e-9;
}

export default function HallazgoTercerosPage() {
  const { data: rows, isLoading, isError } = useHallazgoTerceros();
  const { data: revisiones } = useRevisionTerceros();
  const { data: vulns } = useVulnerabilidads();
  const [q, setQ] = useState('');
  const [revF, setRevF] = useState<string>(ALL);
  const [sevF, setSevF] = useState<string>(ALL);
  const [estF, setEstF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<HallazgoTercero | null>(null);
  const createMut = useCreateHallazgoTercero();
  const updateMut = useUpdateHallazgoTercero();
  const deleteMut = useDeleteHallazgoTercero();

  const vOpts = useMemo(() => vulnerabilidadOptions(vulns), [vulns]);

  const revLabel = useCallback(
    (id: string) => {
      const r = (revisiones ?? []).find((x) => x.id === id);
      if (!r) return id.slice(0, 8);
      return `${r.nombre_empresa} · ${r.tipo} · ${r.estado}`;
    },
    [revisiones],
  );

  const revisionOptions = useMemo(
    () =>
      (revisiones ?? []).map((r) => ({
        value: r.id,
        label: `${r.nombre_empresa} · ${r.tipo} · ${r.estado}`,
      })),
    [revisiones],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (revF === ALL ? true : r.revision_tercero_id === revF))
      .filter((r) => (sevF === ALL ? true : r.severidad === sevF))
      .filter((r) => (estF === ALL ? true : r.estado === estF))
      .filter((r) => {
        if (!s) return true;
        return (
          r.titulo.toLowerCase().includes(s) ||
          (r.descripcion && r.descripcion.toLowerCase().includes(s)) ||
          (r.cwe_id && r.cwe_id.toLowerCase().includes(s)) ||
          revLabel(r.revision_tercero_id).toLowerCase().includes(s)
        );
      });
  }, [rows, q, revF, sevF, estF, revLabel]);

  const formC = useForm<FormCreateInput>({
    resolver: zodResolver(HallazgoTerceroFormCreateSchema),
    defaultValues: {
      revision_tercero_id: revisionOptions[0]?.value ?? '',
      vulnerabilidad_id: '',
      titulo: '',
      descripcion: null,
      severidad: 'Media',
      cvss_score: '',
      cwe_id: null,
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
      cvss_score: '',
      cwe_id: null,
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
      cvss_score: edit.cvss_score != null ? String(edit.cvss_score) : '',
      cwe_id: edit.cwe_id ?? null,
      estado: edit.estado as (typeof ESTADOS_HALLAZGO_PIPELINE)[number],
    });
  }, [edit, formE]);

  const onCreate = formC.handleSubmit((d) => {
    const cv = parseCvss(d.cvss_score);
    if (!cv.ok) {
      toast.error('CVSS debe ser un número entre 0 y 10, o vacío');
      return;
    }
    const out = HallazgoTerceroCreateSchema.parse({
      ...d,
      descripcion: d.descripcion?.trim() || null,
      cwe_id: d.cwe_id?.trim() || null,
      cvss_score: cv.n,
    });
    createMut.mutate(out, {
      onSuccess: () => {
        toast.success('Hallazgo creado');
        setCreateOpen(false);
        formC.reset();
      },
      onError: (e) => {
        logger.error('hallazgo_tercero.create.failed', { error: e });
        toast.error(extractErrorMessage(e, 'Error al crear'));
      },
    });
  });

  const onEdit = formE.handleSubmit((d) => {
    if (!edit) return;
    const cv = parseCvss(d.cvss_score);
    if (!cv.ok) {
      toast.error('CVSS debe ser un número entre 0 y 10, o vacío');
      return;
    }
    const parsed = HallazgoTerceroUpdateSchema.safeParse({
      ...d,
      descripcion: d.descripcion?.trim() || null,
      cwe_id: d.cwe_id?.trim() || null,
      cvss_score: cv.n,
      vulnerabilidad_id: d.vulnerabilidad_id && d.vulnerabilidad_id.length > 0 ? d.vulnerabilidad_id : null,
    });
    if (!parsed.success) {
      toast.error('Revisa el formulario');
      return;
    }
    const patch: HallazgoTerceroUpdate = {};
    const p0 = parsed.data;
    if ((p0.vulnerabilidad_id ?? null) !== (edit.vulnerabilidad_id ?? null)) patch.vulnerabilidad_id = p0.vulnerabilidad_id;
    if (p0.titulo !== edit.titulo) patch.titulo = p0.titulo;
    if ((p0.descripcion ?? null) !== (edit.descripcion ?? null)) patch.descripcion = p0.descripcion;
    if (p0.severidad !== edit.severidad) patch.severidad = p0.severidad;
    if (!cvssEq(p0.cvss_score ?? null, edit.cvss_score ?? null)) patch.cvss_score = p0.cvss_score;
    if ((p0.cwe_id ?? null) !== (edit.cwe_id ?? null)) patch.cwe_id = p0.cwe_id;
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
          logger.error('hallazgo_tercero.update.failed', { id: String(edit.id), error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  });

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Hallazgos tercero"
        description="Vinculados a una revisión de tercero (informe externo)."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!revisionOptions.length}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo hallazgo (tercero)</DialogTitle>
            </DialogHeader>
            <form className="space-y-3" onSubmit={onCreate}>
              <div>
                <label className="text-sm font-medium">Revisión *</label>
                <Select
                  className="mt-1"
                  value={formC.watch('revision_tercero_id')}
                  onChange={(e) => formC.setValue('revision_tercero_id', e.target.value, { shouldValidate: true })}
                  options={revisionOptions}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">CVSS (0–10)</label>
                  <Input
                    className="mt-1"
                    value={formC.watch('cvss_score') ?? ''}
                    onChange={(e) => formC.setValue('cvss_score', e.target.value, { shouldValidate: true })}
                    placeholder="opcional"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CWE</label>
                  <Input
                    className="mt-1"
                    value={formC.watch('cwe_id') ?? ''}
                    onChange={(e) => formC.setValue('cwe_id', e.target.value || null, { shouldValidate: true })}
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
              value={revF}
              onChange={(e) => setRevF(e.target.value)}
              options={[{ value: ALL, label: 'Todas las revisiones' }, ...revisionOptions]}
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
                  <DataTableTh>Revisión / título</DataTableTh>
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
                      <div className="mb-0.5 text-xs">
                        <Link
                          href={`/revision_terceros/${r.revision_tercero_id}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {revLabel(r.revision_tercero_id)}
                        </Link>
                      </div>
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
                                      logger.error('hallazgo_tercero.delete.failed', { id: r.id, error: e });
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
            <DialogTitle>Editar hallazgo (tercero)</DialogTitle>
          </DialogHeader>
          {edit && (
            <form className="space-y-3" onSubmit={onEdit}>
              <p className="text-xs text-muted-foreground">
                Revisión:{' '}
                <Link href={`/revision_terceros/${edit.revision_tercero_id}`} className="text-primary underline-offset-2 hover:underline">
                  {revLabel(edit.revision_tercero_id)}
                </Link>
              </p>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">CVSS (0–10)</label>
                  <Input
                    className="mt-1"
                    value={formE.watch('cvss_score') ?? ''}
                    onChange={(e) => formE.setValue('cvss_score', e.target.value, { shouldValidate: true })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CWE</label>
                  <Input
                    className="mt-1"
                    value={formE.watch('cwe_id') ?? ''}
                    onChange={(e) => formE.setValue('cwe_id', e.target.value || null, { shouldValidate: true })}
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
