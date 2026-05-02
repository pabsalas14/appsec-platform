'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownAZ, ArrowUpAZ, ExternalLink, Link2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
} from '@/components/ui';
import { CatalogCsvToolbar } from '@/components/catalog/CatalogCsvToolbar';
import { CatalogPaginationBar } from '@/components/catalog/CatalogPaginationBar';
import { useCelulas } from '@/hooks/useCelulas';
import {
  useActivoWebs,
  useCreateActivoWeb,
  useDeleteActivoWeb,
  useUpdateActivoWeb,
} from '@/hooks/useActivoWebs';
import { useGerencias } from '@/hooks/useGerencias';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { useSubdireccions } from '@/hooks/useSubdireccions';
import { useClientPagedList } from '@/hooks/useClientPagedList';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { logger } from '@/lib/logger';
import {
  ActivoWebCreateSchema,
  type ActivoWeb,
  type ActivoWebCreate,
  type ActivoWebUpdate,
} from '@/lib/schemas/activo_web.schema';
import { cn, extractErrorMessage, formatDate } from '@/lib/utils';

const AMBIENTES: { value: string; label: string }[] = [
  { value: 'produccion', label: 'Producción' },
  { value: 'staging', label: 'Staging' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'pruebas', label: 'Pruebas' },
  { value: 'otro', label: 'Otro' },
];

const TIPOS: { value: string; label: string }[] = [
  { value: 'web', label: 'Aplicación web' },
  { value: 'api', label: 'API' },
  { value: 'mobile', label: 'Móvil' },
  { value: 'desktop', label: 'Escritorio' },
  { value: 'otro', label: 'Otro' },
];

const ALL = '' as const;

const emptyCreate: ActivoWebCreate = {
  nombre: '',
  url: 'https://',
  ambiente: 'produccion',
  tipo: 'web',
  celula_id: '',
};

function ambienteLabel(v: string) {
  return AMBIENTES.find((a) => a.value === v)?.label ?? v;
}

function tipoLabel(v: string) {
  return TIPOS.find((t) => t.value === v)?.label ?? v;
}

