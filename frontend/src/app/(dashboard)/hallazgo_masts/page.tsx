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
import { SEVERIDADES_HALLAZGO, vulnerabilidadOptions } from '@/lib/hallazgo-constants';
import {
  useCreateHallazgoMAST,
  useDeleteHallazgoMAST,
  useHallazgoMASTs,
  useUpdateHallazgoMAST,
} from '@/hooks/useHallazgoMASTs';
import { useAplicacionMovils } from '@/hooks/useAplicacionMovils';
import { useEjecucionMASTs } from '@/hooks/useEjecucionMASTs';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { logger } from '@/lib/logger';
import {
  HallazgoMASTCreateSchema,
  HallazgoMastFormCreateSchema,
  HallazgoMASTUpdateSchema,
  type HallazgoMAST,
  type HallazgoMASTUpdate,
} from '@/lib/schemas/hallazgo_mast.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ALL = '' as const;
const sevE = z.enum(SEVERIDADES_HALLAZGO);
type FormCreateInput = z.infer<typeof HallazgoMastFormCreateSchema>;
const formEdit = z.object({
  vulnerabilidad_id: z.string().optional(),
  nombre: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sevE,
  cwe: z.string().max(32).nullable().optional(),
  owasp_categoria: z.string().max(200).nullable().optional(),
});
type FormEdit = z.infer<typeof formEdit>;

