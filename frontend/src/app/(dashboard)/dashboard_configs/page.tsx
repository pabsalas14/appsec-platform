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
  Switch,
} from '@/components/ui';
import {
  useCreateDashboardConfig,
  useDashboardConfigs,
  useDeleteDashboardConfig,
  useUpdateDashboardConfig,
} from '@/hooks/useDashboardConfigs';
import { useRoles } from '@/hooks/useRoles';
import { logger } from '@/lib/logger';
import { DashboardConfigCreateSchema, type DashboardConfig, type DashboardConfigCreate } from '@/lib/schemas/dashboard_config.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const formSchema = DashboardConfigCreateSchema;
type FormData = z.infer<typeof formSchema>;

function FormFields({
  initial,
  onSuccess,
  roleOptions,
}: {
  initial?: DashboardConfig | null;
  onSuccess: () => void;
  roleOptions: { value: string; label: string }[];
}) {
  const createMut = useCreateDashboardConfig();
  const updateMut = useUpdateDashboardConfig();
  const isEdit = Boolean(initial);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          dashboard_id: initial.dashboard_id,
          widget_id: initial.widget_id,
          role_id: initial.role_id,
          visible: initial.visible,
          editable_by_role: initial.editable_by_role,
        }
      : {
          dashboard_id: 'home',
          widget_id: '',
          role_id: roleOptions[0]?.value ?? '',
          visible: true,
          editable_by_role: false,
        },
  });
  const pending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!initial && roleOptions[0] && !form.getValues('role_id')) {
      form.setValue('role_id', roleOptions[0].value);
    }
  }, [initial, roleOptions, form]);

  const onSubmit = form.handleSubmit((data) => {
    const payload: DashboardConfigCreate = {
      dashboard_id: data.dashboard_id.trim(),
      widget_id: data.widget_id.trim(),
      role_id: data.role_id,
      visible: data.visible,
      editable_by_role: data.editable_by_role,
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
            logger.error('dashboard_config.update.failed', { id: initial.id, error: e });
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
          logger.error('dashboard_config.create.failed', { error: e });
          toast.error(extractErrorMessage(e, 'Error al crear'));
        },
      });
    }
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Dashboard ID</label>
        <Input className="mt-1" placeholder="home" {...form.register('dashboard_id')} />
      </div>
      <div>
        <label className="text-sm font-medium">Widget ID</label>
        <Input className="mt-1" {...form.register('widget_id')} />
      </div>
      <div>
        <label className="text-sm font-medium">Rol</label>
        <Select
          className="mt-1"
          value={form.watch('role_id')}
          onChange={(e) => form.setValue('role_id', e.target.value, { shouldValidate: true })}
          options={roleOptions}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">Visible</span>
        <Switch checked={form.watch('visible')} onCheckedChange={(v) => form.setValue('visible', v)} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">Editable por rol</span>
        <Switch
          checked={form.watch('editable_by_role')}
          onCheckedChange={(v) => form.setValue('editable_by_role', v)}
        />
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

export default function DashboardConfigsPage() {
  const { data: roles, isError: rolesErr } = useRoles();
  const { data: rows, isLoading, isError } = useDashboardConfigs();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<DashboardConfig | null>(null);
  const deleteMut = useDeleteDashboardConfig();

  const roleOptions = useMemo(
    () => (roles ?? []).map((r) => ({ value: r.id, label: r.name })),
    [roles],
  );
  const roleName = useCallback(
    (id: string) => (roles ?? []).find((r) => r.id === id)?.name ?? id.slice(0, 8),
    [roles],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.dashboard_id.toLowerCase().includes(n) ||
        r.widget_id.toLowerCase().includes(n) ||
        roleName(r.role_id).toLowerCase().includes(n),
    );
  }, [rows, q, roleName]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Configuración de dashboards"
        description="Visibilidad de widgets por rol (usa catálogo de roles de administración)."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva configuración</DialogTitle>
            </DialogHeader>
            <FormFields onSuccess={() => setCreateOpen(false)} roleOptions={roleOptions} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {rolesErr && <p className="text-destructive">No se pudieron cargar los roles (¿admin autenticado?).</p>}

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 max-w-md">
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />}
          {isError && <p className="text-destructive">Error al cargar configuraciones.</p>}
          {rows && !rows.length && !isLoading && <p className="text-muted-foreground">Sin filas.</p>}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Dashboard / widget</DataTableTh>
                  <DataTableTh>Rol</DataTableTh>
                  <DataTableTh>Vis.</DataTableTh>
                  <DataTableTh>Edit.</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[100px]"> </DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell>
                      <div className="text-xs text-muted-foreground">{item.dashboard_id}</div>
                      <div className="font-mono text-sm">{item.widget_id}</div>
                    </DataTableCell>
                    <DataTableCell>{roleName(item.role_id)}</DataTableCell>
                    <DataTableCell>{item.visible ? 'Sí' : 'No'}</DataTableCell>
                    <DataTableCell>{item.editable_by_role ? 'Sí' : 'No'}</DataTableCell>
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
                                      logger.error('dashboard_config.delete.failed', { id: item.id, error: e });
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
            <DialogTitle>Editar configuración</DialogTitle>
          </DialogHeader>
          {edit && <FormFields key={edit.id} initial={edit} onSuccess={() => setEdit(null)} roleOptions={roleOptions} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