function ActivoWebForm({
  initial,
  onSuccess,
  celulaOptions,
}: {
  initial?: ActivoWeb | null;
  onSuccess: () => void;
  celulaOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateActivoWeb();
  const updateMut = useUpdateActivoWeb();
  const isEdit = Boolean(initial);
  const form = useForm<ActivoWebCreate>({
    resolver: zodResolver(ActivoWebCreateSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          url: initial.url,
          ambiente: initial.ambiente,
          tipo: initial.tipo,
          celula_id: initial.celula_id,
        }
      : {
          ...emptyCreate,
          celula_id: celulaOptions[0]?.value ?? '',
        },
  });

  const wAmb = useWatch({ control: form.control, name: 'ambiente' });
  const wTip = useWatch({ control: form.control, name: 'tipo' });
  const ambienteOpts = useMemo(() => {
    const inList = AMBIENTES.some((a) => a.value === wAmb);
    if (wAmb && !inList) {
      return [{ value: wAmb, label: wAmb }, ...AMBIENTES];
    }
    return AMBIENTES;
  }, [wAmb]);
  const tipoOpts = useMemo(() => {
    const inList = TIPOS.some((t) => t.value === wTip);
    if (wTip && !inList) {
      return [{ value: wTip, label: wTip }, ...TIPOS];
    }
    return TIPOS;
  }, [wTip]);

  const pending = createMut.isPending || updateMut.isPending;
  useUnsavedChanges(form.formState.isDirty);

  const onSubmit = form.handleSubmit((data) => {
    const payload: ActivoWebCreate = {
      nombre: data.nombre.trim(),
      url: data.url.trim(),
      ambiente: data.ambiente,
      tipo: data.tipo,
      celula_id: data.celula_id,
    };
    if (isEdit && initial) {
      const patch: ActivoWebUpdate = {};
      if (payload.nombre !== initial.nombre) patch.nombre = payload.nombre;
      if (payload.url !== initial.url) patch.url = payload.url;
      if (payload.ambiente !== initial.ambiente) patch.ambiente = payload.ambiente;
      if (payload.tipo !== initial.tipo) patch.tipo = payload.tipo;
      if (payload.celula_id !== initial.celula_id) patch.celula_id = payload.celula_id;
      if (Object.keys(patch).length === 0) {
        onSuccess();
        return;
      }
      updateMut.mutate(
        { id: initial.id, ...patch },
        {
          onSuccess: () => {
            toast.success('Activo web actualizado');
            onSuccess();
          },
          onError: (e) => {
            logger.error('activo_web.update.failed', { id: String(initial.id), error: e });
            toast.error(extractErrorMessage(e, 'Error al guardar'));
          },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Activo web creado');
          onSuccess();
        },
        onError: (e) => {
          logger.error('activo_web.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Célula</label>
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
        <label className="text-sm font-medium">Nombre</label>
        <Input className="mt-1" maxLength={500} {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">URL</label>
        <Input className="mt-1" type="url" placeholder="https://…" {...form.register('url')} />
        {form.formState.errors.url && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.url.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Ambiente</label>
        <Select
          className="mt-1"
          value={form.watch('ambiente')}
          onChange={(e) => form.setValue('ambiente', e.target.value, { shouldValidate: true })}
          options={ambienteOpts}
        />
        {form.formState.errors.ambiente && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.ambiente.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Tipo</label>
        <Select
          className="mt-1"
          value={form.watch('tipo')}
          onChange={(e) => form.setValue('tipo', e.target.value, { shouldValidate: true })}
          options={tipoOpts}
        />
        {form.formState.errors.tipo && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.tipo.message}</p>
        )}
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

export default function ActivoWebsPage() {
  const { data: rows, isLoading, isError, error: loadError } = useActivoWebs();
  const { data: subdirs } = useSubdireccions();
  const { data: gerencias } = useGerencias();
  const { data: orgs } = useOrganizacions();
  const { data: celulas } = useCelulas();
  const [q, setQ] = useState('');
  const [nombreOrderDesc, setNombreOrderDesc] = useState(false);
  const [gerenciaF, setGerenciaF] = useState<string>(ALL);
  const [orgF, setOrgF] = useState<string>(ALL);
  const [celulaF, setCelulaF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<ActivoWeb | null>(null);
  const deleteMut = useDeleteActivoWeb();

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
    for (const o of orgs || [])
      m.set(o.id, { nombre: o.nombre, gerencia_id: o.gerencia_id });
    return m;
  }, [orgs]);
  const celulaShort = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of celulas || []) m.set(c.id, c.nombre);
    return m;
  }, [celulas]);

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
      const o = orgName.get(c.organizacion_id);
      return {
        value: c.id,
        label: o ? `${o.nombre} / ${c.nombre}` : c.nombre,
      };
    });
    if (edit) {
      const c = celulas?.find((x) => x.id === edit.celula_id);
      if (c && !fromFilter.some((o) => o.value === c.id)) {
        const o = orgName.get(c.organizacion_id);
        return [
          { value: c.id, label: o ? `${o.nombre} / ${c.nombre}` : c.nombre },
          ...fromFilter,
        ];
      }
    }
    return fromFilter;
  }, [filteredCelulas, orgName, edit, celulas]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((a) => (celulaF === ALL ? true : a.celula_id === celulaF))
      .filter((a) => {
        if (!s) return true;
        const cname = (celulaShort.get(a.celula_id) || '').toLowerCase();
        return (
          a.nombre.toLowerCase().includes(s) ||
          cname.includes(s) ||
          a.ambiente.toLowerCase().includes(s) ||
          a.tipo.toLowerCase().includes(s) ||
          a.url.toLowerCase().includes(s)
        );
      });
  }, [rows, q, celulaF, celulaShort]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const cmp = a.nombre.localeCompare(b.nombre, 'es');
      return nombreOrderDesc ? -cmp : cmp;
    });
    return list;
  }, [filtered, nombreOrderDesc]);

  const list = useClientPagedList(sorted, [q, nombreOrderDesc, celulaF, gerenciaF, orgF]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Activos web"
        description="Expuestos vía URL, asignados a célula; base para riesgo y pruebas de seguridad."
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CatalogCsvToolbar
            basePath="/activo_webs"
            exportFileName="activo_webs.csv"
            templateFileName="activo_webs_import_template.csv"
            invalidateQueries={[['activo_webs']]}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo activo web</DialogTitle>
              </DialogHeader>
              <ActivoWebForm
                onSuccess={() => setCreateOpen(false)}
                celulaOptions={celulaFormOptions}
              />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <Link2 className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} activo(s) · Misma jerarquía org que repositorios
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
                    const o = orgName.get(c.organizacion_id);
                    return { value: c.id, label: o ? `${o.nombre} / ${c.nombre}` : c.nombre };
                  }),
                ]}
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">Gerencia (chips)</p>
            <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setGerenciaF(ALL);
                  setOrgF(ALL);
                  setCelulaF(ALL);
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  gerenciaF === ALL
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                )}
              >
                Todas
              </button>
              {(gerencias || []).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGerenciaF(g.id);
                    setOrgF(ALL);
                    setCelulaF(ALL);
                  }}
                  className={cn(
                    'max-w-[240px] truncate rounded-full border px-3 py-1 text-xs transition-colors',
                    gerenciaF === g.id
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                  )}
                  title={g.nombre}
                >
                  {g.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="max-w-md flex-1">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                className="mt-1"
                placeholder="Nombre, URL, ambiente, tipo…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setNombreOrderDesc((v) => !v)}>
              {nombreOrderDesc ? <ArrowDownAZ className="mr-2 h-4 w-4" /> : <ArrowUpAZ className="mr-2 h-4 w-4" />}
              Orden: {nombreOrderDesc ? 'Z-A' : 'A-Z'}
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {extractErrorMessage(loadError, 'No se pudo cargar el catálogo de activos web.')}
            </p>
          )}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay activos web. Crea uno o defina células primero.</p>
          )}
          {list.total > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Ambiente</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>URL</DataTableTh>
                  <DataTableTh>Célula / jerarquía</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.paged.map((a) => {
                  const c = celulas?.find((x) => x.id === a.celula_id);
                  const o = c ? orgName.get(c.organizacion_id) : undefined;
                  const g = o ? gerName.get(o.gerencia_id) : undefined;
                  const s = g ? subdirName.get(g.subdireccion_id) : undefined;
                  return (
                    <DataTableRow key={a.id}>
                      <DataTableCell className="font-medium">
                        <Link href={`/activo_webs/${a.id}`} className="hover:text-primary hover:underline">
                          {a.nombre}
                        </Link>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="default">{ambienteLabel(a.ambiente)}</Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="primary">{tipoLabel(a.tipo)}</Badge>
                      </DataTableCell>
                      <DataTableCell className="max-w-[200px] truncate text-sm">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1 hover:underline"
                        >
                          {a.url} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </DataTableCell>
                      <DataTableCell>
                        {c && o && g ? (
                          <div className="text-sm">
                            <div className="font-medium">{c.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {o.nombre} · {g.nombre} · {s || '—'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(a.updated_at)}
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="xs" onClick={() => setEdit(a)}>
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
                                <AlertDialogTitle>¿Eliminar activo web?</AlertDialogTitle>
                                <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteMut.mutate(a.id, {
                                      onSuccess: () => toast.success('Eliminado'),
                                      onError: (e) => {
                                        logger.error('activo_web.delete.failed', { id: a.id, error: e });
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
            <DialogTitle>Editar activo web</DialogTitle>
          </DialogHeader>
          {edit && (
            <ActivoWebForm
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
