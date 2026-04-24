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
import {
  useCreateOrganizacion,
  useDeleteOrganizacion,
  useOrganizacions,
  useUpdateOrganizacion,
} from '@/hooks/useOrganizacions';
import { useGerencias } from '@/hooks/useGerencias';
import {
  OrganizacionCreateSchema,
  type Organizacion,
  type OrganizacionCreate,
} from '@/lib/schemas/organizacion.schema';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const PLATFORMS = [
  { value: 'GitHub', label: 'GitHub' },
  { value: 'Atlassian', label: 'Atlassian' },
  { value: 'Otro', label: 'Otro' },
] as const;

const formSchema = OrganizacionCreateSchema;
type FormData = z.infer<typeof formSchema>;

function OrganizacionForm({
  initial,
  onSuccess,
}: {
  initial?: Organizacion | null;
  onSuccess: () => void;
}) {
  const { data: gerencias } = useGerencias();
  const createMut = useCreateOrganizacion();
  const updateMut = useUpdateOrganizacion();
  const isEdit = Boolean(initial);
  const gerOptions = (gerencias ?? []).map((g) => ({ value: g.id, label: g.nombre }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          codigo: initial.codigo,
          descripcion: initial.descripcion ?? null,
          gerencia_id: initial.gerencia_id,
          plataforma: (initial.plataforma as FormData['plataforma']) || 'GitHub',
          url_base: initial.url_base ?? null,
          responsable: initial.responsable ?? null,
        }
      : {
          nombre: '',
          codigo: '',
          descripcion: null,
          gerencia_id: gerOptions[0]?.value ?? '',
          plataforma: 'GitHub',
          url_base: null,
          responsable: null,
        },
  });

  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = form.handleSubmit((data) => {
    const payload: OrganizacionCreate = {
      nombre: data.nombre.trim(),
      codigo: data.codigo.trim(),
      descripcion: data.descripcion?.trim() || null,
      gerencia_id: data.gerencia_id,
      plataforma: data.plataforma,
      url_base: data.url_base?.trim() || null,
      responsable: data.responsable?.trim() || null,
    };
    if (isEdit && initial) {
      updateMut.mutate(
        { id: initial.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Organización actualizada');
            onSuccess();
          },
          onError: (e) => toast.error(extractErrorMessage(e, 'Error al guardar')),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Organización creada');
          onSuccess();
        },
        onError: (e) => toast.error(extractErrorMessage(e, 'Error al crear')),
      });
    }
  });

  if (!gerOptions.length) {
    return (
      <p className="text-sm text-amber-600">Primero crea al menos una gerencia en /gerencias</p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium">Gerencia</label>
        <Select
          className="mt-1"
          value={form.watch('gerencia_id')}
          onChange={(e) => form.setValue('gerencia_id', e.target.value, { shouldValidate: true })}
          options={gerOptions}
          placeholder="Selecciona gerencia"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input className="mt-1" {...form.register('nombre')} />
        {form.formState.errors.nombre && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Código</label>
        <Input className="mt-1" {...form.register('codigo')} />
        {form.formState.errors.codigo && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.codigo.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Plataforma (BRD §3.1)</label>
        <Select
          className="mt-1"
          value={form.watch('plataforma')}
          onChange={(e) => form.setValue('plataforma', e.target.value, { shouldValidate: true })}
          options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">URL base</label>
        <Input className="mt-1" type="url" placeholder="https://…" {...form.register('url_base')} />
      </div>
      <div>
        <label className="text-sm font-medium">Responsable de la organización</label>
        <Input className="mt-1" {...form.register('responsable')} />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea className="mt-1" rows={2} {...form.register('descripcion')} />
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

export default function OrganizacionsPage() {
  const { data: rows, isLoading, isError } = useOrganizacions();
  const { data: gerencias } = useGerencias();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Organizacion | null>(null);
  const deleteMut = useDeleteOrganizacion();

  const gerById = useMemo(
    () => new Map((gerencias ?? []).map((g) => [g.id, g])),
    [gerencias],
  );

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const n = q.trim().toLowerCase();
    return list.filter((r) => {
      const g = gerById.get(r.gerencia_id);
      return (
        r.nombre.toLowerCase().includes(n) ||
        r.codigo.toLowerCase().includes(n) ||
        r.plataforma.toLowerCase().includes(n) ||
        (g && g.nombre.toLowerCase().includes(n))
      );
    });
  }, [rows, q, gerById]);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Organizaciones (GitHub/Atlassian)"
        description="BRD §3.1 — N organizaciones por gerencia. Plataforma, URL base y responsable."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva organización</DialogTitle>
            </DialogHeader>
            <OrganizacionForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 max-w-md">
            <label className="text-sm font-medium">Buscar</label>
            <Input
              className="mt-1"
              placeholder="Nombre, código, plataforma o gerencia…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-destructive">No se pudo cargar el catálogo.</p>}
          {rows && rows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No hay organizaciones. Crea gerencias primero.</p>
          )}
          {filtered && filtered.length > 0 && (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Nombre</DataTableTh>
                  <DataTableTh>Código</DataTableTh>
                  <DataTableTh>Gerencia</DataTableTh>
                  <DataTableTh>Plataforma</DataTableTh>
                  <DataTableTh>URL</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh className="w-[120px]">Acciones</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-medium">{item.nombre}</DataTableCell>
                    <DataTableCell>{item.codigo}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">
                      {gerById.get(item.gerencia_id)?.nombre ?? '—'}
                    </DataTableCell>
                    <DataTableCell>{item.plataforma}</DataTableCell>
                    <DataTableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                      {item.url_base ?? '—'}
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(item.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="xs" onClick={() => setEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="ghost" size="xs">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar organización?</AlertDialogTitle>
                              <AlertDialogDescription>Acción permanente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMut.mutate(item.id, {
                                    onSuccess: () => toast.success('Eliminada'),
                                    onError: (e) =>
                                      toast.error(extractErrorMessage(e, 'No se pudo eliminar')),
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar organización</DialogTitle>
          </DialogHeader>
          {edit && (
            <OrganizacionForm key={edit.id} initial={edit} onSuccess={() => setEdit(null)} />
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
