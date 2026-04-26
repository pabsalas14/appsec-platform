'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
  Badge,
  Button,
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
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Textarea,
} from '@/components/ui';
import {
  useCreateModuleView,
  useDeleteModuleView,
  useModuleViews,
  useUpdateModuleView,
  type ModuleView,
  type ModuleViewCreate,
  type ModuleViewUpdate,
} from '@/hooks/useModuleViews';
import { extractErrorMessage, formatDate } from '@/lib/utils';

const createSchema = z.object({
  nombre: z.string().min(1, 'Name required').max(255),
  module_name: z.string().min(1, 'Module name required').max(100),
  tipo: z.enum(['table', 'kanban', 'calendar', 'cards']),
  columns_config: z.string().optional(),
  filters: z.string().optional(),
  sort_by: z.string().optional(),
  group_by: z.string().optional().nullable(),
  page_size: z.coerce.number().min(5).max(100).default(25),
});
type CreateFormData = z.infer<typeof createSchema>;

const updateSchema = createSchema.partial();
type UpdateFormData = z.infer<typeof updateSchema>;

const VIEW_TYPE_OPTIONS = [
  { value: 'table', label: 'Table' },
  { value: 'kanban', label: 'Kanban' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'cards', label: 'Cards' },
];

const COMMON_MODULES = [
  { value: 'vulnerabilities', label: 'Vulnerabilities' },
  { value: 'releases', label: 'Releases' },
  { value: 'iniciativas', label: 'Initiatives' },
  { value: 'programas_sast', label: 'SAST Programs' },
  { value: 'programas_dast', label: 'DAST Programs' },
  { value: 'auditorias', label: 'Audits' },
  { value: 'hallazgos', label: 'Findings' },
];

function CreateViewDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const createMut = useCreateModuleView();
  const form = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nombre: '',
      module_name: '',
      tipo: 'table',
      columns_config: '',
      filters: '',
      sort_by: '',
      group_by: null,
      page_size: 25,
    },
  });

  const onSubmit = (data: CreateFormData) => {
    try {
      // Parse JSON fields if provided
      const payload: ModuleViewCreate = {
        nombre: data.nombre,
        module_name: data.module_name,
        tipo: data.tipo,
        columns_config: data.columns_config ? JSON.parse(data.columns_config) : {},
        filters: data.filters ? JSON.parse(data.filters) : {},
        sort_by: data.sort_by ? JSON.parse(data.sort_by) : {},
        group_by: data.group_by || null,
        page_size: data.page_size,
      };

      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('View created successfully');
          form.reset();
          onOpenChange(false);
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Failed to create view')),
      });
    } catch (err) {
      toast.error('Invalid JSON in configuration fields');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Module View</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium">View Name *</label>
            <Input placeholder="e.g., Críticas SLA Vencido" {...form.register('nombre')} />
            {form.formState.errors.nombre && (
              <p className="text-xs text-red-500">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Module *</label>
            <Select
              options={COMMON_MODULES}
              {...form.register('module_name')}
              placeholder="Select module"
            />
            {form.formState.errors.module_name && (
              <p className="text-xs text-red-500">{form.formState.errors.module_name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">View Type *</label>
            <Select
              options={VIEW_TYPE_OPTIONS}
              {...form.register('tipo')}
              defaultValue="table"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Page Size</label>
            <Input
              type="number"
              min={5}
              max={100}
              {...form.register('page_size', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Group By Field (optional)</label>
            <Input placeholder="e.g., severity, status" {...form.register('group_by')} />
          </div>

          <div>
            <label className="text-sm font-medium">Columns Config (JSON)</label>
            <Textarea
              placeholder={'[{"field": "titulo", "width": 300, "sortable": true}]'}
              {...form.register('columns_config')}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Filters (JSON)</label>
            <Textarea
              placeholder='{"severity": ["CRITICAL"], "status": "Open"}'
              {...form.register('filters')}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Sort (JSON)</label>
            <Textarea
              placeholder='{"field": "created_at", "direction": "DESC"}'
              {...form.register('sort_by')}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditViewDialog({
  view,
  onClose,
}: {
  view: ModuleView | null;
  onClose: () => void;
}) {
  const updateMut = useUpdateModuleView();
  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: view
      ? {
          nombre: view.nombre,
          tipo: view.tipo,
          group_by: view.group_by,
          page_size: view.page_size,
          columns_config: view.columns_config ? JSON.stringify(view.columns_config, null, 2) : '',
          filters: view.filters ? JSON.stringify(view.filters, null, 2) : '',
          sort_by: view.sort_by ? JSON.stringify(view.sort_by, null, 2) : '',
        }
      : {},
  });

  const onSubmit = (data: UpdateFormData) => {
    if (!view) return;

    try {
      const payload: ModuleViewUpdate = {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.page_size !== undefined && { page_size: data.page_size }),
        ...(data.group_by !== undefined && { group_by: data.group_by || null }),
        ...(data.columns_config && { columns_config: JSON.parse(data.columns_config) }),
        ...(data.filters && { filters: JSON.parse(data.filters) }),
        ...(data.sort_by && { sort_by: JSON.parse(data.sort_by) }),
      };

      updateMut.mutate(
        { id: view.id, data: payload },
        {
          onSuccess: () => {
            toast.success('View updated successfully');
            onClose();
          },
          onError: (err) => toast.error(extractErrorMessage(err, 'Failed to update view')),
        }
      );
    } catch (err) {
      toast.error('Invalid JSON in configuration fields');
    }
  };

  if (!view) return null;

  return (
    <Dialog open={!!view} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit View: {view.nombre}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium">View Name</label>
            <Input placeholder="View name" {...form.register('nombre')} />
          </div>

          <div>
            <label className="text-sm font-medium">View Type</label>
            <Select options={VIEW_TYPE_OPTIONS} {...form.register('tipo')} />
          </div>

          <div>
            <label className="text-sm font-medium">Page Size</label>
            <Input
              type="number"
              min={5}
              max={100}
              {...form.register('page_size', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Group By Field</label>
            <Input placeholder="e.g., severity, status" {...form.register('group_by')} />
          </div>

          <div>
            <label className="text-sm font-medium">Columns Config (JSON)</label>
            <Textarea {...form.register('columns_config')} className="font-mono text-xs" />
          </div>

          <div>
            <label className="text-sm font-medium">Filters (JSON)</label>
            <Textarea {...form.register('filters')} className="font-mono text-xs" />
          </div>

          <div>
            <label className="text-sm font-medium">Sort (JSON)</label>
            <Textarea {...form.register('sort_by')} className="font-mono text-xs" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ModuleViewsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingView, setEditingView] = useState<ModuleView | null>(null);
  const [deleteView, setDeleteView] = useState<ModuleView | null>(null);

  const { data, isLoading } = useModuleViews();
  const deleteMut = useDeleteModuleView();

  const handleDelete = (view: ModuleView) => {
    deleteMut.mutate(view.id, {
      onSuccess: () => {
        toast.success('View deleted');
        setDeleteView(null);
      },
      onError: (err) => toast.error(extractErrorMessage(err, 'Failed to delete view')),
    });
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Module Views"
        description="Create and manage personalized views for modules (table, kanban, calendar, cards)"
      />

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New View
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No module views created yet
        </div>
      ) : (
        <div className="rounded-lg border">
          <DataTable>
            <DataTableHead>
              <DataTableTh>Name</DataTableTh>
              <DataTableTh>Module</DataTableTh>
              <DataTableTh>Type</DataTableTh>
              <DataTableTh>Page Size</DataTableTh>
              <DataTableTh>Created</DataTableTh>
              <DataTableTh className="w-24 text-right">Actions</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {data?.items?.map((view) => (
                <DataTableRow key={view.id}>
                  <DataTableCell className="font-medium">{view.nombre}</DataTableCell>
                  <DataTableCell>{view.module_name}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline">{view.tipo}</Badge>
                  </DataTableCell>
                  <DataTableCell>{view.page_size}</DataTableCell>
                  <DataTableCell className="text-xs text-muted-foreground">
                    {formatDate(view.created_at)}
                  </DataTableCell>
                  <DataTableCell className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingView(view)}
                      title="Edit view"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteView(view)}
                          title="Delete view"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete view</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{deleteView?.nombre}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteView && handleDelete(deleteView)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteMut.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
      )}

      <CreateViewDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditViewDialog view={editingView} onClose={() => setEditingView(null)} />
    </PageWrapper>
  );
}
