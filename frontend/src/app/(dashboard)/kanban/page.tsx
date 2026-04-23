"use client";

import { useState } from 'react';

import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import {
  PageHeader,
  PageWrapper,
  Select,
} from '@/components/ui';
import { useProjects } from '@/hooks/useProjects';

export default function KanbanPage() {
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState<string>('');

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Kanban"
        description="Drag tasks between columns to update their status. State is persisted via PATCH /tasks/:id."
      >
        <div className="min-w-[220px]">
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={projectOptions}
          />
        </div>
      </PageHeader>

      <KanbanBoard projectId={projectId || undefined} />
    </PageWrapper>
  );
}
