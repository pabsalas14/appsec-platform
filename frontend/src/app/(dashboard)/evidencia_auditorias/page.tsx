'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileSearch, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger, Button, Card, CardContent, DataTable, DataTableBody,
  DataTableCell, DataTableHead, DataTableRow, DataTableTh, Dialog, DialogClose,
  DialogContent, DialogHeader, DialogTitle, DialogTrigger, EmptyState, Input,
  PageHeader, PageWrapper, Select,
} from '@/components/ui';
import { useEvidenciaAuditorias, useCreateEvidenciaAuditoria, useUpdateEvidenciaAuditoria, useDeleteEvidenciaAuditoria } from '@/hooks/useEvidenciaAuditorias';
import { useAuditorias } from '@/hooks/useAuditorias';
import { EvidenciaAuditoriaCreateSchema, type EvidenciaAuditoria } from '@/lib/schemas/evidencia_auditoria.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const TIPOS_EVIDENCIA = ['Captura de pantalla', 'Log', 'Documento', 'Reporte', 'Script', 'Otro'];

const formSchema = EvidenciaAuditoriaCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function EvidenciaAuditoriasPage() {
  const evidenciasQuery = useEvidenciaAuditorias();
  const items = evidenciasQuery?.data ?? [];
  const isLoading = Boolean(evidenciasQuery?.isLoading);
  const auditoriasQuery = useAuditorias();
  const auditorias = auditoriasQuery?.data ?? [];
  const createMut = useCreateEvidenciaAuditoria();
  const updateMut = useUpdateEvidenciaAuditoria();
  const deleteMut = useDeleteEvidenciaAuditoria();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EvidenciaAuditoria | null>(null);

  const auditoriaOpts = auditorias.map((a) => ({ value: a.id, label: a.titulo }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nombre_archivo: '', tipo_evidencia: TIPOS_EVIDENCIA[0], url_archivo: '', hash_sha256: '', auditoria_id: '' },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ nombre_archivo: '', tipo_evidencia: TIPOS_EVIDENCIA[0], url_archivo: '', hash_sha256: '', auditoria_id: auditoriaOpts[0]?.value ?? '' });
    setCreateOpen(true);
  }, [form, auditoriaOpts]);

  const openEdit = useCallback((item: EvidenciaAuditoria) => {
    form.reset({ nombre_archivo: item.nombre_archivo, tipo_evidencia: item.tipo_evidencia, url_archivo: item.url_archivo, hash_sha256: item.hash_sha256, auditoria_id: item.auditoria_id });
    setEditTarget(item);
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, ...values });
        toast.success('Evidencia actualizada');
        setEditTarget(null);
      } else {
        await createMut.mutateAsync(values);
        toast.success('Evidencia registrada');
        setCreateOpen(false);
      }
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar evidencia'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Evidencia eliminada');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  const dialogForm = (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium">Auditoría *</label>
        <Select className="mt-1" value={form.watch('auditoria_id')} onChange={(e) => form.setValue('auditoria_id', e.target.value, { shouldValidate: true })} options={auditoriaOpts} />
      </div>
      <div>
        <label className="text-sm font-medium">Nombre de archivo *</label>
        <Input className="mt-1" maxLength={255} {...form.register('nombre_archivo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Tipo de evidencia *</label>
        <Select className="mt-1" value={form.watch('tipo_evidencia')} onChange={(e) => form.setValue('tipo_evidencia', e.target.value, { shouldValidate: true })} options={TIPOS_EVIDENCIA.map((x) => ({ value: x, label: x }))} />
      </div>
      <div>
        <label className="text-sm font-medium">URL del archivo *</label>
        <Input className="mt-1" maxLength={512} placeholder="https://…" {...form.register('url_archivo')} />
      </div>
      <div>
        <label className="text-sm font-medium">Hash SHA-256 *</label>
        <Input className="mt-1" maxLength={64} placeholder="64 caracteres hex" {...form.register('hash_sha256')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={() => { setEditTarget(null); form.reset(); }}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
          {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editTarget ? 'Actualizar' : 'Registrar'}
        </Button>
      </div>
    </form>
  );

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="Evidencias de Auditoría" description="Archivos y documentos de evidencia vinculados a auditorías (SHA-256 verificado).">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen} disabled={!auditoriaOpts.length}><Plus className="mr-2 h-4 w-4" />Registrar evidencia</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Registrar evidencia de auditoría</DialogTitle></DialogHeader>
            {dialogForm}
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <EmptyState icon={FileSearch} title="Sin evidencias" description="Registra la primera evidencia con el botón superior." />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Archivo</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Hash SHA-256</DataTableTh>
                  <DataTableTh>Registrado</DataTableTh>
                  <DataTableTh className="w-24" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium max-w-[180px] truncate">
                      <a href={item.url_archivo} target="_blank" rel="noreferrer" className="text-primary hover:underline">{item.nombre_archivo}</a>
                    </DataTableCell>
                    <DataTableCell>{item.tipo_evidencia}</DataTableCell>
                    <DataTableCell className="font-mono text-xs text-muted-foreground max-w-[160px] truncate">{item.hash_sha256}</DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{formatDate(item.created_at)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Dialog open={editTarget?.id === item.id} onOpenChange={(o) => { if (!o) { setEditTarget(null); form.reset(); } }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Editar evidencia</DialogTitle></DialogHeader>
                            {dialogForm}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar evidencia</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void onDelete(item.id)}>Eliminar</AlertDialogAction>
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
    </PageWrapper>
  );
}
