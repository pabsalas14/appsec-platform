"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { FolderKanban, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Input,
  PageHeader,
  PageWrapper,
  Select,
} from '@/components/ui';
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from '@/hooks/useProjects';
import {
  PROJECT_STATUSES,
  projectCreateSchema,
  type ProjectCreateFormData,
} from '@/lib/schemas/project.schema';
import { cn, extractErrorMessage, formatDate } from '@/lib/utils';
import type { Project } from '@/types';

const STATUS_TONE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  paused: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  completed: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  archived: 'bg-muted text-muted-foreground border-border',
};

function ProjectForm({
  project,
  onSuccess,
}: {
  project?: Project;
  onSuccess: () => void;
}) {
  const createMut = useCreateProject();
  const updateMut = useUpdateProject();
  const isEdit = !!project;

  const form = useForm<ProjectCreateFormData>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: (project?.status as ProjectCreateFormData['status']) ?? 'active',
      color: project?.color ?? '',
    },
  });

  const isPending = createMut.isPending || updateMut.isPending;

  const onSubmit = (data: ProjectCreateFormData) => {
    const mutation = isEdit
      ? updateMut.mutateAsync({ id: project!.id, data })
      : createMut.mutateAsync(data);

    mutation
      .then(() => {
        toast.success(isEdit ? 'Project updated' : 'Project created');
        form.reset();
        onSuccess();
      })
      .catch((err) => toast.error(extractErrorMessage(err, 'Failed to save project')));
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium" htmlFor="name">Name</label>
        <Input id="name" {...form.register('name')} placeholder="Project name" className="mt-1" />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="description">Description</label>
        <textarea
          id="description"
          {...form.register('description')}
          rows={3}
          className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium" htmlFor="status">Status</label>
          <Select
            id="status"
            {...form.register('status')}
            className="mt-1"
            options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="color">Color (optional)</label>
          <Input id="color" {...form.register('color')} placeholder="#ef4444" className="mt-1" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const deleteMut = useDeleteProject();

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Projects"
        description="Entidad CRUD con relación a Tasks — demuestra el patrón de scaffold y navegación anidada."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <ProjectForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {!isLoading && (projects?.length ?? 0) === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Crea tu primer proyecto para empezar a agrupar tareas relacionadas."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Project
            </Button>
          }
        />
      )}

      {!isLoading && (projects?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <Card key={project.id} className="relative">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${project.id}`}
                      className="block truncate text-base font-semibold text-foreground hover:text-primary"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {project.description || 'No description'}
                    </p>
                  </div>
                  {project.color && (
                    <div
                      className="h-4 w-4 shrink-0 rounded-full border border-border"
                      style={{ background: project.color }}
                      aria-label="color"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="default"
                    className={cn('text-xs capitalize', STATUS_TONE[project.status] ?? STATUS_TONE.archived)}
                  >
                    {project.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(project.created_at)}</span>
                </div>

                <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(project)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{project.name}&quot;. Tasks inside
                          will be unlinked (not deleted).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteMut.mutate(project.id, {
                              onSuccess: () => toast.success('Project deleted'),
                              onError: (err) => toast.error(extractErrorMessage(err, 'Failed')),
                            })
                          }
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editing && <ProjectForm project={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
