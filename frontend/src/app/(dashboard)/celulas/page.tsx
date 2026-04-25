'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownAZ, ArrowUpAZ, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
} from '@/components/ui';
import { CatalogCsvToolbar } from '@/components/catalog/CatalogCsvToolbar';
import { CatalogPaginationBar } from '@/components/catalog/CatalogPaginationBar';
import {
  useCelulas,
  useCreateCelula,
  useDeleteCelula,
  useUpdateCelula,
} from '@/hooks/useCelulas';
import { useClientPagedList } from '@/hooks/useClientPagedList';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { CelulaCreateSchema, type Celula, type CelulaCreate } from '@/lib/schemas/celula.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = CelulaCreateSchema;
type FormData = z.infer<typeof formSchema>;

function CelulaForm({
  initial,
  onSuccess,
}: {
  initial?: Celula | null;
  onSuccess: () => void;
}) {
  const { data: orgs } = useOrganizacions();
  const createMut = useCreateCelula();
  const updateMut = useUpdateCelula();
  const isEdit = Boolean(initial);
  const orgOptions = (orgs ?? []).map((o) => ({ value: o.id, label: `${o.nombre} (${o.codigo})` }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          tipo: initial.tipo,
          descripcion: initial.descripcion ?? null,
          organizacion_id: initial.organizacion_id,
        }
      : {
          nombre: '',
          tipo: 'equipo',
          descripcion: null,
          organizacion_id: orgOptions[0]?.value ?? '',
        },
  });

  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: CelulaCreate = {
      nombre: data.nombre.trim(),
      tipo: data.tipo.trim(),
      descripcion: data.descripcion?.trim() || null,
      organizacion_id: data.organizacion_id,
    };
    if (isEdit && initial) {
      updateMut.mutate(
        { id: initial.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Célula actualizada');
            onSuccess();
          },
          onError: (e) => toast.error(extractErrorMessage(e, 'Error al guardar')),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Célula creada');
          onSuccess();
        },
        onError: (e) => toast.error(extractErrorMessage(e, 'Error al crear')),
      });
    }
  });

  if (!orgOptions.length) {
    return (
      <p className="text-sm text-amber-600">Primero crea al menos una organización en /organizacions</p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Organización</label>
        <Select
          className="mt-1"
          value={form.watch('organizacion_id')}
          onChange={(e) => form.setValue('organizacion_id', e.target.value, { shouldValidate: true })}
          options={orgOptions}
          placeholder="Selecciona organización"
        />
        {form.formState.errors.organizacion_id && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.organizacion_id.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Nombre de la célula / equipo</label>
        <Input className="mt-1" {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Tipo</label>
        <Input
          className="mt-1"
          placeholder="p. ej. squad, célula, capa"
          {...form.register('tipo')}
        />
        {form.formState.errors.tipo && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.tipo.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Descripción / integrantes</label>
        <Textarea
          className="mt-1"
          rows={3}
          placeholder="Integrantes y roles (BRD §3.1)"
          {...form.register('descripcion')}
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

export default function CelulasPage() {
  const { data: rows, isLoading, isError } = useCelulas();
  const { data: orgs } = useOrganizacions();
  const [q, setQ] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Celula | null>(null);
  const deleteMut = useDeleteCelula();

  const orgById = useMemo(() => new Map((orgs ?? []).map((o) => [o.id, o])), [orgs]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter((r) => {
      const o = orgById.get(r.organizacion_id);
      return (
        r.nombre.toLowerCase().includes(n) ||
        r.tipo.toLowerCase().includes(n) ||
        (o && `${o.nombre} ${o.codigo}`.toLowerCase().includes(n)) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(n))
      );
    });
  }, [rows, q, orgById]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const cmp = a.nombre.localeCompare(b.nombre, 'es');
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [filtered, sortDesc]);

  const list = useClientPagedList(sorted, [q, sortDesc]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Células / equipos"
        description="BRD §3.1 — N células por organización. Líder, integrantes (texto) y tipo."
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CatalogCsvToolbar
            basePath="/celulas"
            exportFileName="celulas.csv"
            templateFileName="celulas_import_template.csv"
            invalidateQueries={[['celulas']]}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva célula</DialogTitle>
              </DialogHeader>
              <CelulaForm onSuccess={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="max-w-md flex-1">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                className="mt-1"
                placeholder="Nombre, tipo, organización…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSortDesc((v) => !v)}>
              {sortDesc ? <ArrowDownAZ className="mr-2 h-4 w-4" /> : <ArrowUpAZ className="mr-2 h-4 w-4" />}
              Orden: {sortDesc ? 'Z-A' : 'A-Z'}
            </Button>
          </div>
          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-destructive">No se pudo cargar el catálogo.</p>}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay células. Crea una organización primero.</p>
          )}
          {list.total > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Organización</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[120px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.paged.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell>{item.tipo}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">
                      {orgById.get(item.organizacion_id)?.nombre ?? '—'}
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(item.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="xs" onClick={() => setEdit(item)}>
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
                              <AlertDialogTitle>¿Eliminar célula?</AlertDialogTitle>
                              <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(item.id, {
                                    onSuccess: () => toast.success('Eliminada'),
                                    onError: (e) =>
                                      toast.error(extractErrorMessage(e, 'No se pudo eliminar')),
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
            <DialogTitle>Editar célula</DialogTitle>
          </DialogHeader>
          {edit && <CelulaForm key={edit.id} initial={edit} onSuccess={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
