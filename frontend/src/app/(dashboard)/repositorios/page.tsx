'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Download, ExternalLink, FileSpreadsheet, GitBranch, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  Switch,
} from '@/components/ui';
import { useCelulas } from '@/hooks/useCelulas';
import {
  useCreateRepositorio,
  useDeleteRepositorio,
  useRepositorios,
  useUpdateRepositorio,
} from '@/hooks/useRepositorios';
import { useGerencias } from '@/hooks/useGerencias';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { useSubdireccions } from '@/hooks/useSubdireccions';
import { downloadCsvFromApi, importCsvToApi } from '@/lib/csvDownload';
import { logger } from '@/lib/logger';
import {
  RepositorioCreateSchema,
  type Repositorio,
  type RepositorioCreate,
  type RepositorioUpdate,
} from '@/lib/schemas/repositorio.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const PLATFORMS = ['GitHub', 'GitLab', 'Bitbucket', 'Azure DevOps', 'Otro'] as const;

const ALL = '' as const;

const emptyCreate: RepositorioCreate = {
  nombre: '',
  url: 'https://',
  plataforma: 'GitHub',
  rama_default: 'main',
  activo: true,
  celula_id: '',
};

function RepositorioForm({
  initial,
  onSuccess,
  celulaOptions,
}: {
  initial?: Repositorio | null;
  onSuccess: () => void;
  celulaOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateRepositorio();
  const updateMut = useUpdateRepositorio();
  const isEdit = Boolean(initial);
  const form = useForm<RepositorioCreate>({
    resolver: zodResolver(RepositorioCreateSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          url: initial.url,
          plataforma: initial.plataforma,
          rama_default: initial.rama_default,
          activo: initial.activo,
          celula_id: initial.celula_id,
        }
      : {
          ...emptyCreate,
          celula_id: celulaOptions[0]?.value ?? '',
        },
  });

  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: RepositorioCreate = {
      nombre: data.nombre.trim(),
      url: data.url.trim(),
      plataforma: data.plataforma,
      rama_default: data.rama_default.trim(),
      activo: data.activo,
      celula_id: data.celula_id,
    };
    if (isEdit && initial) {
      const patch: RepositorioUpdate = {};
      if (payload.nombre !== initial.nombre) patch.nombre = payload.nombre;
      if (payload.url !== initial.url) patch.url = payload.url;
      if (payload.plataforma !== initial.plataforma) patch.plataforma = payload.plataforma;
      if (payload.rama_default !== initial.rama_default) patch.rama_default = payload.rama_default;
      if (payload.activo !== initial.activo) patch.activo = payload.activo;
      if (payload.celula_id !== initial.celula_id) patch.celula_id = payload.celula_id;
      if (Object.keys(patch).length === 0) {
        onSuccess();
        return;
      }
      updateMut.mutate(
        { id: initial.id, ...patch },
        {
          onSuccess: () => {
            toast.success('Repositorio actualizado');
            onSuccess();
          },
          onError: (e) => {
            const msg = extractErrorMessage(e, 'Error al guardar');
            logger.error('repositorio.update.failed', { id: String(initial.id), error: e });
            toast.error(msg);
          },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Repositorio creado');
          onSuccess();
        },
        onError: (e) => {
          logger.error('repositorio.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  const platformOptions = PLATFORMS.map((p) => ({ value: p, label: p }));

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
        <Input className="mt-1" type="url" placeholder="https://github.com/…" {...form.register('url')} />
        {form.formState.errors.url && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.url.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Plataforma</label>
        <Select
          className="mt-1"
          value={form.watch('plataforma')}
          onChange={(e) => form.setValue('plataforma', e.target.value, { shouldValidate: true })}
          options={platformOptions}
        />
        {form.formState.errors.plataforma && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.plataforma.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Rama por defecto</label>
        <Input className="mt-1" placeholder="main" {...form.register('rama_default')} />
        {form.formState.errors.rama_default && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.rama_default.message}</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 rounded-md border border-white/10 p-3">
        <div>
          <p className="text-sm font-medium">Activo en inventario</p>
          <p className="text-xs text-muted-foreground">Incluido en priorización y escaneo cuando aplique</p>
        </div>
        <Switch
          checked={form.watch('activo')}
          onCheckedChange={(v) => form.setValue('activo', v, { shouldValidate: true })}
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

export default function RepositoriosPage() {
  const qc = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [csvBusy, setCsvBusy] = useState(false);
  const { data: rows, isLoading, isError } = useRepositorios();
  const { data: subdirs } = useSubdireccions();
  const { data: gerencias } = useGerencias();
  const { data: orgs } = useOrganizacions();
  const { data: celulas } = useCelulas();
  const [q, setQ] = useState('');
  const [gerenciaF, setGerenciaF] = useState<string>(ALL);
  const [orgF, setOrgF] = useState<string>(ALL);
  const [celulaF, setCelulaF] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Repositorio | null>(null);
  const deleteMut = useDeleteRepositorio();

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

  const onExportCsv = async () => {
    try {
      await downloadCsvFromApi('/repositorios/export.csv', 'repositorios.csv');
      toast.success('CSV exportado');
    } catch (e) {
      logger.error('repositorio.csv_export.failed', { error: e });
      toast.error(extractErrorMessage(e, 'No se pudo exportar'));
    }
  };

  const onTemplateCsv = async () => {
    try {
      await downloadCsvFromApi('/repositorios/import-template.csv', 'repositorios_import_template.csv');
      toast.success('Plantilla descargada');
    } catch (e) {
      logger.error('repositorio.csv_template.failed', { error: e });
      toast.error(extractErrorMessage(e, 'No se pudo descargar la plantilla'));
    }
  };

  const onPickImport = () => importInputRef.current?.click();

  const onImportFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setCsvBusy(true);
    try {
      await importCsvToApi('/repositorios/import', file);
      toast.success('Importación aplicada');
      await qc.invalidateQueries({ queryKey: ['repositorios'] });
    } catch (e) {
      logger.error('repositorio.csv_import.failed', { error: e });
      toast.error(extractErrorMessage(e, 'Error al importar'));
    } finally {
      setCsvBusy(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .filter((r) => (celulaF === ALL ? true : r.celula_id === celulaF))
      .filter((r) => {
        if (!s) return true;
        const cname = (celulaShort.get(r.celula_id) || '').toLowerCase();
        return (
          r.nombre.toLowerCase().includes(s) ||
          cname.includes(s) ||
          r.plataforma.toLowerCase().includes(s) ||
          (r.rama_default || '').toLowerCase().includes(s) ||
          r.url.toLowerCase().includes(s)
        );
      });
  }, [rows, q, celulaF, celulaShort]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Repositorios (BRD §3.2)"
        description="Código bajo célula; vinculado a riesgo y a ejecuciones (CI/CD) en fases posteriores."
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void onImportFile(e.target.files)}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => void onExportCsv()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void onTemplateCsv()}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Plantilla
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={csvBusy}
            onClick={onPickImport}
          >
            {csvBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Importar
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo repositorio</DialogTitle>
              </DialogHeader>
              <RepositorioForm
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
            <GitBranch className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} repositorio(s) · Filtro por jerarquía: Subdirección → Gerencia → Organización →
            Célula
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
          <div className="max-w-md">
            <label className="text-sm font-medium">Buscar</label>
            <Input
              className="mt-1"
              placeholder="Nombre, URL, plataforma, rama…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-destructive">No se pudo cargar el catálogo.</p>}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay repositorios. Crea uno o defina células primero.</p>
          )}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Plataforma</DataTableTh>
                  <DataTableTh>Rama</DataTableTh>
                  <DataTableTh>Activo</DataTableTh>
                  <DataTableTh>URL</DataTableTh>
                  <DataTableTh>Célula / jerarquía</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => {
                  const c = celulas?.find((x) => x.id === r.celula_id);
                  const o = c ? orgName.get(c.organizacion_id) : undefined;
                  const g = o ? gerName.get(o.gerencia_id) : undefined;
                  const s = g ? subdirName.get(g.subdireccion_id) : undefined;
                  return (
                    <DataTableRow key={r.id}>
                      <DataTableCell className="font-medium">{r.nombre}</DataTableCell>
                      <DataTableCell>
                        <Badge variant="primary">{r.plataforma}</Badge>
                      </DataTableCell>
                      <DataTableCell className="font-mono text-xs">{r.rama_default}</DataTableCell>
                      <DataTableCell>
                        <Badge variant={r.activo ? 'success' : 'default'}>
                          {r.activo ? 'Sí' : 'No'}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell className="max-w-[200px] truncate text-sm">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1 hover:underline"
                        >
                          {r.url} <ExternalLink className="h-3 w-3 shrink-0" />
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
                                <AlertDialogTitle>¿Eliminar repositorio?</AlertDialogTitle>
                                <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteMut.mutate(r.id, {
                                      onSuccess: () => toast.success('Eliminado'),
                                      onError: (e) => {
                                        logger.error('repositorio.delete.failed', { id: r.id, error: e });
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
            <DialogTitle>Editar repositorio</DialogTitle>
          </DialogHeader>
          {edit && (
            <RepositorioForm
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
