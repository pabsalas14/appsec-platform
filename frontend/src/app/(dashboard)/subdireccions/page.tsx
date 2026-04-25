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
  Textarea,
} from '@/components/ui';
import { CatalogCsvToolbar } from '@/components/catalog/CatalogCsvToolbar';
import { CatalogPaginationBar } from '@/components/catalog/CatalogPaginationBar';
import {
  useCreateSubdireccion,
  useDeleteSubdireccion,
  useSubdireccions,
  useUpdateSubdireccion,
} from '@/hooks/useSubdireccions';
import { useClientPagedList } from '@/hooks/useClientPagedList';
import { SubdireccionCreateSchema, type Subdireccion, type SubdireccionCreate } from '@/lib/schemas/subdireccion.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = SubdireccionCreateSchema;
type FormData = z.infer<typeof formSchema>;

function SubdireccionForm({
  initial,
  onSuccess,
}: {
  initial?: Subdireccion | null;
  onSuccess: () => void;
}) {
  const createMut = useCreateSubdireccion();
  const updateMut = useUpdateSubdireccion();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          codigo: initial.codigo,
          descripcion: initial.descripcion ?? null,
          director_nombre: initial.director_nombre ?? null,
          director_contacto: initial.director_contacto ?? null,
        }
      : {
          nombre: '',
          codigo: '',
          descripcion: null,
          director_nombre: null,
          director_contacto: null,
        },
  });

  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: SubdireccionCreate = {
      nombre: data.nombre,
      codigo: data.codigo,
      descripcion: data.descripcion?.trim() || null,
      director_nombre: data.director_nombre?.trim() || null,
      director_contacto: data.director_contacto?.trim() || null,
    };
    if (isEdit && initial) {
      updateMut.mutate(
        { id: initial.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Subdirección actualizada');
            onSuccess();
          },
          onError: (e) => toast.error(extractErrorMessage(e, 'Error al guardar')),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Subdirección creada');
          onSuccess();
        },
        onError: (e) => toast.error(extractErrorMessage(e, 'Error al crear')),
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input className="mt-1" {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Código</label>
        <Input className="mt-1" {...form.register('codigo')} />
        {form.formState.errors.codigo && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.codigo.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} {...form.register('descripcion')} />
      </div>
      <div>
        <label className="text-sm font-medium">Director (nombre)</label>
        <Input className="mt-1" {...form.register('director_nombre')} />
      </div>
      <div>
        <label className="text-sm font-medium">Director (contacto)</label>
        <Input className="mt-1" {...form.register('director_contacto')} />
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

export default function SubdireccionsPage() {
  const { data: rows, isLoading, isError } = useSubdireccions();
  const [q, setQ] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Subdireccion | null>(null);
  const deleteMut = useDeleteSubdireccion();

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.nombre.toLowerCase().includes(n) ||
        r.codigo.toLowerCase().includes(n) ||
        (r.director_nombre && r.director_nombre.toLowerCase().includes(n)),
    );
  }, [rows, q]);

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
        title="Subdirecciones"
        description="Catálogo BRD §3.1 — base de la jerarquía organizacional (subdirección, director, código)."
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CatalogCsvToolbar
            basePath="/subdireccions"
            exportFileName="subdirecciones.csv"
            templateFileName="subdirecciones_import_template.csv"
            invalidateQueries={[['subdireccions']]}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva subdirección</DialogTitle>
              </DialogHeader>
              <SubdireccionForm onSuccess={() => setCreateOpen(false)} />
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
                placeholder="Nombre, código o director…"
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
            <p className="text-muted-foreground">No hay subdirecciones. Crea la primera con el botón «Nueva».</p>
          )}
          {list.total > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Código</DataTableTh>
                  <DataTableTh>Director</DataTableTh>
                  <DataTableTh>Contacto</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[120px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.paged.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell>{item.codigo}</DataTableCell>
                    <DataTableCell>{item.director_nombre ?? '—'}</DataTableCell>
                    <DataTableCell className="max-w-[200px] truncate text-muted-foreground">
                      {item.director_contacto ?? '—'}
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(item.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          aria-label="Editar"
                          onClick={() => setEdit(item)}
                        >
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
                              <AlertDialogTitle>¿Eliminar subdirección?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
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
            <DialogTitle>Editar subdirección</DialogTitle>
          </DialogHeader>
          {edit && (
            <SubdireccionForm
              key={edit.id}
              initial={edit}
              onSuccess={() => setEdit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
