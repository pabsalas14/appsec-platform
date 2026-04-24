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
import { useActivoWebs } from '@/hooks/useActivoWebs';
import {
  useCreateProgramaThreatModeling,
  useDeleteProgramaThreatModeling,
  useProgramaThreatModelings,
  useUpdateProgramaThreatModeling,
} from '@/hooks/useProgramaThreatModelings';
import { useServicios } from '@/hooks/useServicios';
import { logger } from '@/lib/logger';
import { ESTADOS_PROGRAMA } from '@/lib/programa-estados';
import {
  ProgramaThreatModelingCreateSchema,
  type ProgramaThreatModeling,
  type ProgramaThreatModelingCreate,
} from '@/lib/schemas/programa_threat_modeling.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = ProgramaThreatModelingCreateSchema;
type FormData = z.infer<typeof formSchema>;
const NONE = '';

function FormFields({
  initial,
  onSuccess,
  srvOpts,
  awOpts,
}: {
  initial?: ProgramaThreatModeling | null;
  onSuccess: () => void;
  srvOpts: { value: string; label: string }[];
  awOpts: { value: string; label: string }[];
}) {
  const createMut = useCreateProgramaThreatModeling();
  const updateMut = useUpdateProgramaThreatModeling();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          ano: initial.ano,
          descripcion: initial.descripcion ?? null,
          activo_web_id: initial.activo_web_id ?? null,
          servicio_id: initial.servicio_id ?? null,
          estado: initial.estado,
        }
      : {
          nombre: '',
          ano: new Date().getFullYear(),
          descripcion: null,
          activo_web_id: awOpts[0]?.value || null,
          servicio_id: srvOpts[0]?.value || null,
          estado: 'Activo',
        },
  });
  const pending = createMut.isPending || updateMut.isPending;
  const awV = form.watch('activo_web_id');
  const svV = form.watch('servicio_id');

  const onSubmit = form.handleSubmit((data) => {
    const aw = data.activo_web_id && data.activo_web_id.length > 0 ? data.activo_web_id : null;
    const sv = data.servicio_id && data.servicio_id.length > 0 ? data.servicio_id : null;
    if (!aw && !sv) {
      toast.error('Debe elegir un activo web o un servicio (o ambos).');
      return;
    }
    const payload: ProgramaThreatModelingCreate = {
      nombre: data.nombre.trim(),
      ano: data.ano,
      descripcion: data.descripcion?.trim() || null,
      activo_web_id: aw,
      servicio_id: sv,
      estado: data.estado,
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
            logger.error('programa_threat_modeling.update.failed', { id: initial.id, error: e });
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
          logger.error('programa_threat_modeling.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <p className="text-xs text-muted-foreground">Al menos uno: servicio o activo web (validación de negocio).</p>
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input className="mt-1" {...form.register('nombre')} />
      </div>
      <div>
        <label className="text-sm font-medium">Año</label>
        <Input className="mt-1" type="number" {...form.register('ano', { valueAsNumber: true })} />
      </div>
      <div>
        <label className="text-sm font-medium">Servicio</label>
        <Select
          className="mt-1"
          value={svV ?? NONE}
          onChange={(e) => {
            const v = e.target.value;
            form.setValue('servicio_id', v === NONE ? null : v, { shouldValidate: true });
          }}
          options={[{ value: NONE, label: '— Ninguno —' }, ...srvOpts]}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Activo web</label>
        <Select
          className="mt-1"
          value={awV ?? NONE}
          onChange={(e) => {
            const v = e.target.value;
            form.setValue('activo_web_id', v === NONE ? null : v, { shouldValidate: true });
          }}
          options={[{ value: NONE, label: '— Ninguno —' }, ...awOpts]}
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

export default function ProgramaThreatModelingsPage() {
  const { data: rows, isLoading, isError } = useProgramaThreatModelings();
  const { data: srvs } = useServicios();
  const { data: aw } = useActivoWebs();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<ProgramaThreatModeling | null>(null);
  const deleteMut = useDeleteProgramaThreatModeling();

  const srvOpts = useMemo(() => (srvs ?? []).map((s) => ({ value: s.id, label: s.nombre })), [srvs]);
  const awOpts = useMemo(() => (aw ?? []).map((a) => ({ value: a.id, label: a.nombre })), [aw]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter((r) => r.nombre.toLowerCase().includes(n) || r.estado.toLowerCase().includes(n));
  }, [rows, q]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Programas de threat modeling"
        description="Programa anual (requiere servicio o activo web, o ambos)."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo programa</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} srvOpts={srvOpts} awOpts={awOpts} />
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
                  <DataTableTh>Año</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-[200px] truncate">{item.nombre}</DataTableCell>
                    <DataTableCell>{item.ano}</DataTableCell>
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
                                      logger.error('programa_threat_modeling.delete.failed', { id: item.id, error: e });
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar programa</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} srvOpts={srvOpts} awOpts={awOpts} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
