'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  Progress,
  Select,
  Textarea,
} from '@/components/ui';
import { useCelulas } from '@/hooks/useCelulas';
import { useIniciativaProgresoMes } from '@/hooks/useIniciativaProgresoMes';
import {
  useCreateIniciativa,
  useDeleteIniciativa,
  useIniciativas,
  useUpdateIniciativa,
} from '@/hooks/useIniciativas';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { logger } from '@/lib/logger';
import type { Iniciativa, IniciativaCreate, IniciativaUpdate } from '@/lib/schemas/iniciativa.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';
import { z } from 'zod';

const ALL = '' as const;
const FILTER_SIN_CELULA = '__sin_celula__' as const;

const iniciativaFormSchema = z.object({
  titulo: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  tipo: z.string().min(1).max(200),
  estado: z.string().min(1).max(200),
  celula_id: z.string(),
  fecha_inicio: z.string().optional(),
  fecha_fin_estimada: z.string().optional(),
});
type IniciativaForm = z.infer<typeof iniciativaFormSchema>;

const emptyForm: IniciativaForm = {
  titulo: '',
  descripcion: null,
  tipo: 'Mejora',
  estado: 'Borrador',
  celula_id: '',
  fecha_inicio: '',
  fecha_fin_estimada: '',
};

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

