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
  useControlSeguridads,
  useCreateControlSeguridad,
  useDeleteControlSeguridad,
  useUpdateControlSeguridad,
} from '@/hooks/useControlSeguridads';
import { useClientPagedList } from '@/hooks/useClientPagedList';
import { logger } from '@/lib/logger';
import {
  ControlSeguridadCreateSchema,
  type ControlSeguridad,
  type ControlSeguridadCreate,
} from '@/lib/schemas/control_seguridad.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = ControlSeguridadCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({ initial, onSuccess }: { initial?: ControlSeguridad | null; onSuccess: () => void }) {
  const createMut = useCreateControlSeguridad();
  const updateMut = useUpdateControlSeguridad();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          tipo: initial.tipo,
          descripcion: initial.descripcion ?? null,
          obligatorio: initial.obligatorio,
        }
      : { nombre: '', tipo: '', descripcion: null, obligatorio: false },
  });
  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: ControlSeguridadCreate = {
      nombre: data.nombre.trim(),
      tipo: data.tipo.trim(),
      descripcion: data.descripcion?.trim() || null,
      obligatorio: data.obligatorio,
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
            logger.error('control_seguridad.update.failed', { id: initial.id, error: e });
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
          logger.error('control_seguridad.create.failed', { error: e });
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
        <label className="text-sm font-medium">Tipo</label>
        <Input className="mt-1" {...form.register('tipo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} {...form.register('descripcion')} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" className="h-4 w-4" {...form.register('obligatorio')} />
        <span className="text-sm">Obligatorio</span>
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

export default function ControlSeguridadsPage() {
  const { data: rows, isLoading, isError } = useControlSeguridads();
  const [q, setQ] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<ControlSeguridad | null>(null);
  const deleteMut = useDeleteControlSeguridad();

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) => r.nombre.toLowerCase().includes(n) || r.tipo.toLowerCase().includes(n),
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
      <PageHeader title="Controles de seguridad" description="Catálogo de controles.">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CatalogCsvToolbar
            basePath="/control_seguridads"
            exportFileName="control_seguridads.csv"
            templateFileName="control_seguridads_import_template.csv"
            invalidateQueries={[['control_seguridads']]}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo control</DialogTitle>
              </DialogHeader>
              <FormFields onSuccess={() => setCreateOpen(false)} />
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
                placeholder="Nombre, tipo…"
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
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin datos.</p>}
          {list.total > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Oblig.</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[120px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {list.paged.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell>{item.tipo}</DataTableCell>
                    <DataTableCell>{item.obligatorio ? 'Sí' : 'No'}</DataTableCell>
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
                              <AlertDialogTitle>¿Eliminar control?</AlertDialogTitle>
                              <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(item.id, {
                                    onSuccess: () => toast.success('Eliminado'),
                                    onError: (e) => {
                                      logger.error('control_seguridad.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar control</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
