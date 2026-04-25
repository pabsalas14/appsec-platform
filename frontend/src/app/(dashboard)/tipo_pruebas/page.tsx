'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownAZ, ArrowUpAZ, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
  useCreateTipoPrueba,
  useDeleteTipoPrueba,
  useTipoPruebas,
  useUpdateTipoPrueba,
} from '@/hooks/useTipoPruebas';
import { useClientPagedList } from '@/hooks/useClientPagedList';
import { logger } from '@/lib/logger';
import { TipoPruebaCreateSchema, type TipoPrueba, type TipoPruebaCreate } from '@/lib/schemas/tipo_prueba.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';
import { z } from 'zod';

const formSchema = TipoPruebaCreateSchema;
type FormData = z.infer<typeof formSchema>;

function TipoPruebaForm({
  initial,
  onSuccess,
}: {
  initial?: TipoPrueba | null;
  onSuccess: () => void;
}) {
  const createMut = useCreateTipoPrueba();
  const updateMut = useUpdateTipoPrueba();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          categoria: initial.categoria,
          descripcion: initial.descripcion ?? null,
        }
      : { nombre: '', categoria: '', descripcion: null },
  });
  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: TipoPruebaCreate = {
      nombre: data.nombre.trim(),
      categoria: data.categoria.trim(),
      descripcion: data.descripcion?.trim() || null,
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
            logger.error('tipo_prueba.update.failed', { id: initial.id, error: e });
            toast.error(extractErrorMessage(e, 'Error al guardar'));
          },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Creado');
          onSuccess();
        },
        onError: (e) => {
          logger.error('tipo_prueba.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input className="mt-1" {...form.register('nombre')} />
      </div>
      <div>
        <label className="text-sm font-medium">Categoría</label>
        <Input className="mt-1" {...form.register('categoria')} />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} {...form.register('descripcion')} />
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

export default function TipoPruebasPage() {
  const { data: rows, isLoading, isError } = useTipoPruebas();
  const [q, setQ] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<TipoPrueba | null>(null);
  const deleteMut = useDeleteTipoPrueba();

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.nombre.toLowerCase().includes(n) ||
        r.categoria.toLowerCase().includes(n) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(n)),
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
      <PageHeader title="Tipos de prueba" description="Catálogo de tipos y categorías de prueba.">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CatalogCsvToolbar
            basePath="/tipo_pruebas"
            exportFileName="tipo_pruebas.csv"
            templateFileName="tipo_pruebas_import_template.csv"
            invalidateQueries={[['tipo_pruebas']]}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo tipo de prueba</DialogTitle>
              </DialogHeader>
              <TipoPruebaForm onSuccess={() => setCreateOpen(false)} />
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
                placeholder="Nombre, categoría…"
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
            <p className="text-muted-foreground">No hay registros. Crea el primero con «Nueva».</p>
          )}
          {list.total > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Categoría</DataTableTh>
                  <DataTableTh>Descripción</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[120px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.paged.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell>{item.categoria}</DataTableCell>
                    <DataTableCell className="max-w-xs truncate text-muted-foreground text-sm">
                      {item.descripcion ?? '—'}
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
                            <Button type="button" variant="ghost" size="xs" aria-label="Eliminar">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(item.id, {
                                    onSuccess: () => toast.success('Eliminado'),
                                    onError: (e) => {
                                      logger.error('tipo_prueba.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar tipo de prueba</DialogTitle>
          </DialogHeader>
          {edit && <TipoPruebaForm key={edit.id} initial={edit} onSuccess={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