function IniciativaFormView({
  initial,
  onSuccess,
  celulaOptions,
}: {
  initial?: Iniciativa | null;
  onSuccess: () => void;
  celulaOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateIniciativa();
  const updateMut = useUpdateIniciativa();
  const isEdit = Boolean(initial);
  const form = useForm<IniciativaForm>({
    resolver: zodResolver(iniciativaFormSchema),
    defaultValues: initial
      ? {
          titulo: initial.titulo,
          descripcion: initial.descripcion ?? null,
          tipo: initial.tipo,
          estado: initial.estado,
          celula_id: initial.celula_id ?? '',
          fecha_inicio: toDatetimeLocal(initial.fecha_inicio),
          fecha_fin_estimada: toDatetimeLocal(initial.fecha_fin_estimada),
        }
      : {
          ...emptyForm,
        },
  });

  const pending = createMut.isPending || updateMut.isPending;

  const toApiPayload = (data: IniciativaForm): IniciativaCreate => ({
    titulo: data.titulo.trim(),
    descripcion: data.descripcion?.trim() || null,
    tipo: data.tipo.trim(),
    estado: data.estado.trim(),
    celula_id: data.celula_id && data.celula_id.length > 0 ? data.celula_id : null,
    fecha_inicio: fromDatetimeLocal(data.fecha_inicio),
    fecha_fin_estimada: fromDatetimeLocal(data.fecha_fin_estimada),
  });

  const nIso = (s: string | null | undefined) => (s ? new Date(s).toISOString() : null);

  const onSubmit = form.handleSubmit((data) => {
    const next = toApiPayload(data);
    if (isEdit && initial) {
      const patch: IniciativaUpdate = {};
      if (next.titulo !== initial.titulo) patch.titulo = next.titulo;
      if ((next.descripcion ?? null) !== (initial.descripcion ?? null)) patch.descripcion = next.descripcion;
      if (next.tipo !== initial.tipo) patch.tipo = next.tipo;
      if (next.estado !== initial.estado) patch.estado = next.estado;
      if ((next.celula_id ?? null) !== (initial.celula_id ?? null)) patch.celula_id = next.celula_id;
      if (nIso(next.fecha_inicio) !== nIso(initial.fecha_inicio ?? null)) patch.fecha_inicio = next.fecha_inicio;
      if (nIso(next.fecha_fin_estimada) !== nIso(initial.fecha_fin_estimada ?? null))
        patch.fecha_fin_estimada = next.fecha_fin_estimada;
      if (Object.keys(patch).length === 0) {
        onSuccess();
        return;
      }
      updateMut.mutate(
        { id: initial.id, ...patch },
        {
          onSuccess: () => {
            toast.success('Iniciativa actualizada');
            onSuccess();
          },
          onError: (e) => {
            logger.error('iniciativa.update.failed', { id: String(initial.id), error: e });
            toast.error(extractErrorMessage(e, 'Error al guardar'));
          },
        },
      );
    } else {
      createMut.mutate(next, {
        onSuccess: () => {
          toast.success('Iniciativa creada');
          onSuccess();
        },
        onError: (e) => {
          logger.error('iniciativa.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  const celWithNone = useMemo(
    () => [{ value: ALL, label: 'Sin célula' }, ...celulaOptions],
    [celulaOptions],
  );

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Título *</label>
        <Input className="mt-1" maxLength={500} {...form.register('titulo')} />
        {form.formState.errors.titulo && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.titulo.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          className="mt-1"
          rows={3}
          value={form.watch('descripcion') ?? ''}
          onChange={(e) => form.setValue('descripcion', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Tipo *</label>
          <Input
            className="mt-1"
            maxLength={200}
            placeholder="Estratégica, mejora, compliance…"
            {...form.register('tipo')}
          />
          {form.formState.errors.tipo && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.tipo.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Estado *</label>
          <Input
            className="mt-1"
            maxLength={200}
            placeholder="Borrador, en curso, cerrada…"
            {...form.register('estado')}
          />
          {form.formState.errors.estado && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.estado.message}</p>
          )}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Célula (opcional)</label>
        <Select
          className="mt-1"
          value={form.watch('celula_id') || ALL}
          onChange={(e) => {
            const v = e.target.value;
            form.setValue('celula_id', v === ALL ? '' : v, { shouldValidate: true });
          }}
          options={celWithNone}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Fecha inicio</label>
          <Input
            className="mt-1"
            type="datetime-local"
            value={form.watch('fecha_inicio') ?? ''}
            onChange={(e) => form.setValue('fecha_inicio', e.target.value, { shouldValidate: true })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Fecha fin estimada</label>
          <Input
            className="mt-1"
            type="datetime-local"
            value={form.watch('fecha_fin_estimada') ?? ''}
            onChange={(e) => form.setValue('fecha_fin_estimada', e.target.value, { shouldValidate: true })}
          />
        </div>
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

export default function IniciativasPage() {
  const { data: rows, isLoading, isError, error: listError } = useIniciativas();
  const { data: orgs } = useOrganizacions();
  const { data: celulas } = useCelulas();
  const [q, setQ] = useState('');
  const [celulaF, setCelulaF] = useState<string | typeof FILTER_SIN_CELULA>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Iniciativa | null>(null);
  const [progresoIniciativaId, setProgresoIniciativaId] = useState<string>('');
  const deleteMut = useDeleteIniciativa();
  const { data: progresoMes, isLoading: progresoLoading } = useIniciativaProgresoMes(
    progresoIniciativaId || null,
  );

  const orgName = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of orgs || []) m.set(o.id, o.nombre);
    return m;
  }, [orgs]);

  const celulaFormOptions = useMemo(() => {
    const fromAll = (celulas ?? []).map((c) => {
      const onombre = orgName.get(c.organizacion_id);
      return { value: c.id, label: onombre ? `${onombre} / ${c.nombre}` : c.nombre };
    });
    if (edit) {
      const c = celulas?.find((x) => x.id === edit.celula_id);
      if (c && edit.celula_id && !fromAll.some((o) => o.value === c.id)) {
        const onombre = orgName.get(c.organizacion_id);
        return [
          { value: c.id, label: onombre ? `${onombre} / ${c.nombre}` : c.nombre },
          ...fromAll,
        ];
      }
    }
    return fromAll;
  }, [celulas, orgName, edit]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => {
        if (celulaF === ALL) return true;
        if (celulaF === FILTER_SIN_CELULA) return !r.celula_id;
        return r.celula_id === celulaF;
      })
      .filter((r) => {
        if (!s) return true;
        const cname = r.celula_id
          ? (celulas?.find((c) => c.id === r.celula_id)?.nombre ?? '')
          : '';
        return (
          r.titulo.toLowerCase().includes(s) ||
          cname.toLowerCase().includes(s) ||
          r.tipo.toLowerCase().includes(s) ||
          r.estado.toLowerCase().includes(s) ||
          (r.descripcion && r.descripcion.toLowerCase().includes(s))
        );
      });
  }, [rows, q, celulaF, celulas]);

  useEffect(() => {
    if (rows && rows.length > 0 && !progresoIniciativaId) {
      setProgresoIniciativaId(rows[0].id);
    }
  }, [rows, progresoIniciativaId]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Iniciativas"
        description="Líneas de trabajo o mejora; opcionalmente asociadas a una célula, con fechas de seguimiento."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href="/hito_iniciativas"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Hitos
          </Link>
          <Link
            href="/actualizacion_iniciativas"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Actualizaciones
          </Link>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva iniciativa</DialogTitle>
            </DialogHeader>
            <IniciativaFormView onSuccess={() => setCreateOpen(false)} celulaOptions={celulaFormOptions} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {rows && rows.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-medium">P10 · Progreso del mes (actividades / hitos)</h3>
                <p className="text-xs text-muted-foreground">
                  Pesos desde cada hito; el total se recalcula al cambiar estatus (TanStack Query).
                </p>
              </div>
              <div className="w-full sm:max-w-sm">
                <label className="text-xs text-muted-foreground">Iniciativa</label>
                <Select
                  className="mt-1"
                  value={progresoIniciativaId}
                  onChange={(e) => setProgresoIniciativaId(e.target.value)}
                  options={rows.map((r) => ({ value: r.id, label: r.titulo }))}
                />
              </div>
            </div>
            {progresoLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </div>
            )}
            {progresoMes && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {progresoMes.mes}/{progresoMes.anio} — avance
                  </span>
                  <span className="font-mono text-primary">{progresoMes.progreso_total_pct.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(100, progresoMes.progreso_total_pct)} className="h-2" />
                <ul className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                  {progresoMes.actividades.map((a) => (
                    <li key={a.id}>
                      <span className="text-foreground">{a.titulo}</span> — peso {a.peso_pct}% — {a.estado}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <Target className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} iniciativa(s)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            <div>
              <label className="text-sm font-medium">Célula</label>
              <Select
                className="mt-1"
                value={celulaF}
                onChange={(e) => setCelulaF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todas' },
                  { value: FILTER_SIN_CELULA, label: 'Sin célula' },
                  ...(celulas ?? []).map((c) => {
                    const onombre = orgName.get(c.organizacion_id);
                    return { value: c.id, label: onombre ? `${onombre} / ${c.nombre}` : c.nombre };
                  }),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <Input
                className="mt-1"
                placeholder="Título, tipo, estado, descripción…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && (
            <p className="text-destructive">
              {extractErrorMessage(listError, 'No se pudo cargar el listado de iniciativas.')}
            </p>
          )}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay iniciativas. Crea la primera o asocia una célula.</p>
          )}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Título</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Célula</DataTableTh>
                  <DataTableTh>Fechas</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => {
                  const c = r.celula_id ? celulas?.find((x) => x.id === r.celula_id) : null;
                  return (
                    <DataTableRow key={r.id}>
                      <DataTableCell className="font-medium max-w-[220px]">
                        <div className="truncate" title={r.titulo}>
                          {r.titulo}
                        </div>
                        {r.descripcion && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{r.descripcion}</div>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="default">{r.tipo}</Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="primary">{r.estado}</Badge>
                      </DataTableCell>
                      <DataTableCell className="text-sm text-muted-foreground">
                        {c ? c.nombre : '—'}
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {r.fecha_inicio ? formatDate(r.fecha_inicio) : '—'}
                        {' / '}
                        {r.fecha_fin_estimada ? formatDate(r.fecha_fin_estimada) : '—'}
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
                                <AlertDialogTitle>¿Eliminar iniciativa?</AlertDialogTitle>
                                <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteMut.mutate(r.id, {
                                      onSuccess: () => toast.success('Eliminada'),
                                      onError: (e) => {
                                        logger.error('iniciativa.delete.failed', { id: r.id, error: e });
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
                  );
                })}
              </DataTableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>

      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar iniciativa</DialogTitle>
          </DialogHeader>
          {edit && (
            <IniciativaFormView
              key={edit.id}
              initial={edit}
              onSuccess={() => setEdit(null)}
              celulaOptions={celulaFormOptions}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
