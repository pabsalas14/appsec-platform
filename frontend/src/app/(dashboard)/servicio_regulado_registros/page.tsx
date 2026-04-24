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
import {
  useCreateServicioReguladoRegistro,
  useDeleteServicioReguladoRegistro,
  useServicioReguladoRegistros,
  useUpdateServicioReguladoRegistro,
} from '@/hooks/useServicioReguladoRegistros';
import { useServicios } from '@/hooks/useServicios';
import { logger } from '@/lib/logger';
import {
  ServicioReguladoRegistroCreateSchema,
  type ServicioReguladoRegistro,
  type ServicioReguladoRegistroCreate,
} from '@/lib/schemas/servicio_regulado_registro.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = ServicioReguladoRegistroCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  srvOptions,
}: {
  initial?: ServicioReguladoRegistro | null;
  onSuccess: () => void;
  srvOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateServicioReguladoRegistro();
  const updateMut = useUpdateServicioReguladoRegistro();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          servicio_id: initial.servicio_id,
          nombre_regulacion: initial.nombre_regulacion,
          ciclo: initial.ciclo,
          ano: initial.ano,
          estado: initial.estado,
        }
      : {
          servicio_id: srvOptions[0]?.value ?? '',
          nombre_regulacion: '',
          ciclo: '',
          ano: new Date().getFullYear(),
          estado: 'Pendiente',
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!initial && srvOptions[0] && !form.getValues('servicio_id')) {
      form.setValue('servicio_id', srvOptions[0].value);
    }
  }, [initial, srvOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const payload: ServicioReguladoRegistroCreate = {
      servicio_id: data.servicio_id,
      nombre_regulacion: data.nombre_regulacion.trim(),
      ciclo: data.ciclo.trim(),
      ano: data.ano,
      estado: data.estado.trim(),
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
            logger.error('servicio_regulado_registro.update.failed', { id: initial.id, error: e });
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
          logger.error('servicio_regulado_registro.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Servicio</label>
        <Select
          className="mt-1"
          value={form.watch('servicio_id')}
          onChange={(e) => form.setValue('servicio_id', e.target.value, { shouldValidate: true })}
          options={srvOptions}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Regulación</label>
        <Input className="mt-1" {...form.register('nombre_regulacion')} />
      </div>
      <div>
        <label className="text-sm font-medium">Ciclo</label>
        <Input className="mt-1" {...form.register('ciclo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Año</label>
        <Input className="mt-1" type="number" {...form.register('ano', { valueAsNumber: true })} />
      </div>
      <div>
        <label className="text-sm font-medium">Estado</label>
        <Input className="mt-1" {...form.register('estado')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !srvOptions.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function ServicioReguladoRegistrosPage() {
  const { data: rows, isLoading, isError } = useServicioReguladoRegistros();
  const { data: srvs } = useServicios();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<ServicioReguladoRegistro | null>(null);
  const deleteMut = useDeleteServicioReguladoRegistro();

  const srvOptions = useMemo(
    () => (srvs ?? []).map((s) => ({ value: s.id, label: s.nombre })),
    [srvs],
  );
  const srvName = useCallback(
    (id: string) => (srvs ?? []).find((s) => s.id === id)?.nombre ?? id.slice(0, 8),
    [srvs],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.nombre_regulacion.toLowerCase().includes(n) ||
        r.ciclo.toLowerCase().includes(n) ||
        r.estado.toLowerCase().includes(n) ||
        srvName(r.servicio_id).toLowerCase().includes(n),
    );
  }, [rows, q, srvName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Registros regulados (servicio)"
        description="Cumplimiento de regulación por servicio y ciclo."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!srvOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo registro</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} srvOptions={srvOptions} />
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
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin datos.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Servicio</DataTableTh>
                  <DataTableTh>Regulación</DataTableTh>
                  <DataTableTh>Ciclo / año</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-sm text-muted-foreground">{srvName(item.servicio_id)}</DataTableCell>
                    <DataTableCell className="font-medium max-w-[180px] truncate">{item.nombre_regulacion}</DataTableCell>
                    <DataTableCell>
                      {item.ciclo} · {item.ano}
                    </DataTableCell>
                    <DataTableCell>{item.estado}</DataTableCell>
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
                                      logger.error('servicio_regulado_registro.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar registro</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} srvOptions={srvOptions} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
