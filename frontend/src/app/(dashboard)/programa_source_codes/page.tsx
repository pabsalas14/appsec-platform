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
  useCreateProgramaSourceCode,
  useDeleteProgramaSourceCode,
  useProgramaSourceCodes,
  useUpdateProgramaSourceCode,
} from '@/hooks/useProgramaSourceCodes';
import { useRepositorios } from '@/hooks/useRepositorios';
import { logger } from '@/lib/logger';
import { ESTADOS_PROGRAMA } from '@/lib/programa-estados';
import {
  ProgramaSourceCodeCreateSchema,
  type ProgramaSourceCode,
  type ProgramaSourceCodeCreate,
} from '@/lib/schemas/programa_source_code.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = ProgramaSourceCodeCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  repoOptions,
}: {
  initial?: ProgramaSourceCode | null;
  onSuccess: () => void;
  repoOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateProgramaSourceCode();
  const updateMut = useUpdateProgramaSourceCode();
  const isEdit = Boolean(initial);
  const [motorJson, setMotorJson] = useState('{}');
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          ano: initial.ano,
          descripcion: initial.descripcion ?? null,
          repositorio_id: initial.repositorio_id,
          estado: initial.estado,
          metadatos_motor: initial.metadatos_motor ?? null,
        }
      : {
          nombre: '',
          ano: new Date().getFullYear(),
          descripcion: null,
          repositorio_id: repoOptions[0]?.value ?? '',
          estado: 'Activo',
          metadatos_motor: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!initial && repoOptions[0] && !form.getValues('repositorio_id')) {
      form.setValue('repositorio_id', repoOptions[0].value);
    }
  }, [initial, repoOptions, form]);

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
    const payload: ProgramaSourceCodeCreate = {
      nombre: data.nombre.trim(),
      ano: data.ano,
      descripcion: data.descripcion?.trim() || null,
      repositorio_id: data.repositorio_id,
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
            logger.error('programa_source_code.update.failed', { id: initial.id, error: e });
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
          logger.error('programa_source_code.create.failed', { error: e });
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
        <label className="text-sm font-medium">Repositorio</label>
        <Select
          className="mt-1"
          value={form.watch('repositorio_id')}
          onChange={(e) => form.setValue('repositorio_id', e.target.value, { shouldValidate: true })}
          options={repoOptions}
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
          placeholder='{"herramientas":["SAST","SCA","CDS"],"version":"2026.04"}'
        />
        <p className="mt-1 text-xs text-muted-foreground">Objeto JSON; vacio o {} se guarda como null.</p>
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

export default function ProgramaSourceCodesPage() {
  const { data: rows, isLoading, isError } = useProgramaSourceCodes();
  const { data: repos } = useRepositorios();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<ProgramaSourceCode | null>(null);
  const deleteMut = useDeleteProgramaSourceCode();

  const repoOptions = useMemo(
    () => (repos ?? []).map((r) => ({ value: r.id, label: r.nombre })),
    [repos],
  );
  const repoName = useCallback(
    (id: string) => (repos ?? []).find((r) => r.id === id)?.nombre ?? id.slice(0, 8),
    [repos],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.nombre.toLowerCase().includes(n) ||
        r.estado.toLowerCase().includes(n) ||
        repoName(r.repositorio_id).toLowerCase().includes(n),
    );
  }, [rows, q, repoName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Programas (código)" description="Programas de revisión de código por repositorio.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo programa</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} repoOptions={repoOptions} />
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
                  <DataTableTh>Repositorio</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{repoName(item.repositorio_id)}</DataTableCell>
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
                                      logger.error('programa_source_code.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar programa</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} repoOptions={repoOptions} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
