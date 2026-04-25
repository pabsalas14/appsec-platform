'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownAZ, ArrowUpAZ, Loader2, Pencil, Plus, Server, Trash2 } from 'lucide-react';
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
import { CatalogCsvToolbar } from '@/components/catalog/CatalogCsvToolbar';
import { CatalogPaginationBar } from '@/components/catalog/CatalogPaginationBar';
import { useCelulas } from '@/hooks/useCelulas';
import { useClientPagedList } from '@/hooks/useClientPagedList';
import { useCreateServicio, useDeleteServicio, useServicios, useUpdateServicio } from '@/hooks/useServicios';
import { useGerencias } from '@/hooks/useGerencias';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { useSubdireccions } from '@/hooks/useSubdireccions';
import { logger } from '@/lib/logger';
import {
  CRITICIDAD_OPTIONS,
  ServicioCreateSchema,
  type Servicio,
  type ServicioCreate,
  type ServicioUpdate,
} from '@/lib/schemas/servicio.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const ALL = '' as const;

const emptyCreate: ServicioCreate = {
  nombre: '',
  descripcion: null,
  criticidad: 'Media',
  tecnologia_stack: null,
  celula_id: '',
};

const criticOptions = [
  ...CRITICIDAD_OPTIONS.map((c) => ({ value: c, label: c })),
  { value: 'Otra', label: 'Otra' },
];

