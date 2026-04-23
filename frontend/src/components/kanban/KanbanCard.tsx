"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Task } from '@/types';

type KanbanCardProps = {
  task: Task;
  overlay?: boolean;
};

export function KanbanCard({ task, overlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group rounded-md border border-border bg-card p-3 shadow-sm text-left',
        'hover:border-primary/40 transition-colors cursor-grab active:cursor-grabbing',
        (isDragging || overlay) && 'opacity-70 ring-2 ring-primary/50',
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{task.title}</div>
          {task.description && (
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</div>
          )}
        </div>
      </div>
    </div>
  );
}
