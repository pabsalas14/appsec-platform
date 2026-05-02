"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Circle, ListTodo, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
  PremiumPageHeader,
  PageWrapper,
  premiumShellCardClass,
  Select,
} from '@/components/ui';
import { useProjects } from '@/hooks/useProjects';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '@/hooks/useTasks';
import { cn, extractErrorMessage, formatDate } from '@/lib/utils';
import type { Task } from '@/types';

const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000),
  status: z.enum(TASK_STATUSES),
  completed: z.boolean(),
  project_id: z.string(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

function TaskForm({
  task,
  onSuccess,
}: {
  task?: Task;
  onSuccess: () => void;
}) {
  const createMut = useCreateTask();
  const updateMut = useUpdateTask();
  const { data: projects } = useProjects();
  const isEdit = !!task;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: ((task?.status as (typeof TASK_STATUSES)[number]) ?? 'todo'),
      completed: task?.completed ?? false,
      project_id: task?.project_id ?? '',
    },
  });

  const pending = createMut.isPending || updateMut.isPending;

  const onSubmit = (data: TaskFormData) => {
    const payload = {
      ...data,
      project_id: data.project_id || null,
    };
    const mutation = isEdit
      ? updateMut.mutateAsync({ id: task!.id, data: payload })
      : createMut.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(isEdit ? 'Task updated' : 'Task created');
        form.reset();
        onSuccess();
      })
      .catch((err) => toast.error(extractErrorMessage(err, 'Failed to save task')));
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="title" className="text-sm font-medium text-foreground">Title</label>
        <Input id="title" {...form.register('title')} placeholder="What needs to be done?" className="mt-1" />
        {form.formState.errors.title && (
          <p className="mt-1 text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-foreground">Description</label>
        <textarea
          id="description"
          {...form.register('description')}
          rows={3}
          placeholder="Optional details..."
          className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="status" className="text-sm font-medium text-foreground">Status</label>
          <Select
            id="status"
            {...form.register('status')}
            className="mt-1"
            options={TASK_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
          />
        </div>
        <div>
          <label htmlFor="project_id" className="text-sm font-medium text-foreground">Project</label>
          <Select
            id="project_id"
            {...form.register('project_id')}
            className="mt-1"
            placeholder="— None —"
            options={(projects ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register('completed')} className="h-4 w-4 rounded border-input" />
        Mark as completed
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export default function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const { data: tasks, isLoading, isError } = useTasks();
  const { data: projects } = useProjects();
  const deleteMut = useDeleteTask();
  const updateMut = useUpdateTask();

  const projectById = new Map((projects ?? []).map((p) => [p.id, p]));

  return (
    <PageWrapper className="mx-auto max-w-6xl space-y-6 p-6">
      <PremiumPageHeader
        eyebrow="Workspace"
        icon={ListTodo}
        title="Tasks"
        description="AppSec CRUD demo — crear, editar, eliminar, cambiar estado y enlazar a proyectos."
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button id="create-task-btn">
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <TaskForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </PremiumPageHeader>

      {isLoading && (
        <Card className={premiumShellCardClass}>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className={premiumShellCardClass}>
          <CardContent className="py-12 text-center text-destructive">
            Failed to load tasks. Make sure the backend is running.
          </CardContent>
        </Card>
      )}

      {tasks && tasks.length === 0 && (
        <Card className={premiumShellCardClass}>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tasks yet. Click <strong>New Task</strong> to create one.
          </CardContent>
        </Card>
      )}

      {tasks && tasks.length > 0 && (
        <Card className={cn(premiumShellCardClass, 'overflow-hidden border-0 p-0')}>
        <DataTable>
          <DataTableHead>
            <DataTableTh className="w-[40px]" />
            <DataTableTh>Title</DataTableTh>
            <DataTableTh>Project</DataTableTh>
            <DataTableTh>Status</DataTableTh>
            <DataTableTh>Created</DataTableTh>
            <DataTableTh className="text-right">Actions</DataTableTh>
          </DataTableHead>
          <DataTableBody>
            {tasks.map((task) => (
              <DataTableRow key={task.id}>
                <DataTableCell>
                  <button
                    onClick={() =>
                      updateMut.mutate({
                        id: task.id,
                        data: { completed: !task.completed },
                      })
                    }
                    className="text-muted-foreground transition-colors hover:text-primary"
                    title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                </DataTableCell>

                <DataTableCell
                  className={cn('font-medium', task.completed && 'text-muted-foreground line-through')}
                >
                  {task.title}
                </DataTableCell>

                <DataTableCell className="text-muted-foreground">
                  {task.project_id
                    ? projectById.get(task.project_id)?.name ?? '—'
                    : '—'}
                </DataTableCell>

                <DataTableCell>
                  <Badge variant="default" className="text-xs capitalize">
                    {task.status?.replace('_', ' ') ?? (task.completed ? 'done' : 'todo')}
                  </Badge>
                </DataTableCell>

                <DataTableCell className="text-sm text-muted-foreground">
                  {formatDate(task.created_at)}
                </DataTableCell>

                <DataTableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Dialog
                      open={editTask?.id === task.id}
                      onOpenChange={(open) => setEditTask(open ? task : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" id={`edit-task-${task.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Task</DialogTitle>
                        </DialogHeader>
                        <TaskForm task={task} onSuccess={() => setEditTask(null)} />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          id={`delete-task-${task.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{task.title}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteMut.mutate(task.id, {
                                onSuccess: () => toast.success('Task deleted'),
                                onError: (err) =>
                                  toast.error(extractErrorMessage(err, 'Failed to delete')),
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
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
        </Card>
      )}
    </PageWrapper>
  );
}
