'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { History, Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
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
  useCreateHistorialVulnerabilidad,
  useHistorialVulnerabilidads,
} from '@/hooks/useHistorialVulnerabilidads';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { logger } from '@/lib/logger';
import {
  HistorialVulnerabilidadCreateSchema,
  type HistorialVulnerabilidadCreate,
} from '@/lib/schemas/historial_vulnerabilidad.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = HistorialVulnerabilidadCreateSchema;
type FormData = z.infer<typeof formSchema>;

/**
 * El backend no expone PATCH/DELETE: el historial es inmutable. Solo listado y alta manual.
 */
function CreateForm({ vOpts, onSuccess }: { vOpts: { value: string; label: string }[]; onSuccess: () => void }) {
  const createMut = useCreateHistorialVulnerabilidad();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vulnerabilidad_id: vOpts[0]?.value ?? '',
      estado_anterior: '',
      estado_nuevo: '',
      responsable_id: null,
      justificacion: null,
      comentario: null,
    },
  });
  const pending = createMut.isPending;

  useEffect(() => {
    if (vOpts[0] && !form.getValues('vulnerabilidad_id')) {
      form.setValue('vulnerabilidad_id', vOpts[0].value);
    }
  }, [vOpts, form]);

  const onSubmit = form.handleSubmit((data) => {
    const rid = data.responsable_id?.trim();
    const payload: HistorialVulnerabilidadCreate = {
      vulnerabilidad_id: data.vulnerabilidad_id,
      estado_anterior: data.estado_anterior.trim(),
      estado_nuevo: data.estado_nuevo.trim(),
      responsable_id: rid && z.string().uuid().safeParse(rid).success ? rid : null,
      justificacion: data.justificacion?.trim() || null,
      comentario: data.comentario?.trim() || null,
    };
    createMut.mutate(payload, {
      onSuccess: () => {
        toast.success('Entrada de historial creada');
        onSuccess();
        form.reset({
          vulnerabilidad_id: vOpts[0]?.value ?? '',
          estado_anterior: '',
          estado_nuevo: '',
          responsable_id: null,
          justificacion: null,
          comentario: null,
        });
      },
      onError: (e) => {
        logger.error('historial_vulnerabilidad.create.failed', { error: e });
        toast.error(extractErrorMessage(e, 'Error al crear'));
      },
    });
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <p className="text-xs text-muted-foreground">
        Las entradas de historial son inmutables: no se pueden editar ni eliminar por API.
      </p>
      <div>
        <label className="text-sm font-medium">Vulnerabilidad</label>
        <Select
          className="mt-1"
          value={form.watch('vulnerabilidad_id')}
          onChange={(e) => form.setValue('vulnerabilidad_id', e.target.value, { shouldValidate: true })}
          options={vOpts}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Estado anterior</label>
          <Input className="mt-1" {...form.register('estado_anterior')} />
        </div>
        <div>
          <label className="text-sm font-medium">Estado nuevo</label>
          <Input className="mt-1" {...form.register('estado_nuevo')} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Responsable (UUID, opcional)</label>
        <Input
          className="mt-1"
          value={form.watch('responsable_id') ?? ''}
          onChange={(e) => form.setValue('responsable_id', e.target.value.trim() || null)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Justificación</label>
        <Textarea className="mt-1" rows={2} {...form.register('justificacion')} />
      </div>
      <div>
        <label className="text-sm font-medium">Comentario</label>
        <Textarea className="mt-1" rows={2} {...form.register('comentario')} />
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cerrar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !vOpts.length}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar
        </Button>
      </div>
    </form>
  );
}

export default function HistorialVulnerabilidadsPage() {
  const { data: rows, isLoading, isError } = useHistorialVulnerabilidads();
  const { data: vulns } = useVulnerabilidads();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const vOpts = useMemo(
    () => (vulns ?? []).map((v) => ({ value: v.id, label: v.titulo.slice(0, 60) })),
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
        r.estado_anterior.toLowerCase().includes(n) ||
        r.estado_nuevo.toLowerCase().includes(n) ||
        (r.comentario && r.comentario.toLowerCase().includes(n)) ||
        vLabel(r.vulnerabilidad_id).toLowerCase().includes(n),
    );
  }, [rows, q, vLabel]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Historial de vulnerabilidades"
        description="Registro inmutable de cambios de estado. Solo se permite crear entradas manualmente o por integración; no hay edición ni borrado vía API."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!vOpts.length}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar cambio (historial)</DialogTitle>
            </DialogHeader>
            <CreateForm vOpts={vOpts} onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <History className="inline h-4 w-4 mr-1 align-text-bottom" />
            {rows?.length ?? 0} entrada(s) — sin acciones de edición/eliminación
          </p>
          <div className="max-w-md">
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar.</p>}
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin entradas.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Vulnerabilidad</DataTableTh>
                  <DataTableTh>Anterior → nuevo</DataTableTh>
                  <DataTableTh>Comentario</DataTableTh>
                  <DataTableTh>Registro / actualizado</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {vLabel(item.vulnerabilidad_id)}
                    </DataTableCell>
                    <DataTableCell className="text-sm">
                      {item.estado_anterior} → {item.estado_nuevo}
                    </DataTableCell>
                    <DataTableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {item.comentario ?? item.justificacion ?? '—'}
                    </DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.created_at)} / {formatDate(item.updated_at)}
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
