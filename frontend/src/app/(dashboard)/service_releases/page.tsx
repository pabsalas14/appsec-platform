'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import {
  useCreateServiceRelease,
  useDeleteServiceRelease,
  useServiceReleases,
  useUpdateServiceRelease,
} from '@/hooks/useServiceReleases';
import { useServiceReleaseOperacionConfig } from '@/hooks/useOperacionConfig';
import { useServicios } from '@/hooks/useServicios';
import { logger } from '@/lib/logger';
import {
  ESTADOS_SERVICE_RELEASE,
  ServiceReleaseFormInputSchema,
  type ServiceRelease,
  type ServiceReleaseCreate,
  type ServiceReleaseFormInput,
  type ServiceReleaseUpdate,
} from '@/lib/schemas/service_release.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ALL = '' as const;

const emptyForm: ServiceReleaseFormInput = {
  nombre: '',
  version: '',
  descripcion: null,
  servicio_id: '',
  estado_actual: 'Borrador',
  jira_referencia: null,
  contexto_liberacion_text: '',
  fecha_entrada_local: '',
};

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildServiceReleasePayload(data: ServiceReleaseFormInput): ServiceReleaseCreate {
  let contexto: Record<string, unknown> | null = null;
  if (data.contexto_liberacion_text && data.contexto_liberacion_text.trim()) {
    try {
      const parsed: unknown = JSON.parse(data.contexto_liberacion_text);
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        contexto = parsed as Record<string, unknown>;
      } else {
        throw new Error();
      }
    } catch {
      throw new Error('JSON inválido en contexto de liberación (debe ser un objeto).');
    }
  }
  let fecha: string | null = null;
  if (data.fecha_entrada_local) {
    const d = new Date(data.fecha_entrada_local);
    if (Number.isNaN(d.getTime())) throw new Error('Fecha de entrada inválida');
    fecha = d.toISOString();
  }
  return {
    nombre: data.nombre.trim(),
    version: data.version.trim(),
    descripcion: data.descripcion?.trim() || null,
    servicio_id: data.servicio_id,
    estado_actual: data.estado_actual,
    jira_referencia: data.jira_referencia?.trim() || null,
    contexto_liberacion: contexto,
    fecha_entrada: fecha,
  };
}

