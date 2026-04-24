'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@/components/ui';
import { useCelulas } from '@/hooks/useCelulas';
import {
  useAplicacionMovils,
  useCreateAplicacionMovil,
  useDeleteAplicacionMovil,
  useUpdateAplicacionMovil,
} from '@/hooks/useAplicacionMovils';
import { logger } from '@/lib/logger';
import { AplicacionMovilCreateSchema, type AplicacionMovil, type AplicacionMovilCreate } from '@/lib/schemas/aplicacion_movil.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = AplicacionMovilCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  celOptions,
}: {
  initial?: AplicacionMovil | null;
  onSuccess: () => void;
  celOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateAplicacionMovil();
  const updateMut = useUpdateAplicacionMovil();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          plataforma: initial.plataforma,
          bundle_id: initial.bundle_id,
          celula_id: initial.celula_id,
        }
      : {
          nombre: '',
          plataforma: 'iOS',
          bundle_id: '',
          celula_id: celOptions[0]?.value ?? '',
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!initial && celOptions[0] && !form.getValues('celula_id')) {
      form.setValue('celula_id', celOptions[0].value);
    }
  }, [initial, celOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const payload: AplicacionMovilCreate = {
      nombre: data.nombre.trim(),
      plataforma: data.plataforma.trim(),
      bundle_id: data.bundle_id.trim(),
      celula_id: data.celula_id,
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
            logger.error('aplicacion_movil.update.failed', { id: initial.id, error: e });
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
          logger.error('aplicacion_movil.create.failed', { error: e });
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
        <label className="text-sm font-medium">Plataforma</label>
        <Input className="mt-1" placeholder="iOS, Android…" {...form.register('plataforma')} />
      </div>
      <div>
        <label className="text-sm font-medium">Bundle ID</label>
        <Input className="mt-1" {...form.register('bundle_id')} />
      </div>
      <div>
        <label className="text-sm font-medium">Célula</label>
        <Select
          className="mt-1"
          value={form.watch('celula_id')}
          onChange={(e) => form.setValue('celula_id', e.target.value, { shouldValidate: true })}
          options={celOptions}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !celOptions.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function AplicacionMovilsPage() {
  const { data: rows, isLoading, isError } = useAplicacionMovils();
  const { data: cels } = useCelulas();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<AplicacionMovil | null>(null);
  const deleteMut = useDeleteAplicacionMovil();

  const celOptions = useMemo(
    () => (cels ?? []).map((c) => ({ value: c.id, label: c.nombre })),
    [cels],
  );
  const celName = useCallback(
    (id: string) => (cels ?? []).find((c) => c.id === id)?.nombre ?? id.slice(0, 8),
    [cels],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.nombre.toLowerCase().includes(n) ||
        r.plataforma.toLowerCase().includes(n) ||
        r.bundle_id.toLowerCase().includes(n) ||
        celName(r.celula_id).toLowerCase().includes(n),
    );
  }, [rows, q, celName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Aplicaciones móviles" description="Inventario de apps por célula.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!celOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva aplicación</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} celOptions={celOptions} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 max-w-md">
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin apps.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Plataforma</DataTableTh>
                  <DataTableTh>Bundle</DataTableTh>
                  <DataTableTh>Célula</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell>{item.plataforma}</DataTableCell>
                    <DataTableCell className="font-mono text-xs">{item.bundle_id}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{celName(item.celula_id)}</DataTableCell>
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
                              <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                              <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(item.id, {
                                    onSuccess: () => toast.success('Eliminado'),
                                    onError: (e) => {
                                      logger.error('aplicacion_movil.delete.failed', { id: item.id, error: e });
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
        </CardContent>
      </Card>

      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar aplicación</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} celOptions={celOptions} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
