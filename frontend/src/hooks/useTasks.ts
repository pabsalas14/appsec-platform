import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse, Task } from '@/types';

export type TaskInput = {
  title?: string;
  description?: string | null;
  completed?: boolean;
  status?: string;
  project_id?: string | null;
};

export type UseTasksOptions = {
  projectId?: string;
};

async function fetchTasks(opts: UseTasksOptions = {}): Promise<Task[]> {
  const params: Record<string, string> = {};
  if (opts.projectId) params.project_id = opts.projectId;
  const res = await api.get<ApiResponse<Task[]>>('/tasks', { params });
  return res.data.data;
}

async function createTask(data: TaskInput): Promise<Task> {
  const res = await api.post<ApiResponse<Task>>('/tasks', data);
  return res.data.data;
}

async function updateTask(id: string, data: TaskInput): Promise<Task> {
  const res = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
  return res.data.data;
}

async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export function useTasks(opts: UseTasksOptions = {}) {
  return useQuery({
    queryKey: ['tasks', opts.projectId ?? 'all'],
    queryFn: () => fetchTasks(opts),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskInput }) => updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