function ServicioForm({
  initial,
  onSuccess,
  celulaOptions,
}: {
  initial?: Servicio | null;
  onSuccess: () => void;
  celulaOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateServicio();
  const updateMut = useUpdateServicio();
  const isEdit = Boolean(initial);
  const form = useForm<ServicioCreate>({
    resolver: zodResolver(ServicioCreateSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          descripcion: initial.descripcion ?? null,
          criticidad: initial.criticidad,
          tecnologia_stack: initial.tecnologia_stack ?? null,
          celula_id: initial.celula_id,
        }
      : {
          ...emptyCreate,
          celula_id: celulaOptions[0]?.value ?? '',
        },
  });

  const pending = createMut.isPending || updateMut.isPending;
  const critSelect = form.watch('criticidad');
  const showFreeCritic = critSelect && !CRITICIDAD_OPTIONS.includes(critSelect as (typeof CRITICIDAD_OPTIONS)[number]);

  const onSubmit = form.handleSubmit((data) => {
    const payload: ServicioCreate = {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      criticidad: data.criticidad.trim().slice(0, 50),
      tecnologia_stack: data.tecnologia_stack?.trim() || null,
      celula_id: data.celula_id,
    };
    if (isEdit && initial) {
      const patch: ServicioUpdate = {};
      if (payload.nombre !== initial.nombre) patch.nombre = payload.nombre;
      if ((payload.descripcion ?? null) !== (initial.descripcion ?? null)) patch.descripcion = payload.descripcion;
      if (payload.criticidad !== initial.criticidad) patch.criticidad = payload.criticidad;
      if ((payload.tecnologia_stack ?? null) !== (initial.tecnologia_stack ?? null))
        patch.tecnologia_stack = payload.tecnologia_stack;
      if (payload.celula_id !== initial.celula_id) patch.celula_id = payload.celula_id;
      if (Object.keys(patch).length === 0) {
        onSuccess();
        return;
      }
      updateMut.mutate(
        { id: initial.id, ...patch },
        {
          onSuccess: () => {
            toast.success('Servicio actualizado');
            onSuccess();
          },
          onError: (e) => {
            logger.error('servicio.update.failed', { id: String(initial.id), error: e });
            toast.error(extractErrorMessage(e, 'Error al guardar'));
          },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Servicio creado');
          onSuccess();
        },
        onError: (e) => {
          logger.error('servicio.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Célula *</label>
        <Select
          className="mt-1"
          value={form.watch('celula_id')}
          onChange={(e) => form.setValue('celula_id', e.target.value, { shouldValidate: true })}
          options={celulaOptions}
          placeholder="Selecciona célula"
        />
        {form.formState.errors.celula_id && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.celula_id.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Nombre *</label>
        <Input className="mt-1" maxLength={255} {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.nombre.message}</p>
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
        <label className="text-sm font-medium">Criticidad *</label>
        <Select
          className="mt-1"
          value={showFreeCritic ? 'Otra' : form.watch('criticidad')}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'Otra') {
              form.setValue('criticidad', '', { shouldValidate: true });
            } else {
              form.setValue('criticidad', v, { shouldValidate: true });
            }
          }}
          options={criticOptions}
        />
        {showFreeCritic && (
          <Input
            className="mt-2"
            maxLength={50}
            placeholder="Especificar criticidad (máx. 50 caracteres)"
            value={form.watch('criticidad')}
            onChange={(e) => form.setValue('criticidad', e.target.value, { shouldValidate: true })}
          />
        )}
        {form.formState.errors.criticidad && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.criticidad.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Stack tecnológico</label>
        <Textarea
          className="mt-1"
          rows={2}
          value={form.watch('tecnologia_stack') ?? ''}
          onChange={(e) => form.setValue('tecnologia_stack', e.target.value || null, { shouldValidate: true })}
          placeholder="Java/Spring, Node, .NET, etc."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !form.watch('criticidad')?.trim()}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function ServiciosPage() {
  const { data: rows, isLoading, isError } = useServicios();
  const { data: subdirs } = useSubdireccions();
  const { data: gerencias } = useGerencias();
  const { data: orgs } = useOrganizacions();
  const { data: celulas } = useCelulas();
  const [q, setQ] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [gerenciaF, setGerenciaF] = useState<string>(ALL);
  const [orgF, setOrgF] = useState<string>(ALL);
  const [celulaF, setCelulaF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Servicio | null>(null);
  const deleteMut = useDeleteServicio();

  const subdirName = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subdirs || []) m.set(s.id, s.nombre);
    return m;
  }, [subdirs]);
  const gerName = useMemo(() => {
    const m = new Map<string, { nombre: string; subdireccion_id: string }>();
    for (const g of gerencias || [])
      m.set(g.id, { nombre: g.nombre, subdireccion_id: g.subdireccion_id });
    return m;
  }, [gerencias]);
  const orgName = useMemo(() => {
    const m = new Map<string, { nombre: string; gerencia_id: string }>();
    for (const o of orgs || []) m.set(o.id, { nombre: o.nombre, gerencia_id: o.gerencia_id });
    return m;
  }, [orgs]);

  const filteredOrgs = useMemo(() => {
    const gids = orgF === ALL ? (gerenciaF === ALL ? null : [gerenciaF]) : [gerenciaF];
    if (gids) return (orgs || []).filter((o) => gids!.includes(o.gerencia_id));
    if (gerenciaF === ALL) return orgs || [];
    return (orgs || []).filter((o) => o.gerencia_id === gerenciaF);
  }, [orgs, orgF, gerenciaF]);

  const filteredCelulas = useMemo(() => {
    if (orgF === ALL) {
      if (gerenciaF === ALL) return celulas || [];
      return (celulas || []).filter((c) => {
        const o = orgName.get(c.organizacion_id);
        if (!o) return false;
        return o.gerencia_id === gerenciaF;
      });
    }
    return (celulas || []).filter((c) => c.organizacion_id === orgF);
  }, [celulas, orgF, gerenciaF, orgName]);

  const celulaFormOptions = useMemo(() => {
    const fromFilter = (filteredCelulas ?? []).map((c) => {
      const org = orgName.get(c.organizacion_id);
      return { value: c.id, label: org ? `${org.nombre} / ${c.nombre}` : c.nombre };
    });
    if (edit) {
      const c = celulas?.find((x) => x.id === edit.celula_id);
      if (c && !fromFilter.some((o) => o.value === c.id)) {
        const org = orgName.get(c.organizacion_id);
        return [
          { value: c.id, label: org ? `${org.nombre} / ${c.nombre}` : c.nombre },
          ...fromFilter,
        ];
      }
    }
    return fromFilter;
  }, [filteredCelulas, orgName, edit, celulas]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (celulaF === ALL ? true : r.celula_id === celulaF))
      .filter((r) => {
        if (!s) return true;
        const cname = celulas?.find((c) => c.id === r.celula_id)?.nombre ?? '';
        return (
          r.nombre.toLowerCase().includes(s) ||
          cname.toLowerCase().includes(s) ||
          r.criticidad.toLowerCase().includes(s) ||
          (r.tecnologia_stack && r.tecnologia_stack.toLowerCase().includes(s)) ||
          (r.descripcion && r.descripcion.toLowerCase().includes(s))
        );
      });
  }, [rows, q, celulaF, celulas]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const cmp = a.nombre.localeCompare(b.nombre, 'es');
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [filtered, sortDesc]);

  const list = useClientPagedList(sorted, [q, celulaF, orgF, gerenciaF, sortDesc]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Servicios (catálogo)"
        description="Aplicación o servicio bajo una célula; base para liberaciones, revisiones y programas."
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CatalogCsvToolbar
            basePath="/servicios"
            exportFileName="servicios.csv"
            templateFileName="servicios_import_template.csv"
            invalidateQueries={[['servicios']]}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!celulaFormOptions.length}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo servicio</DialogTitle>
              </DialogHeader>
              <ServicioForm onSuccess={() => setCreateOpen(false)} celulaOptions={celulaFormOptions} />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <Server className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} servicio(s) · Cada uno pertenece a una célula
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
            <div>
              <label className="text-sm font-medium">Gerencia</label>
              <Select
                className="mt-1"
                value={gerenciaF}
                onChange={(e) => {
                  setGerenciaF(e.target.value);
                  setOrgF(ALL);
                  setCelulaF(ALL);
                }}
                options={[
                  { value: ALL, label: 'Todas' },
                  ...(gerencias || []).map((g) => ({ value: g.id, label: g.nombre })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Organización</label>
              <Select
                className="mt-1"
                value={orgF}
                onChange={(e) => {
                  setOrgF(e.target.value);
                  setCelulaF(ALL);
                }}
                options={[
                  { value: ALL, label: 'Todas' },
                  ...filteredOrgs.map((o) => {
                    const g = gerName.get(o.gerencia_id);
                    return { value: o.id, label: g ? `${g.nombre} / ${o.nombre}` : o.nombre };
                  }),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Célula (filtro)</label>
              <Select
                className="mt-1"
                value={celulaF}
                onChange={(e) => setCelulaF(e.target.value)}
                options={[
                  { value: ALL, label: 'Todas' },
                  ...filteredCelulas.map((c) => {
                    const org = orgName.get(c.organizacion_id);
                    return { value: c.id, label: org ? `${org.nombre} / ${c.nombre}` : c.nombre };
                  }),
                ]}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end max-w-4xl">
            <div className="max-w-md flex-1">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                className="mt-1"
                placeholder="Nombre, stack, célula, criticidad…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSortDesc((v) => !v)}>
              {sortDesc ? <ArrowDownAZ className="mr-2 h-4 w-4" /> : <ArrowUpAZ className="mr-2 h-4 w-4" />}
              Orden nombre: {sortDesc ? 'Z-A' : 'A-Z'}
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-destructive">No se pudo cargar el catálogo.</p>}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay servicios. Crea células y define un servicio.</p>
          )}
          {list.total > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Criticidad</DataTableTh>
                  <DataTableTh>Célula / jerarquía</DataTableTh>
                  <DataTableTh>Stack</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.paged.map((r) => {
                  const c = celulas?.find((x) => x.id === r.celula_id);
                  const o = c ? orgName.get(c.organizacion_id) : undefined;
                  const g = o ? gerName.get(o.gerencia_id) : undefined;
                  const s = g ? subdirName.get(g.subdireccion_id) : undefined;
                  return (
                    <DataTableRow key={r.id}>
                      <DataTableCell className="font-medium max-w-[200px]">
                        <div className="truncate" title={r.nombre}>
                          {r.nombre}
                        </div>
                        {r.descripcion && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{r.descripcion}</div>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="primary">{r.criticidad}</Badge>
                      </DataTableCell>
                      <DataTableCell>
                        {c && o && g ? (
                          <div className="text-sm">
                            <div className="font-medium">{c.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {o.nombre} · {g.nombre} · {s ?? '—'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </DataTableCell>
                      <DataTableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                        <span title={r.tecnologia_stack ?? ''}>{r.tecnologia_stack ?? '—'}</span>
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
                                <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  No podrás si hay liberaciones u otros datos asociados (restricción de API).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteMut.mutate(r.id, {
                                      onSuccess: () => toast.success('Eliminado'),
                                      onError: (e) => {
                                        logger.error('servicio.delete.failed', { id: r.id, error: e });
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
          <CatalogPaginationBar
            page={list.page}
            pageCount={list.pageCount}
            total={list.total}
            from={list.from}
            to={list.to}
            pageSize={list.pageSize}
            onPageChange={list.setPage}
            onPageSizeChange={(n) => {
              list.setPageSize(n);
              list.setPage(0);
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar servicio</DialogTitle>
          </DialogHeader>
          {edit && (
            <ServicioForm
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
