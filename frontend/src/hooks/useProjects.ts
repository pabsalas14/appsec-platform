import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse, Project } from '@/types';
import type { ProjectCreateFormData, ProjectUpdateFormData } from '@/lib/schemas/project.schema';

const KEY = ['projects'] as const;

async function listProjects(): Promise<Project[]> {
  const res = await api.get<ApiResponse<Project[]>>('/projects');
  return res.data.data;
}

async function getProject(id: string): Promise<Project> {
  const res = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return res.data.data;
}

async function createProject(data: ProjectCreateFormData): Promise<Project> {
  const res = await api.post<ApiResponse<Project>>('/projects', data);
  return res.data.data;
}

async function updateProject(id: string, data: ProjectUpdateFormData): Promise<Project> {
  const res = await api.patch<ApiResponse<Project>>(`/projects/${id}`, data);
  return res.data.data;
}

async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export function useProjects() {
  return useQuery({ queryKey: KEY, queryFn: listProjects });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => getProject(id as string),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdateFormData }) =>
      updateProject(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
