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
  Textarea,
} from '@/components/ui';
import {
  useAmenazas,
  useCreateAmenaza,
  useDeleteAmenaza,
  useUpdateAmenaza,
} from '@/hooks/useAmenazas';
import { useSesionThreatModelings } from '@/hooks/useSesionThreatModelings';
import { CATEGORIAS_STRIDE, ESTADOS_AMENAZA } from '@/lib/amenaza-constants';
import { logger } from '@/lib/logger';
import { AmenazaCreateSchema, type Amenaza, type AmenazaCreate } from '@/lib/schemas/amenaza.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = AmenazaCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  sesOptions,
}: {
  initial?: Amenaza | null;
  onSuccess: () => void;
  sesOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateAmenaza();
  const updateMut = useUpdateAmenaza();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          sesion_id: initial.sesion_id,
          titulo: initial.titulo,
          descripcion: initial.descripcion ?? null,
          categoria_stride: initial.categoria_stride,
          dread_damage: initial.dread_damage,
          dread_reproducibility: initial.dread_reproducibility,
          dread_exploitability: initial.dread_exploitability,
          dread_affected_users: initial.dread_affected_users,
          dread_discoverability: initial.dread_discoverability,
          estado: initial.estado,
        }
      : {
          sesion_id: sesOptions[0]?.value ?? '',
          titulo: '',
          descripcion: null,
          categoria_stride: CATEGORIAS_STRIDE[0],
          dread_damage: 5,
          dread_reproducibility: 5,
          dread_exploitability: 5,
          dread_affected_users: 5,
          dread_discoverability: 5,
          estado: 'Abierta',
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!initial && sesOptions[0] && !form.getValues('sesion_id')) {
      form.setValue('sesion_id', sesOptions[0].value);
    }
  }, [initial, sesOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const payload: AmenazaCreate = {
      sesion_id: data.sesion_id,
      titulo: data.titulo.trim(),
      descripcion: data.descripcion?.trim() || null,
      categoria_stride: data.categoria_stride,
      dread_damage: data.dread_damage,
      dread_reproducibility: data.dread_reproducibility,
      dread_exploitability: data.dread_exploitability,
      dread_affected_users: data.dread_affected_users,
      dread_discoverability: data.dread_discoverability,
      estado: data.estado,
    };
    if (isEdit && initial) {
      const patch = {
        titulo: payload.titulo,
        descripcion: payload.descripcion,
        categoria_stride: payload.categoria_stride,
        dread_damage: payload.dread_damage,
        dread_reproducibility: payload.dread_reproducibility,
        dread_exploitability: payload.dread_exploitability,
        dread_affected_users: payload.dread_affected_users,
        dread_discoverability: payload.dread_discoverability,
        estado: payload.estado,
      };
      updateMut.mutate(
        { id: initial.id, ...patch },
        {
          onSuccess: () => {
            toast.success('Actualizado');
            onSuccess();
          },
          onError: (e) => {
            logger.error('amenaza.update.failed', { id: initial.id, error: e });
            toast.error(extractErrorMessage(e, 'Error al guardar'));
          },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Creada');
          onSuccess();
        },
        onError: (e) => {
          logger.error('amenaza.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  const dread = ['dread_damage', 'dread_reproducibility', 'dread_exploitability', 'dread_affected_users', 'dread_discoverability'] as const;

  return (
    <form className="space-y-3 max-h-[80vh] overflow-y-auto pr-1" onSubmit={onSubmit}>
      {!isEdit && (
        <div>
          <label className="text-sm font-medium">Sesión TM</label>
          <Select
            className="mt-1"
            value={form.watch('sesion_id')}
            onChange={(e) => form.setValue('sesion_id', e.target.value, { shouldValidate: true })}
            options={sesOptions}
          />
        </div>
      )}
      {isEdit && initial && (
        <p className="text-xs text-muted-foreground">Sesión: {sesOptions.find((o) => o.value === initial.sesion_id)?.label}</p>
      )}
      <div>
        <label className="text-sm font-medium">Título</label>
        <Input className="mt-1" {...form.register('titulo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} {...form.register('descripcion')} />
      </div>
      <div>
        <label className="text-sm font-medium">STRIDE</label>
        <Select
          className="mt-1"
          value={form.watch('categoria_stride')}
          onChange={(e) => form.setValue('categoria_stride', e.target.value, { shouldValidate: true })}
          options={CATEGORIAS_STRIDE.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {dread.map((name) => (
          <div key={name}>
            <label className="text-xs font-medium capitalize">{name.replace('dread_', '')} (1-10)</label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={10}
              {...form.register(name, { valueAsNumber: true })}
            />
          </div>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium">Estado</label>
        <Select
          className="mt-1"
          value={form.watch('estado')}
          onChange={(e) => form.setValue('estado', e.target.value, { shouldValidate: true })}
          options={ESTADOS_AMENAZA.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !sesOptions.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function AmenazasPage() {
  const { data: rows, isLoading, isError } = useAmenazas();
  const { data: sesiones } = useSesionThreatModelings();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Amenaza | null>(null);
  const deleteMut = useDeleteAmenaza();

  const sesOptions = useMemo(
    () =>
      (sesiones ?? []).map((s) => ({
        value: s.id,
        label: `${s.fecha.slice(0, 10)} · ${s.id.slice(0, 8)}`,
      })),
    [sesiones],
  );
  const sesLabel = useCallback((id: string) => {
    const s = (sesiones ?? []).find((x) => x.id === id);
    return s ? `${s.fecha.slice(0, 10)} · ${s.id.slice(0, 8)}` : id.slice(0, 8);
  }, [sesiones]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.titulo.toLowerCase().includes(n) ||
        r.estado.toLowerCase().includes(n) ||
        r.categoria_stride.toLowerCase().includes(n) ||
        sesLabel(r.sesion_id).toLowerCase().includes(n),
    );
  }, [rows, q, sesLabel]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Amenazas (TM)" description="Modelado de amenazas con puntuación DREAD por sesión.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!sesOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva amenaza</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} sesOptions={sesOptions} />
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
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin amenazas.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Sesión / título</DataTableTh>
                  <DataTableTh>STRIDE</DataTableTh>
                  <DataTableTh>Score</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell>
                      <div className="text-xs text-muted-foreground mb-0.5">{sesLabel(item.sesion_id)}</div>
                      <div className="font-medium line-clamp-2 max-w-[200px]">{item.titulo}</div>
                    </DataTableCell>
                    <DataTableCell className="text-xs">{item.categoria_stride}</DataTableCell>
                    <DataTableCell>{item.score_total != null ? String(item.score_total) : '—'}</DataTableCell>
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
                              <AlertDialogTitle>¿Eliminar amenaza?</AlertDialogTitle>
                              <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(item.id, {
                                    onSuccess: () => toast.success('Eliminada'),
                                    onError: (e) => {
                                      logger.error('amenaza.delete.failed', { id: item.id, error: e });
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar amenaza</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} sesOptions={sesOptions} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
