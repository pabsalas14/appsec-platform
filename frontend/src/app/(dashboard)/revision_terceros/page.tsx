'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  Checkbox,
} from '@/components/ui';
import { isoToLocalDateTime, localDateTimeToIso } from '@/components/crud';
import { useActivoWebs } from '@/hooks/useActivoWebs';
import {
  useCreateRevisionTercero,
  useDeleteRevisionTercero,
  useRevisionTerceroChecklistTemplate,
  useRevisionTerceros,
  useUpdateRevisionTercero,
} from '@/hooks/useRevisionTerceros';
import { useServicios } from '@/hooks/useServicios';
import { REVISION_TERCERO_ESTADOS, REVISION_TERCERO_TIPOS } from '@/lib/revision-tercero-constants';
import { logger } from '@/lib/logger';
import { RevisionTerceroCreateSchema, type RevisionTercero, type RevisionTerceroCreate } from '@/lib/schemas/revision_tercero.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = RevisionTerceroCreateSchema;
type FormData = z.infer<typeof formSchema>;
const NONE = '';

function FormFields({
  initial,
  onSuccess,
  srvOpts,
  awOpts,
}: {
  initial?: RevisionTercero | null;
  onSuccess: () => void;
  srvOpts: { value: string; label: string }[];
  awOpts: { value: string; label: string }[];
}) {
  const createMut = useCreateRevisionTercero();
  const updateMut = useUpdateRevisionTercero();
  const isEdit = Boolean(initial);
  const { data: checklistTmpl } = useRevisionTerceroChecklistTemplate();
  const [ini, setIni] = useState(() => (initial ? isoToLocalDateTime(initial.fecha_inicio) : ''));
  const [fin, setFin] = useState(() => (initial?.fecha_fin ? isoToLocalDateTime(initial.fecha_fin) : ''));
  const [checkMap, setCheckMap] = useState<Record<string, { ok: boolean; nota: string }>>({});
  const [evidRows, setEvidRows] = useState<{ url: string; descripcion: string }[]>([{ url: '', descripcion: '' }]);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre_empresa: initial.nombre_empresa,
          tipo: initial.tipo,
          servicio_id: initial.servicio_id ?? null,
          activo_web_id: initial.activo_web_id ?? null,
          fecha_inicio: initial.fecha_inicio,
          fecha_fin: initial.fecha_fin ?? null,
          estado: initial.estado,
          informe_filename: initial.informe_filename ?? null,
          informe_sha256: initial.informe_sha256 ?? null,
          responsable_revision: initial.responsable_revision ?? null,
          observaciones: initial.observaciones ?? null,
          checklist_resultados: initial.checklist_resultados ?? null,
          evidencias: initial.evidencias ?? null,
        }
      : {
          nombre_empresa: '',
          tipo: REVISION_TERCERO_TIPOS[0],
          servicio_id: srvOpts[0]?.value || null,
          activo_web_id: null,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: null,
          estado: 'Planificada',
          informe_filename: null,
          informe_sha256: null,
          responsable_revision: null,
          observaciones: null,
          checklist_resultados: null,
          evidencias: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;
  const sv = form.watch('servicio_id');
  const aw = form.watch('activo_web_id');

  useEffect(() => {
    if (initial) {
      setIni(isoToLocalDateTime(initial.fecha_inicio));
      setFin(initial.fecha_fin ? isoToLocalDateTime(initial.fecha_fin) : '');
    }
  }, [initial]);

  useEffect(() => {
    const items = checklistTmpl?.items ?? [];
    if (!items.length) return;
    if (!initial) {
      const empty: Record<string, { ok: boolean; nota: string }> = {};
      for (const it of items) {
        empty[it.id] = { ok: false, nota: '' };
      }
      setCheckMap(empty);
      setEvidRows([{ url: '', descripcion: '' }]);
      return;
    }
    const cr = (initial.checklist_resultados as Record<string, { ok?: boolean; nota?: string } | undefined>) ?? {};
    const next: Record<string, { ok: boolean; nota: string }> = {};
    for (const it of items) {
      const raw = cr[it.id];
      next[it.id] = {
        ok: Boolean(raw?.ok),
        nota: raw?.nota?.trim() ?? '',
      };
    }
    setCheckMap(next);
    const evs = (initial.evidencias as { url?: string; descripcion?: string }[] | undefined) ?? [];
    setEvidRows(evs.length ? evs.map((e) => ({ url: e.url ?? '', descripcion: e.descripcion ?? '' })) : [{ url: '', descripcion: '' }]);
  }, [initial, checklistTmpl]);

  const onSubmit = form.handleSubmit((data) => {
    const s = data.servicio_id && data.servicio_id.length > 0 ? data.servicio_id : null;
    const a = data.activo_web_id && data.activo_web_id.length > 0 ? data.activo_web_id : null;
    if (!s && !a) {
      toast.error('Debe indicar al menos un servicio o un activo web.');
      return;
    }
    const fi = localDateTimeToIso(ini) || data.fecha_inicio;
    const ff = fin.trim() ? localDateTimeToIso(fin) : null;
    const checklist_resultados: Record<string, { ok: boolean; nota?: string }> = {};
    for (const [id, v] of Object.entries(checkMap)) {
      if (v.ok || (v.nota && v.nota.length > 0)) {
        checklist_resultados[id] = { ok: v.ok, ...(v.nota ? { nota: v.nota } : {}) };
      }
    }
    const evidencias = evidRows
      .map((e) => ({
        url: e.url.trim() || undefined,
        descripcion: e.descripcion.trim() || undefined,
      }))
      .filter((e) => e.url || e.descripcion);
    const payload: RevisionTerceroCreate = {
      nombre_empresa: data.nombre_empresa.trim(),
      tipo: data.tipo,
      servicio_id: s,
      activo_web_id: a,
      fecha_inicio: fi,
      fecha_fin: ff,
      estado: data.estado,
      informe_filename: data.informe_filename?.trim() || null,
      informe_sha256: data.informe_sha256?.trim() || null,
      responsable_revision: data.responsable_revision?.trim() || null,
      observaciones: data.observaciones?.trim() || null,
      checklist_resultados: Object.keys(checklist_resultados).length ? checklist_resultados : null,
      evidencias: evidencias.length ? evidencias : null,
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
            logger.error('revision_tercero.update.failed', { id: initial.id, error: e });
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
          logger.error('revision_tercero.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Empresa / nombre</label>
        <Input className="mt-1" {...form.register('nombre_empresa')} />
      </div>
      <div>
        <label className="text-sm font-medium">Tipo</label>
        <Select
          className="mt-1"
          value={form.watch('tipo')}
          onChange={(e) => form.setValue('tipo', e.target.value, { shouldValidate: true })}
          options={REVISION_TERCERO_TIPOS.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Servicio</label>
        <Select
          className="mt-1"
          value={sv ?? NONE}
          onChange={(e) => form.setValue('servicio_id', e.target.value === NONE ? null : e.target.value, { shouldValidate: true })}
          options={[{ value: NONE, label: '— Ninguno —' }, ...srvOpts]}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Activo web</label>
        <Select
          className="mt-1"
          value={aw ?? NONE}
          onChange={(e) => form.setValue('activo_web_id', e.target.value === NONE ? null : e.target.value, { shouldValidate: true })}
          options={[{ value: NONE, label: '— Ninguno —' }, ...awOpts]}
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
        <label className="text-sm font-medium">Estado</label>
        <Select
          className="mt-1"
          value={form.watch('estado')}
          onChange={(e) => form.setValue('estado', e.target.value, { shouldValidate: true })}
          options={REVISION_TERCERO_ESTADOS.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Informe (nombre archivo)</label>
        <Input className="mt-1" {...form.register('informe_filename')} />
      </div>
      <div>
        <label className="text-sm font-medium">SHA-256 informe</label>
        <Input className="mt-1" {...form.register('informe_sha256')} />
      </div>
      <div className="border-t border-border pt-3">
        <p className="mb-2 text-sm font-medium">BRD §10.3 — Checklist y cierre</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Plantilla desde la API; los resultados se almacenan con la revisión.
        </p>
        {checklistTmpl?.items.map((it) => (
          <div key={it.id} className="mb-2 rounded-md border border-border/80 p-2">
            <div className="flex items-start gap-2">
              <Checkbox
                id={`chk-${it.id}`}
                className="mt-1"
                checked={checkMap[it.id]?.ok ?? false}
                onChange={(e) =>
                  setCheckMap((m) => ({
                    ...m,
                    [it.id]: { ok: e.target.checked, nota: m[it.id]?.nota ?? '' },
                  }))
                }
              />
              <div className="min-w-0 flex-1">
                <label htmlFor={`chk-${it.id}`} className="text-sm font-medium leading-snug">
                  {it.label}
                </label>
                <Input
                  className="mt-1 h-8 text-xs"
                  placeholder="Nota breve (opcional)"
                  value={checkMap[it.id]?.nota ?? ''}
                  onChange={(e) =>
                    setCheckMap((m) => ({
                      ...m,
                      [it.id]: { ok: m[it.id]?.ok ?? false, nota: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        ))}
        <div className="mt-2">
          <label className="text-sm font-medium">Evidencias (URL + descripción)</label>
          <div className="mt-1 space-y-2">
            {evidRows.map((row, idx) => (
              <div key={idx} className="flex flex-col gap-1 sm:flex-row sm:items-center">
                <Input
                  className="text-xs"
                  placeholder="https://…"
                  value={row.url}
                  onChange={(e) => {
                    const next = [...evidRows];
                    next[idx] = { ...next[idx], url: e.target.value };
                    setEvidRows(next);
                  }}
                />
                <Input
                  className="text-xs"
                  placeholder="Descripción"
                  value={row.descripcion}
                  onChange={(e) => {
                    const next = [...evidRows];
                    next[idx] = { ...next[idx], descripcion: e.target.value };
                    setEvidRows(next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEvidRows((r) => [...r, { url: '', descripcion: '' }])}
            >
              Añadir evidencia
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <label className="text-sm font-medium">Responsable de la revisión</label>
          <Input className="mt-1" {...form.register('responsable_revision')} />
        </div>
        <div className="mt-2">
          <label className="text-sm font-medium">Observaciones</label>
          <Textarea className="mt-1 min-h-[80px] text-sm" {...form.register('observaciones')} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
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

export default function RevisionTercerosPage() {
  const { data: rows, isLoading, isError } = useRevisionTerceros();
  const { data: srvs } = useServicios();
  const { data: aws } = useActivoWebs();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<RevisionTercero | null>(null);
  const deleteMut = useDeleteRevisionTercero();

  const srvOpts = useMemo(() => (srvs ?? []).map((s) => ({ value: s.id, label: s.nombre })), [srvs]);
  const awOpts = useMemo(() => (aws ?? []).map((a) => ({ value: a.id, label: a.nombre })), [aws]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) => r.nombre_empresa.toLowerCase().includes(n) || r.tipo.toLowerCase().includes(n) || r.estado.toLowerCase().includes(n),
    );
  }, [rows, q]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Revisiones tercero"
        description="Pentest y revisiones de terceros; requieren al menos un servicio o activo web."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva revisión</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} srvOpts={srvOpts} awOpts={awOpts} />
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
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin revisiones.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Empresa</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh className="w-[64px] text-center">
                    <span title="BRD 10.3 checklist">§10.3</span>
                  </DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-[200px] truncate">{item.nombre_empresa}</DataTableCell>
                    <DataTableCell className="text-sm">{item.tipo}</DataTableCell>
                    <DataTableCell>{item.estado}</DataTableCell>
                    <DataTableCell className="text-center text-xs">
                      {item.checklist_resultados && Object.keys(item.checklist_resultados as object).length > 0
                        ? '✓'
                        : '—'}
                    </DataTableCell>
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
                                      logger.error('revision_tercero.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar revisión</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} srvOpts={srvOpts} awOpts={awOpts} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
