"use client";

import { Loader2, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  PageWrapper,
} from '@/components/ui';
import { useProject } from '@/hooks/useProjects';
import { useCreateTask, useTasks } from '@/hooks/useTasks';
import { cn, formatDate } from '@/lib/utils';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id;

  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: tasks, isLoading: loadingTasks } = useTasks({ projectId });

  if (loadingProject) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Project not found.{' '}
        <button onClick={() => router.push('/projects')} className="text-primary underline">
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            {project.color && (
              <span
                className="h-4 w-4 rounded-full border border-border"
                style={{ background: project.color }}
              />
            )}
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <Badge variant="default" className="capitalize">{project.status}</Badge>
          </div>
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground/80">
            Created {formatDate(project.created_at)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks {tasks ? `(${tasks.length})` : ''}</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Total tasks</div>
                <div className="mt-1 text-2xl font-bold">{tasks?.length ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Completed</div>
                <div className="mt-1 text-2xl font-bold">
                  {tasks?.filter((t) => t.completed).length ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">In progress</div>
                <div className="mt-1 text-2xl font-bold">
                  {tasks?.filter((t) => t.status === 'in_progress').length ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <ProjectTasks projectId={project.id} tasks={tasks ?? []} isLoading={loadingTasks} />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Audit-logs filtered by <code>entity_type=project</code> and{' '}
              <code>entity_id={project.id.slice(0, 8)}…</code> will live here. Wire to{' '}
              <code>/admin/audit-logs</code> once permissions allow.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

function ProjectTasks({
  projectId,
  tasks,
  isLoading,
}: {
  projectId: string;
  tasks: { id: string; title: string; status: string; completed: boolean; created_at: string }[];
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const createMut = useCreateTask();

  const add = () => {
    if (!title.trim()) return;
    createMut.mutate(
      { title: title.trim(), project_id: projectId, status: 'todo', completed: false },
      {
        onSuccess: () => {
          setTitle('');
          setOpen(false);
        },
      },
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-sm font-medium">Tasks in this project</span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New task</DialogTitle>
              </DialogHeader>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <div className="flex justify-end">
                <Button onClick={add} disabled={createMut.isPending}>
                  {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No tasks in this project yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    t.completed ? 'bg-emerald-400' : 'bg-amber-400',
                  )}
                />
                <span className="flex-1 truncate text-sm">{t.title}</span>
                <Badge variant="default" className="text-xs capitalize">
                  {t.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
