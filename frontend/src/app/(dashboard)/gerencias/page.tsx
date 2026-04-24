'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  useCreateGerencia,
  useDeleteGerencia,
  useGerencias,
  useUpdateGerencia,
} from '@/hooks/useGerencias';
import { useSubdireccions } from '@/hooks/useSubdireccions';
import { GerenciaCreateSchema, type Gerencia, type GerenciaCreate } from '@/lib/schemas/gerencia.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = GerenciaCreateSchema;
type FormData = z.infer<typeof formSchema>;

function GerenciaForm({
  initial,
  onSuccess,
}: {
  initial?: Gerencia | null;
  onSuccess: () => void;
}) {
  const { data: subdireccions } = useSubdireccions();
  const createMut = useCreateGerencia();
  const updateMut = useUpdateGerencia();
  const isEdit = Boolean(initial);
  const subOptions = (subdireccions ?? []).map((s) => ({ value: s.id, label: `${s.nombre} (${s.codigo})` }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          subdireccion_id: initial.subdireccion_id,
          descripcion: initial.descripcion ?? null,
        }
      : {
          nombre: '',
          subdireccion_id: subOptions[0]?.value ?? '',
          descripcion: null,
        },
  });

  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: GerenciaCreate = {
      nombre: data.nombre.trim(),
      subdireccion_id: data.subdireccion_id,
      descripcion: data.descripcion?.trim() || null,
    };
    if (isEdit && initial) {
      updateMut.mutate(
        { id: initial.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Gerencia actualizada');
            onSuccess();
          },
          onError: (e) => toast.error(extractErrorMessage(e, 'Error al guardar')),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Gerencia creada');
          onSuccess();
        },
        onError: (e) => toast.error(extractErrorMessage(e, 'Error al crear')),
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Subdirección</label>
        <Select
          className="mt-1"
          value={form.watch('subdireccion_id')}
          onChange={(e) => form.setValue('subdireccion_id', e.target.value, { shouldValidate: true })}
          options={subOptions}
          placeholder="Selecciona subdirección"
        />
        {form.formState.errors.subdireccion_id && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.subdireccion_id.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Nombre de la gerencia</label>
        <Input className="mt-1" {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.nombre.message}</p>
        )}
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

export default function GerenciasPage() {
  const { data: rows, isLoading, isError } = useGerencias();
  const { data: subdireccions } = useSubdireccions();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Gerencia | null>(null);
  const deleteMut = useDeleteGerencia();

  const subById = useMemo(
    () => new Map((subdireccions ?? []).map((s) => [s.id, s])),
    [subdireccions],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter((r) => {
      const sub = subById.get(r.subdireccion_id);
      const subLabel = sub ? `${sub.nombre} ${sub.codigo}`.toLowerCase() : '';
      return r.nombre.toLowerCase().includes(n) || (r.descripcion && r.descripcion.toLowerCase().includes(n)) || subLabel.includes(n);
    });
  }, [rows, q, subById]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Gerencias"
        description="BRD §3.1 — N gerencias por subdirección. Define nombre y vinculación a subdirección."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva gerencia</DialogTitle>
            </DialogHeader>
            <GerenciaForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 max-w-md">
            <label className="text-sm font-medium">Buscar</label>
            <Input
              className="mt-1"
              placeholder="Nombre, descripción o subdirección…"
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
            <p className="text-muted-foreground">No hay gerencias. Crea una o primero defina subdirecciones.</p>
          )}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Subdirección</DataTableTh>
                  <DataTableTh>Descripción</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[120px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">
                      {subById.get(item.subdireccion_id)?.nombre ?? item.subdireccion_id.slice(0, 8)}
                    </DataTableCell>
                    <DataTableCell className="max-w-xs truncate text-sm text-muted-foreground">
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
                            <Button type="button" variant="ghost" size="xs">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar gerencia?</AlertDialogTitle>
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
        </CardContent>
      </Card>

      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar gerencia</DialogTitle>
          </DialogHeader>
          {edit && <GerenciaForm key={edit.id} initial={edit} onSuccess={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
