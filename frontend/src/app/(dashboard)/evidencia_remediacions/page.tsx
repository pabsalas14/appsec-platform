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
  useCreateEvidenciaRemediacion,
  useDeleteEvidenciaRemediacion,
  useEvidenciaRemediacions,
  useUpdateEvidenciaRemediacion,
} from '@/hooks/useEvidenciaRemediacions';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { logger } from '@/lib/logger';
import {
  EvidenciaRemediacionCreateSchema,
  type EvidenciaRemediacion,
  type EvidenciaRemediacionCreate,
} from '@/lib/schemas/evidencia_remediacion.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = EvidenciaRemediacionCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  vOpts,
}: {
  initial?: EvidenciaRemediacion | null;
  onSuccess: () => void;
  vOpts: { value: string; label: string }[];
}) {
  const createMut = useCreateEvidenciaRemediacion();
  const updateMut = useUpdateEvidenciaRemediacion();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          vulnerabilidad_id: initial.vulnerabilidad_id,
          descripcion: initial.descripcion,
          sha256: initial.sha256 ?? null,
          filename: initial.filename ?? null,
          content_type: initial.content_type ?? null,
        }
      : {
          vulnerabilidad_id: vOpts[0]?.value ?? '',
          descripcion: '',
          sha256: null,
          filename: null,
          content_type: null,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!initial && vOpts[0] && !form.getValues('vulnerabilidad_id')) {
      form.setValue('vulnerabilidad_id', vOpts[0].value);
    }
  }, [initial, vOpts, form]);

  const onSubmit = form.handleSubmit((data) => {
    const payload: EvidenciaRemediacionCreate = {
      vulnerabilidad_id: data.vulnerabilidad_id,
      descripcion: data.descripcion.trim(),
      sha256: data.sha256?.trim() || null,
      filename: data.filename?.trim() || null,
      content_type: data.content_type?.trim() || null,
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
            logger.error('evidencia_remediacion.update.failed', { id: initial.id, error: e });
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
          logger.error('evidencia_remediacion.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Vulnerabilidad</label>
        <Select
          className="mt-1"
          value={form.watch('vulnerabilidad_id')}
          onChange={(e) => form.setValue('vulnerabilidad_id', e.target.value, { shouldValidate: true })}
          options={vOpts}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={3} {...form.register('descripcion')} />
      </div>
      <div>
        <label className="text-sm font-medium">SHA-256</label>
        <Input className="mt-1" {...form.register('sha256')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Archivo</label>
          <Input className="mt-1" {...form.register('filename')} />
        </div>
        <div>
          <label className="text-sm font-medium">Content-Type</label>
          <Input className="mt-1" {...form.register('content_type')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !vOpts.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export default function EvidenciaRemediacionsPage() {
  const { data: rows, isLoading, isError } = useEvidenciaRemediacions();
  const { data: vulns } = useVulnerabilidads();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<EvidenciaRemediacion | null>(null);
  const deleteMut = useDeleteEvidenciaRemediacion();

  const vOpts = useMemo(
    () => (vulns ?? []).map((v) => ({ value: v.id, label: v.titulo?.slice(0, 80) ?? v.id.slice(0, 8) })),
    [vulns],
  );
  const vLabel = useCallback(
    (id: string) => (vulns ?? []).find((v) => v.id === id)?.titulo ?? id.slice(0, 8),
    [vulns],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.descripcion.toLowerCase().includes(n) ||
        vLabel(r.vulnerabilidad_id).toLowerCase().includes(n) ||
        (r.filename && r.filename.toLowerCase().includes(n)),
    );
  }, [rows, q, vLabel]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Evidencias de remediación" description="Evidencias adjuntas a una vulnerabilidad.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!vOpts.length}>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva evidencia</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} vOpts={vOpts} />
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
                  <DataTableTh>Vulnerabilidad</DataTableTh>
                  <DataTableTh>Descripción</DataTableTh>
                  <DataTableTh>Archivo</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                      {vLabel(item.vulnerabilidad_id)}
                    </DataTableCell>
                    <DataTableCell className="max-w-[200px] truncate text-sm">{item.descripcion}</DataTableCell>
                    <DataTableCell className="text-xs">{item.filename ?? '—'}</DataTableCell>
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
                                      logger.error('evidencia_remediacion.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar evidencia</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} vOpts={vOpts} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