function ServiceReleaseForm({
  initial,
  onSuccess,
  servicioOptions,
}: {
  initial?: ServiceRelease | null;
  onSuccess: () => void;
  servicioOptions: { value: string; label: string }[];
}) {
  const { data: operacion } = useServiceReleaseOperacionConfig();
  const createMut = useCreateServiceRelease();
  const updateMut = useUpdateServiceRelease();
  const isEdit = Boolean(initial);
  const form = useForm<ServiceReleaseFormInput>({
    resolver: zodResolver(ServiceReleaseFormInputSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          version: initial.version,
          descripcion: initial.descripcion ?? null,
          servicio_id: initial.servicio_id,
          estado_actual: initial.estado_actual as ServiceReleaseFormInput['estado_actual'],
          jira_referencia: initial.jira_referencia ?? null,
          contexto_liberacion_text: initial.contexto_liberacion
            ? JSON.stringify(initial.contexto_liberacion, null, 2)
            : '',
          fecha_entrada_local: toDatetimeLocal(initial.fecha_entrada),
        }
      : {
          ...emptyForm,
          servicio_id: servicioOptions[0]?.value ?? '',
        },
  });

  const pending = createMut.isPending || updateMut.isPending;
  const tr = operacion?.transiciones;
  const estadoOptions = useMemo(() => {
    const toOpt = (e: string) => ({ value: e, label: e });
    if (isEdit && initial) {
      const cur = initial.estado_actual;
      if (!tr || Object.keys(tr).length === 0) return ESTADOS_SERVICE_RELEASE.map(toOpt);
      const next = tr[cur] as string[] | undefined;
      if (next && next.length) {
        return Array.from(new Set([cur, ...next])).map(toOpt);
      }
      return [toOpt(cur)];
    }
    return [{ value: 'Borrador', label: 'Borrador' }];
  }, [isEdit, initial, tr]);

  const onSubmit = form.handleSubmit((data) => {
    let createPayload: ServiceReleaseCreate;
    try {
      createPayload = buildServiceReleasePayload(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Datos no válidos');
      return;
    }
    if (isEdit && initial) {
      const patch: ServiceReleaseUpdate = {};
      if (createPayload.nombre !== initial.nombre) patch.nombre = createPayload.nombre;
      if (createPayload.version !== initial.version) patch.version = createPayload.version;
      if ((createPayload.descripcion ?? null) !== (initial.descripcion ?? null))
        patch.descripcion = createPayload.descripcion;
      if (createPayload.estado_actual !== initial.estado_actual) patch.estado_actual = createPayload.estado_actual;
      if ((createPayload.jira_referencia ?? null) !== (initial.jira_referencia ?? null))
        patch.jira_referencia = createPayload.jira_referencia;
      if (JSON.stringify(createPayload.contexto_liberacion ?? null) !== JSON.stringify(initial.contexto_liberacion ?? null)) {
        patch.contexto_liberacion = createPayload.contexto_liberacion;
      }
      if ((createPayload.fecha_entrada ?? null) !== (initial.fecha_entrada ?? null)) {
        patch.fecha_entrada = createPayload.fecha_entrada;
      }
      if (Object.keys(patch).length === 0) {
        onSuccess();
        return;
      }
      updateMut.mutate(
        { id: initial.id, ...patch },
        {
          onSuccess: () => {
            toast.success('Liberación actualizada');
            onSuccess();
          },
          onError: (e) => {
            logger.error('service_release.update.failed', { id: String(initial.id), error: e });
            toast.error(extractErrorMessage(e, 'Error al guardar'));
          },
        },
      );
    } else {
      createMut.mutate(createPayload, {
        onSuccess: () => {
          toast.success('Liberación creada');
          onSuccess();
        },
        onError: (e) => {
          logger.error('service_release.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {!isEdit && (
        <div>
          <label className="text-sm font-medium">Servicio *</label>
          <Select
            className="mt-1"
            value={form.watch('servicio_id')}
            onChange={(e) => form.setValue('servicio_id', e.target.value, { shouldValidate: true })}
            options={servicioOptions}
            placeholder="Selecciona servicio"
          />
          {form.formState.errors.servicio_id && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.servicio_id.message}</p>
          )}
        </div>
      )}
      {isEdit && initial && (
        <div className="rounded-md border border-white/10 p-3 text-sm">
          <span className="text-muted-foreground">Servicio: </span>
          <span className="font-medium">
            {servicioOptions.find((o) => o.value === initial.servicio_id)?.label ?? initial.servicio_id}
          </span>
          <p className="text-xs text-muted-foreground mt-1">El servicio no se puede cambiar tras crear la liberación.</p>
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Nombre *</label>
        <Input className="mt-1" maxLength={500} {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Versión *</label>
        <Input className="mt-1" maxLength={100} placeholder="1.0.0" {...form.register('version')} />
        {form.formState.errors.version && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.version.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          className="mt-1"
          rows={2}
          value={form.watch('descripcion') ?? ''}
          onChange={(e) => form.setValue('descripcion', e.target.value || null, { shouldValidate: true })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Estado *</label>
        <Select
          className="mt-1"
          value={form.watch('estado_actual')}
          onChange={(e) =>
            form.setValue('estado_actual', e.target.value as ServiceReleaseFormInput['estado_actual'], {
              shouldValidate: true,
            })
          }
          options={estadoOptions}
        />
        {tr && Object.keys(tr).length > 0 && isEdit && (
          <p className="mt-1 text-xs text-muted-foreground">
            Transiciones mostradas según ajuste de operación (admin o Settings).
          </p>
        )}
        {form.formState.errors.estado_actual && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.estado_actual.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Fecha de entrada a la etapa (opcional)</label>
        <Input
          className="mt-1"
          type="datetime-local"
          value={form.watch('fecha_entrada_local') ?? ''}
          onChange={(e) => form.setValue('fecha_entrada_local', e.target.value || null, { shouldValidate: true })}
        />
        <p className="text-xs text-muted-foreground mt-1">BRD: cuándo ingresó al estado/etapa (auditoría y SLA de paso).</p>
      </div>
      <div>
        <label className="text-sm font-medium">Contexto de liberación (JSON opcional)</label>
        <Textarea
          className="mt-1 font-mono text-xs"
          rows={4}
          placeholder='{ "riesgo": "alto" }'
          value={form.watch('contexto_liberacion_text') ?? ''}
          onChange={(e) => form.setValue('contexto_liberacion_text', e.target.value, { shouldValidate: true })}
        />
        {form.formState.errors.contexto_liberacion_text && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.contexto_liberacion_text.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Referencia Jira</label>
        <Input
          className="mt-1"
          value={form.watch('jira_referencia') ?? ''}
          onChange={(e) => form.setValue('jira_referencia', e.target.value || null, { shouldValidate: true })}
          placeholder="PROJ-123"
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
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function ServiceReleasesPage() {
  const [q, setQ] = useState('');
  const [jiraF, setJiraF] = useState('');
  const [servicioF, setServicioF] = useState<string>(ALL);
  const [estadoF, setEstadoF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<ServiceRelease | null>(null);
  const deleteMut = useDeleteServiceRelease();
  const { data: servicios } = useServicios();

  const listParams = useMemo(() => {
    const p: { servicio_id?: string; estado_actual?: string; jira?: string } = {};
    if (servicioF !== ALL) p.servicio_id = servicioF;
    if (estadoF !== ALL) p.estado_actual = estadoF;
    if (jiraF.trim()) p.jira = jiraF.trim();
    return Object.keys(p).length ? p : undefined;
  }, [servicioF, estadoF, jiraF]);

  const { data: rows, isLoading, isError } = useServiceReleases(listParams);

  const servicioById = useMemo(
    () => new Map((servicios ?? []).map((s) => [s.id, s.nombre])),
    [servicios],
  );

  const servicioOptions = useMemo(
    () => (servicios ?? []).map((s) => ({ value: s.id, label: s.nombre })),
    [servicios],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || []).filter((r) => {
      if (!s) return true;
      return (
        r.nombre.toLowerCase().includes(s) ||
        r.version.toLowerCase().includes(s) ||
        (r.jira_referencia && r.jira_referencia.toLowerCase().includes(s)) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(s)) ||
        (servicioById.get(r.servicio_id) || '').toLowerCase().includes(s) ||
        (r.contexto_liberacion && JSON.stringify(r.contexto_liberacion).toLowerCase().includes(s))
      );
    });
  }, [rows, q, servicioById]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Liberaciones de servicio (BRD)"
        description="Versiones de despliegue vinculadas a un servicio; estados, contexto JSON (BRD) y transiciones alineados a operación (admin / Settings)."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!servicioOptions.length}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva liberación</DialogTitle>
            </DialogHeader>
            <ServiceReleaseForm onSuccess={() => setCreateOpen(false)} servicioOptions={servicioOptions} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <Package className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} liberación(es)
            {listParams && ' (filtrada en servidor)'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
            <div>
              <label className="text-sm font-medium">Servicio</label>
              <Select
                className="mt-1"
                value={servicioF}
                onChange={(e) => setServicioF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todos' },
                  ...servicioOptions,
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
                  ...ESTADOS_SERVICE_RELEASE.map((e) => ({ value: e, label: e })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Referencia Jira (API)</label>
              <Input
                className="mt-1"
                placeholder="PROJ-42 (búsqueda parcial en servidor)"
                value={jiraF}
                onChange={(e) => setJiraF(e.target.value)}
              />
            </div>
            <div className="max-w-md sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium">Buscar en vista (cliente)</label>
              <Input
                className="mt-1"
                placeholder="Nombre, versión, servicio, contexto…"
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
          {isError && <p className="text-destructive">No se pudo cargar el catálogo.</p>}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay liberaciones. Crea servicios y define una liberación.</p>
          )}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Versión</DataTableTh>
                  <DataTableTh>Servicio</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Ctx.</DataTableTh>
                  <DataTableTh>Entrada</DataTableTh>
                  <DataTableTh>Jira</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => (
                  <DataTableRow key={r.id}>
                    <DataTableCell className="font-medium">{r.nombre}</DataTableCell>
                    <DataTableCell className="font-mono text-sm">{r.version}</DataTableCell>
                    <DataTableCell>
                      {servicioById.get(r.servicio_id) ?? r.servicio_id.slice(0, 8)}
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="primary" className="whitespace-normal text-left max-w-[200px]">
                        {r.estado_actual}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground">
                      {r.contexto_liberacion && Object.keys(r.contexto_liberacion).length > 0 ? 'Sí' : '—'}
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {r.fecha_entrada ? formatDate(r.fecha_entrada) : '—'}
                    </DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">
                      {r.jira_referencia ?? '—'}
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
                              <AlertDialogTitle>¿Eliminar liberación?</AlertDialogTitle>
                              <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(r.id, {
                                    onSuccess: () => toast.success('Eliminada'),
                                    onError: (e) => {
                                      logger.error('service_release.delete.failed', { id: r.id, error: e });
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
            <DialogTitle>Editar liberación</DialogTitle>
          </DialogHeader>
          {edit && (
            <ServiceReleaseForm
              key={edit.id}
              initial={edit}
              onSuccess={() => setEdit(null)}
              servicioOptions={servicioOptions}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
