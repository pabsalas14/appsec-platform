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
import { dateOnlyToIsoEndOfDay, isoToDateOnly } from '@/components/crud';
import {
  useCreateRevisionSourceCode,
  useDeleteRevisionSourceCode,
  useRevisionSourceCodes,
  useUpdateRevisionSourceCode,
} from '@/hooks/useRevisionSourceCodes';
import { useControlSourceCodes } from '@/hooks/useControlSourceCodes';
import { useProgramaSourceCodes } from '@/hooks/useProgramaSourceCodes';
import { logger } from '@/lib/logger';
import {
  RevisionSourceCodeCreateSchema,
  type RevisionSourceCode,
  type RevisionSourceCodeCreate,
} from '@/lib/schemas/revision_source_code.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = RevisionSourceCodeCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  progOptions,
  ctrlOptions,
}: {
  initial?: RevisionSourceCode | null;
  onSuccess: () => void;
  progOptions: { value: string; label: string }[];
  ctrlOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateRevisionSourceCode();
  const updateMut = useUpdateRevisionSourceCode();
  const isEdit = Boolean(initial);
  const [fRev, setFRev] = useState(() => (initial ? isoToDateOnly(initial.fecha_revision) : new Date().toISOString().slice(0, 10)));
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          programa_sc_id: initial.programa_sc_id,
          control_sc_id: initial.control_sc_id,
          fecha_revision: initial.fecha_revision,
          resultado: initial.resultado,
          evidencia_filename: initial.evidencia_filename ?? null,
          evidencia_sha256: initial.evidencia_sha256 ?? null,
          notas: initial.notas ?? null,
        }
      : {
          programa_sc_id: progOptions[0]?.value ?? '',
          control_sc_id: ctrlOptions[0]?.value ?? '',
          fecha_revision: new Date().toISOString(),
          resultado: 'OK',
          evidencia_filename: null,
          evidencia_sha256: null,
          notas: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (initial) {
      setFRev(isoToDateOnly(initial.fecha_revision));
    }
  }, [initial]);

  useEffect(() => {
    if (!initial && progOptions[0] && ctrlOptions[0]) {
      if (!form.getValues('programa_sc_id')) form.setValue('programa_sc_id', progOptions[0].value);
      if (!form.getValues('control_sc_id')) form.setValue('control_sc_id', ctrlOptions[0].value);
    }
  }, [initial, progOptions, ctrlOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const fr = dateOnlyToIsoEndOfDay(fRev) || data.fecha_revision;
    const payload: RevisionSourceCodeCreate = {
      programa_sc_id: data.programa_sc_id,
      control_sc_id: data.control_sc_id,
      fecha_revision: fr,
      resultado: data.resultado.trim(),
      evidencia_filename: data.evidencia_filename?.trim() || null,
      evidencia_sha256: data.evidencia_sha256?.trim() || null,
      notas: data.notas?.trim() || null,
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
            logger.error('revision_source_code.update.failed', { id: initial.id, error: e });
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
          logger.error('revision_source_code.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Programa (código)</label>
        <Select
          className="mt-1"
          value={form.watch('programa_sc_id')}
          onChange={(e) => form.setValue('programa_sc_id', e.target.value, { shouldValidate: true })}
          options={progOptions}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Control</label>
        <Select
          className="mt-1"
          value={form.watch('control_sc_id')}
          onChange={(e) => form.setValue('control_sc_id', e.target.value, { shouldValidate: true })}
          options={ctrlOptions}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha revisión</label>
        <Input className="mt-1" type="date" value={fRev} onChange={(e) => setFRev(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Resultado</label>
        <Textarea className="mt-1" rows={2} {...form.register('resultado')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Evidencia (archivo)</label>
          <Input className="mt-1" {...form.register('evidencia_filename')} />
        </div>
        <div>
          <label className="text-sm font-medium">SHA-256</label>
          <Input className="mt-1" {...form.register('evidencia_sha256')} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Notas</label>
        <Textarea className="mt-1" rows={2} {...form.register('notas')} />
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !progOptions.length || !ctrlOptions.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function RevisionSourceCodesPage() {
  const { data: rows, isLoading, isError } = useRevisionSourceCodes();
  const { data: progs } = useProgramaSourceCodes();
  const { data: ctrls } = useControlSourceCodes();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<RevisionSourceCode | null>(null);
  const deleteMut = useDeleteRevisionSourceCode();

  const progOptions = useMemo(() => (progs ?? []).map((p) => ({ value: p.id, label: p.nombre })), [progs]);
  const ctrlOptions = useMemo(() => (ctrls ?? []).map((c) => ({ value: c.id, label: c.nombre })), [ctrls]);
  const pName = useCallback(
    (id: string) => (progs ?? []).find((p) => p.id === id)?.nombre ?? id.slice(0, 8),
    [progs],
  );
  const cName = useCallback(
    (id: string) => (ctrls ?? []).find((c) => c.id === id)?.nombre ?? id.slice(0, 8),
    [ctrls],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.resultado.toLowerCase().includes(n) ||
        pName(r.programa_sc_id).toLowerCase().includes(n) ||
        cName(r.control_sc_id).toLowerCase().includes(n),
    );
  }, [rows, q, pName, cName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Revisiones de código" description="Cierre de control por programa de revisión.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!progOptions.length || !ctrlOptions.length}>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva revisión</DialogTitle>
            </DialogHeader>
            <FormFields
              onSuccess={() => setCreateOpen(false)}
              progOptions={progOptions}
              ctrlOptions={ctrlOptions}
            />
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
                  <DataTableTh>Programa</DataTableTh>
                  <DataTableTh>Control</DataTableTh>
                  <DataTableTh>Resultado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-sm max-w-[140px] truncate">{pName(item.programa_sc_id)}</DataTableCell>
                    <DataTableCell className="text-sm max-w-[140px] truncate">{cName(item.control_sc_id)}</DataTableCell>
                    <DataTableCell className="max-w-[200px] truncate text-sm">{item.resultado}</DataTableCell>
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
                                      logger.error('revision_source_code.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar revisión</DialogTitle>
          </DialogHeader>
          {edit && (
            <FormFields
              key={edit.id}
              initial={edit}
              onSuccess={() => setEdit(null)}
              progOptions={progOptions}
              ctrlOptions={ctrlOptions}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
