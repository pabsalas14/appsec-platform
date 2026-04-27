'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import {
  useCreateDireccion,
  useDeleteDireccion,
  useDireccions,
  useUpdateDireccion,
} from '@/hooks/useDireccions';
import { DireccionCreateSchema, type Direccion, type DireccionCreate } from '@/lib/schemas/direccion.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = DireccionCreateSchema;
type FormData = z.infer<typeof formSchema>;

function DireccionForm({ initial, onSuccess }: { initial?: Direccion | null; onSuccess: () => void }) {
  const createMut = useCreateDireccion();
  const updateMut = useUpdateDireccion();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? { nombre: initial.nombre, codigo: initial.codigo, descripcion: initial.descripcion ?? null }
      : { nombre: '', codigo: '', descripcion: null },
  });
  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: DireccionCreate = {
      nombre: data.nombre,
      codigo: data.codigo,
      descripcion: data.descripcion?.trim() || null,
    };
    if (isEdit && initial) {
      updateMut.mutate(
        { id: initial.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Dirección actualizada');
            onSuccess();
          },
          onError: (e) => toast.error(extractErrorMessage(e, 'Error al guardar')),
        },
      );
      return;
    }
    createMut.mutate(payload, {
      onSuccess: () => {
        toast.success('Dirección creada');
        onSuccess();
      },
      onError: (e) => toast.error(extractErrorMessage(e, 'Error al crear')),
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input className="mt-1" {...form.register('nombre')} />
      </div>
      <div>
        <label className="text-sm font-medium">Código</label>
        <Input className="mt-1" {...form.register('codigo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} {...form.register('descripcion')} />
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

export default function DireccionsPage() {
  const { data: rows, isLoading, isError } = useDireccions();
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Direccion | null>(null);
  const deleteMut = useDeleteDireccion();

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Direcciones" description="Nivel raíz de la jerarquía configurable.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva dirección</DialogTitle>
            </DialogHeader>
            <DireccionForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {isError && <p className="text-sm text-destructive">No se pudieron cargar direcciones.</p>}
          {!isLoading && !isError && (
            <DataTable>
              <DataTableHead>
                <DataTableTh>Nombre</DataTableTh>
                <DataTableTh>Código</DataTableTh>
                <DataTableTh>Creado</DataTableTh>
                <DataTableTh className="text-right">Acciones</DataTableTh>
              </DataTableHead>
              <DataTableBody>
                {(rows ?? []).map((row) => (
                  <DataTableRow key={row.id}>
                    <DataTableCell>{row.nombre}</DataTableCell>
                    <DataTableCell>{row.codigo}</DataTableCell>
                    <DataTableCell>{formatDate(row.created_at)}</DataTableCell>
                    <DataTableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={edit?.id === row.id} onOpenChange={(o) => setEdit(o ? row : null)}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="outline" aria-label="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar dirección</DialogTitle>
                            </DialogHeader>
                            <DireccionForm initial={row} onSuccess={() => setEdit(null)} />
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive" aria-label="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará {row.nombre} de forma lógica.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(row.id, {
                                    onSuccess: () => toast.success('Dirección eliminada'),
                                    onError: (e) => toast.error(extractErrorMessage(e, 'Error al eliminar')),
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
    </PageWrapper>
  );
}