export default function HallazgoMastsPage() {
  const { data: rows, isLoading, isError } = useHallazgoMASTs();
  const { data: ejecuciones } = useEjecucionMASTs();
  const { data: apps } = useAplicacionMovils();
  const { data: vulns } = useVulnerabilidads();
  const [q, setQ] = useState('');
  const [ejF, setEjF] = useState<string>(ALL);
  const [sevF, setSevF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<HallazgoMAST | null>(null);
  const createMut = useCreateHallazgoMAST();
  const updateMut = useUpdateHallazgoMAST();
  const deleteMut = useDeleteHallazgoMAST();

  const vOpts = useMemo(() => vulnerabilidadOptions(vulns), [vulns]);

  const ejLabel = useCallback(
    (id: string) => {
      const e = (ejecuciones ?? []).find((x) => x.id === id);
      if (!e) return id.slice(0, 8);
      const a = (apps ?? []).find((ap) => ap.id === e.aplicacion_movil_id);
      const nm = a?.nombre ?? '—';
      return `${nm} · ${e.ambiente} · ${formatDate(e.fecha_inicio)}`;
    },
    [ejecuciones, apps],
  );

  const ejecucionOptions = useMemo(
    () =>
      (ejecuciones ?? []).map((e) => {
        const a = (apps ?? []).find((ap) => ap.id === e.aplicacion_movil_id);
        const nm = a?.nombre ?? '—';
        return { value: e.id, label: `${nm} · ${e.ambiente} · ${formatDate(e.fecha_inicio)}` };
      }),
    [ejecuciones, apps],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (ejF === ALL ? true : r.ejecucion_mast_id === ejF))
      .filter((r) => (sevF === ALL ? true : r.severidad === sevF))
      .filter((r) => {
        if (!s) return true;
        return (
          r.nombre.toLowerCase().includes(s) ||
          (r.descripcion && r.descripcion.toLowerCase().includes(s)) ||
          ejLabel(r.ejecucion_mast_id).toLowerCase().includes(s)
        );
      });
  }, [rows, q, ejF, sevF, ejLabel]);

  const formC = useForm<FormCreateInput>({
    resolver: zodResolver(HallazgoMastFormCreateSchema),
    defaultValues: {
      ejecucion_mast_id: ejecucionOptions[0]?.value ?? '',
      vulnerabilidad_id: '',
      nombre: '',
      descripcion: null,
      severidad: 'Media',
      cwe: null,
      owasp_categoria: null,
    },
  });
  const formE = useForm<FormEdit>({
    resolver: zodResolver(formEdit),
    defaultValues: {
      vulnerabilidad_id: '',
      nombre: '',
      descripcion: null,
      severidad: 'Media',
      cwe: null,
      owasp_categoria: null,
    },
  });
  useEffect(() => {
    if (!edit) return;
    formE.reset({
      vulnerabilidad_id: edit.vulnerabilidad_id ?? '',
      nombre: edit.nombre,
      descripcion: edit.descripcion ?? null,
      severidad: edit.severidad as (typeof SEVERIDADES_HALLAZGO)[number],
      cwe: edit.cwe ?? null,
      owasp_categoria: edit.owasp_categoria ?? null,
    });
  }, [edit, formE]);

  const onCreate = formC.handleSubmit((d) => {
    const out = HallazgoMASTCreateSchema.parse({
      ...d,
      descripcion: d.descripcion?.trim() || null,
      cwe: d.cwe?.trim() || null,
      owasp_categoria: d.owasp_categoria?.trim() || null,
    });
    createMut.mutate(out, {
      onSuccess: () => {
        toast.success('Hallazgo creado');
        setCreateOpen(false);
        formC.reset();
      },
      onError: (e) => {
        logger.error('hallazgo_mast.create.failed', { error: e });
        toast.error(extractErrorMessage(e, 'Error al crear'));
      },
    });
  });

  const onEdit = formE.handleSubmit((d) => {
    if (!edit) return;
    const parsed = HallazgoMASTUpdateSchema.safeParse({
      ...d,
      descripcion: d.descripcion?.trim() || null,
      cwe: d.cwe?.trim() || null,
      owasp_categoria: d.owasp_categoria?.trim() || null,
      vulnerabilidad_id: d.vulnerabilidad_id && d.vulnerabilidad_id.length > 0 ? d.vulnerabilidad_id : null,
    });
    if (!parsed.success) {
      toast.error('Revisa el formulario');
      return;
    }
    const patch: HallazgoMASTUpdate = {};
    const p0 = parsed.data;
    if ((p0.vulnerabilidad_id ?? null) !== (edit.vulnerabilidad_id ?? null)) patch.vulnerabilidad_id = p0.vulnerabilidad_id;
    if (p0.nombre !== edit.nombre) patch.nombre = p0.nombre;
    if ((p0.descripcion ?? null) !== (edit.descripcion ?? null)) patch.descripcion = p0.descripcion;
    if (p0.severidad !== edit.severidad) patch.severidad = p0.severidad;
    if ((p0.cwe ?? null) !== (edit.cwe ?? null)) patch.cwe = p0.cwe;
    if ((p0.owasp_categoria ?? null) !== (edit.owasp_categoria ?? null)) patch.owasp_categoria = p0.owasp_categoria;
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
          logger.error('hallazgo_mast.update.failed', { id: String(edit.id), error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  });

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Hallazgos MAST" description="Vinculados a una ejecución de análisis móvil.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!ejecucionOptions.length}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo hallazgo (MAST)</DialogTitle>
            </DialogHeader>
            <form className="space-y-3" onSubmit={onCreate}>
              <div>
                <label className="text-sm font-medium">Ejecución MAST *</label>
                <Select
                  className="mt-1"
                  value={formC.watch('ejecucion_mast_id')}
                  onChange={(e) => formC.setValue('ejecucion_mast_id', e.target.value, { shouldValidate: true })}
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
                <label className="text-sm font-medium">Nombre *</label>
                <Input className="mt-1" maxLength={500} {...formC.register('nombre')} />
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">CWE</label>
                  <Input
                    className="mt-1"
                    value={formC.watch('cwe') ?? ''}
                    onChange={(e) => formC.setValue('cwe', e.target.value || null, { shouldValidate: true })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">OWASP</label>
                  <Input
                    className="mt-1"
                    value={formC.watch('owasp_categoria') ?? ''}
                    onChange={(e) => formC.setValue('owasp_categoria', e.target.value || null, { shouldValidate: true })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-3xl">
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
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Ejecución / hallazgo</DataTableTh>
                  <DataTableTh>Severidad</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => (
                  <DataTableRow key={r.id}>
                    <DataTableCell>
                      <div className="text-xs text-muted-foreground mb-0.5">{ejLabel(r.ejecucion_mast_id)}</div>
                      <div className="font-medium line-clamp-2">{r.nombre}</div>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="primary">{r.severidad}</Badge>
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
                                      logger.error('hallazgo_mast.delete.failed', { id: r.id, error: e });
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
            <DialogTitle>Editar hallazgo (MAST)</DialogTitle>
          </DialogHeader>
          {edit && (
            <form className="space-y-3" onSubmit={onEdit}>
              <p className="text-xs text-muted-foreground">Ejecución: {ejLabel(edit.ejecucion_mast_id)}</p>
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
                <label className="text-sm font-medium">Nombre *</label>
                <Input className="mt-1" maxLength={500} {...formE.register('nombre')} />
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">CWE</label>
                  <Input
                    className="mt-1"
                    value={formE.watch('cwe') ?? ''}
                    onChange={(e) => formE.setValue('cwe', e.target.value || null, { shouldValidate: true })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">OWASP</label>
                  <Input
                    className="mt-1"
                    value={formE.watch('owasp_categoria') ?? ''}
                    onChange={(e) => formE.setValue('owasp_categoria', e.target.value || null, { shouldValidate: true })}
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
