"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';

import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import type { Task } from '@/types';

import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';

export const KANBAN_COLUMNS: Array<{ id: string; title: string }> = [
  { id: 'todo', title: 'To do' },
  { id: 'in_progress', title: 'In progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

type KanbanBoardProps = {
  projectId?: string;
};

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: tasks = [] } = useTasks(projectId ? { projectId } : {});
  const updateTask = useUpdateTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const columns = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const col of KANBAN_COLUMNS) groups[col.id] = [];
    for (const task of tasks) {
      const status = KANBAN_COLUMNS.some((c) => c.id === task.status) ? task.status : 'todo';
      groups[status].push(task);
    }
    return groups;
  }, [tasks]);

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find((t) => t.id === e.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    const overData = over.data.current as { type?: string; status?: string; task?: Task } | undefined;
    const targetStatus =
      overData?.type === 'column'
        ? overData.status
        : overData?.type === 'task'
          ? overData.task?.status
          : undefined;

    if (!targetStatus || targetStatus === activeTaskData.status) return;

    updateTask.mutate({
      id: activeTaskData.id,
      data: { status: targetStatus },
    });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn key={col.id} id={col.id} title={col.title} tasks={columns[col.id] ?? []} />
        ))}
      </div>
      <DragOverlay>{activeTask ? <KanbanCard task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
