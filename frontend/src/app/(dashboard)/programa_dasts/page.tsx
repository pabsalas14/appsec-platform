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
import { useActivoWebs } from '@/hooks/useActivoWebs';
import {
  useCreateProgramaDast,
  useDeleteProgramaDast,
  useProgramaDasts,
  useUpdateProgramaDast,
} from '@/hooks/useProgramaDasts';
import { logger } from '@/lib/logger';
import { ESTADOS_PROGRAMA } from '@/lib/programa-estados';
import { ProgramaDastCreateSchema, type ProgramaDast, type ProgramaDastCreate } from '@/lib/schemas/programa_dast.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = ProgramaDastCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  awOptions,
}: {
  initial?: ProgramaDast | null;
  onSuccess: () => void;
  awOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateProgramaDast();
  const updateMut = useUpdateProgramaDast();
  const isEdit = Boolean(initial);
  const [motorJson, setMotorJson] = useState('{}');
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          ano: initial.ano,
          descripcion: initial.descripcion ?? null,
          activo_web_id: initial.activo_web_id,
          estado: initial.estado,
          metadatos_motor: initial.metadatos_motor ?? null,
        }
      : {
          nombre: '',
          ano: new Date().getFullYear(),
          descripcion: null,
          activo_web_id: awOptions[0]?.value ?? '',
          estado: 'Activo',
          metadatos_motor: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!initial && awOptions[0] && !form.getValues('activo_web_id')) {
      form.setValue('activo_web_id', awOptions[0].value);
    }
  }, [initial, awOptions, form]);

  useEffect(() => {
    if (initial?.metadatos_motor && typeof initial.metadatos_motor === 'object') {
      setMotorJson(JSON.stringify(initial.metadatos_motor, null, 2));
    } else {
      setMotorJson('{}');
    }
  }, [initial]);

  const onSubmit = form.handleSubmit((data) => {
    const t = motorJson.trim();
    let metadatos_motor: Record<string, unknown> | null = null;
    if (t && t !== '{}') {
      try {
        const p = JSON.parse(t) as unknown;
        if (p !== null && (typeof p !== 'object' || Array.isArray(p))) {
          toast.error('Metadatos del motor: debe ser un objeto JSON.');
          return;
        }
        metadatos_motor = p as Record<string, unknown> | null;
      } catch {
        toast.error('Metadatos del motor: JSON no válido.');
        return;
      }
    }
    const payload: ProgramaDastCreate = {
      nombre: data.nombre.trim(),
      ano: data.ano,
      descripcion: data.descripcion?.trim() || null,
      activo_web_id: data.activo_web_id,
      estado: data.estado,
      metadatos_motor,
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
            logger.error('programa_dast.update.failed', { id: initial.id, error: e });
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
          logger.error('programa_dast.create.failed', { error: e });
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
        <label className="text-sm font-medium">Año</label>
        <Input className="mt-1" type="number" {...form.register('ano', { valueAsNumber: true })} />
      </div>
      <div>
        <label className="text-sm font-medium">Activo web</label>
        <Select
          className="mt-1"
          value={form.watch('activo_web_id')}
          onChange={(e) => form.setValue('activo_web_id', e.target.value, { shouldValidate: true })}
          options={awOptions}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Estado</label>
        <Select
          className="mt-1"
          value={form.watch('estado')}
          onChange={(e) => form.setValue('estado', e.target.value, { shouldValidate: true })}
          options={ESTADOS_PROGRAMA.map((x) => ({ value: x, label: x }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} {...form.register('descripcion')} />
      </div>
      <div>
        <label className="text-sm font-medium">Metadatos del motor (JSON)</label>
        <Textarea
          className="mt-1 font-mono text-xs"
          rows={4}
          spellCheck={false}
          value={motorJson}
          onChange={(e) => setMotorJson(e.target.value)}
          placeholder='{"herramienta":"ZAP","perfil":"baseline"}'
        />
        <p className="mt-1 text-xs text-muted-foreground">Objeto JSON; vacío o {"{}"} se guarda como null.</p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !awOptions.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function ProgramaDastsPage() {
  const { data: rows, isLoading, isError } = useProgramaDasts();
  const { data: aw } = useActivoWebs();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<ProgramaDast | null>(null);
  const deleteMut = useDeleteProgramaDast();

  const awOptions = useMemo(() => (aw ?? []).map((a) => ({ value: a.id, label: a.nombre })), [aw]);
  const awName = useCallback(
    (id: string) => (aw ?? []).find((x) => x.id === id)?.nombre ?? id.slice(0, 8),
    [aw],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.nombre.toLowerCase().includes(n) ||
        r.estado.toLowerCase().includes(n) ||
        awName(r.activo_web_id).toLowerCase().includes(n),
    );
  }, [rows, q, awName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Programas DAST" description="Programas de pruebas dinámicas vinculados a un activo web.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!awOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo programa DAST</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} awOptions={awOptions} />
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
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin programas.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Activo web</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{awName(item.activo_web_id)}</DataTableCell>
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
                                      logger.error('programa_dast.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar programa DAST</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} awOptions={awOptions} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
