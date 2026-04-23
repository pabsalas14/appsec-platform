"use client";

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

import { KanbanCard } from './KanbanCard';

type KanbanColumnProps = {
  id: string;
  title: string;
  tasks: Task[];
};

export function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column', status: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[300px] w-72 shrink-0 flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3',
        isOver && 'ring-2 ring-primary/40',
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Badge variant="default" className="bg-background/60">
          {tasks.length}
        </Badge>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
