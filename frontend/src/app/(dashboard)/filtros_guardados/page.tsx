'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bookmark, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger, Badge, Button, Card, CardContent, DataTable, DataTableBody,
  DataTableCell, DataTableHead, DataTableRow, DataTableTh, Dialog, DialogClose,
  DialogContent, DialogHeader, DialogTitle, DialogTrigger, EmptyState, Input,
  PageHeader, PageWrapper,
} from '@/components/ui';
import { useFiltrosGuardados, useCreateFiltroGuardado, useDeleteFiltroGuardado } from '@/hooks/useFiltrosGuardados';
import { FiltroGuardadoCreateSchema, type FiltroGuardado } from '@/lib/schemas/filtro_guardado.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const MODULOS = [
  'vulnerabilidads', 'hallazgo_sasts', 'hallazgo_dasts', 'hallazgo_masts',
  'hallazgo_pipelines', 'hallazgo_terceros', 'hallazgo_auditorias',
  'auditorias', 'temas_emergentes', 'iniciativas', 'service_releases',
  'programa_sasts', 'programa_dasts', 'repositorios', 'activo_webs', 'servicios',
];

const formSchema = FiltroGuardadoCreateSchema;
type FormData = z.infer<typeof formSchema>;

export default function FiltrosGuardadosPage() {
  const filtrosQuery = useFiltrosGuardados();
  const items = filtrosQuery?.data ?? [];
  const isLoading = Boolean(filtrosQuery?.isLoading);
  const createMut = useCreateFiltroGuardado();
  const deleteMut = useDeleteFiltroGuardado();

  const [createOpen, setCreateOpen] = useState(false);
  const [parametrosText, setParametrosText] = useState('{}');
  const [parametrosError, setParametrosError] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nombre: '', modulo: MODULOS[0], parametros: {}, compartido: false },
  });

  const resetAndOpen = useCallback(() => {
    form.reset({ nombre: '', modulo: MODULOS[0], parametros: {}, compartido: false });
    setParametrosText('{}');
    setParametrosError('');
    setCreateOpen(true);
  }, [form]);

  const parseParametros = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setParametrosError('');
      return parsed;
    } catch {
      setParametrosError('JSON inválido');
      return null;
    }
  };

  const onSubmit = async (values: FormData) => {
    const parametros = parseParametros(parametrosText);
    if (!parametros) return;
    try {
      await createMut?.mutateAsync?.({ ...values, parametros });
      toast.success('Filtro guardado');
      setCreateOpen(false);
      form.reset();
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al guardar filtro'));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMut?.mutateAsync?.(id);
      toast.success('Filtro eliminado');
    } catch (e) {
      toast.error(extractErrorMessage(e, 'Error al eliminar'));
    }
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Filtros Guardados"
        description="Guarda combinaciones de filtros para reutilizarlos rápidamente en cualquier módulo."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpen}><Plus className="mr-2 h-4 w-4" />Guardar filtro</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo filtro guardado</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input className="mt-1" maxLength={255} placeholder="Ej. Críticos sin SLA" {...form.register('nombre')} />
              </div>
              <div>
                <label className="text-sm font-medium">Módulo *</label>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.watch('modulo')}
                  onChange={(e) => form.setValue('modulo', e.target.value, { shouldValidate: true })}
                >
                  {MODULOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Parámetros (JSON) *</label>
                <textarea
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono bg-background resize-none ${parametrosError ? 'border-destructive' : 'border-input'}`}
                  rows={5}
                  placeholder={'{\n  "severidad": "Crítica",\n  "estado": "Abierto"\n}'}
                  value={parametrosText}
                  onChange={(e) => setParametrosText(e.target.value)}
                />
                {parametrosError && <p className="text-xs text-destructive mt-1">{parametrosError}</p>}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.watch('compartido')}
                    onChange={(e) => form.setValue('compartido', e.target.checked)}
                  />
                  Compartido con el equipo
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => form.reset()}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={Boolean(createMut?.isPending)}>
                  {Boolean(createMut?.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="Sin filtros guardados"
              description="Guarda combinaciones de filtros para acceder rápidamente."
            />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Módulo</DataTableTh>
                  <DataTableTh>Compartido</DataTableTh>
                  <DataTableTh>Parámetros</DataTableTh>
                  <DataTableTh>Creado</DataTableTh>
                  <DataTableTh className="w-16" />
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {items.map((item: FiltroGuardado) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell>
                      <Badge className="bg-blue-100 text-blue-800" variant="outline">{item.modulo}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge className={item.compartido ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} variant="outline">
                        {item.compartido ? 'Sí' : 'No'}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                      {JSON.stringify(item.parametros)}
                    </DataTableCell>
                    <DataTableCell className="text-sm text-muted-foreground">{formatDate(item.created_at)}</DataTableCell>
                    <DataTableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar filtro</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void onDelete(item.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
