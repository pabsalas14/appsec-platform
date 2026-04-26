import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { PaginatedResponse } from '@/types';

/**
 * ModuleView tipos — alineados con el backend.
 * Se re-exportarán de @/types cuando se generen los tipos OpenAPI.
 */
export interface ModuleViewBase {
  nombre: string;
  module_name: string;
  tipo: 'table' | 'kanban' | 'calendar' | 'cards';
  columns_config?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  sort_by?: Record<string, unknown>;
  group_by?: string | null;
  page_size?: number;
}

export interface ModuleView extends ModuleViewBase {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ModuleViewCreate extends ModuleViewBase {}

export interface ModuleViewUpdate {
  nombre?: string;
  tipo?: string;
  columns_config?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  sort_by?: Record<string, unknown>;
  group_by?: string | null;
  page_size?: number;
}

export type ModuleViewListParams = {
  skip?: number;
  limit?: number;
};

export type ModuleViewListResult = {
  items: ModuleView[];
  pagination: PaginatedResponse<ModuleView>['pagination'];
};

async function listViews(params: ModuleViewListParams = {}): Promise<ModuleViewListResult> {
  const res = await api.get<PaginatedResponse<ModuleView>>('/admin/module-views', { params });
  return { items: res.data.data, pagination: res.data.pagination };
}

async function getView(id: string): Promise<ModuleView> {
  const res = await api.get<{ data: ModuleView }>(`/admin/module-views/${id}`);
  return res.data.data;
}

async function createView(data: ModuleViewCreate): Promise<ModuleView> {
  const res = await api.post<{ data: ModuleView }>('/admin/module-views', data);
  return res.data.data;
}

async function updateView({ id, data }: { id: string; data: ModuleViewUpdate }): Promise<ModuleView> {
  const res = await api.patch<{ data: ModuleView }>(`/admin/module-views/${id}`, data);
  return res.data.data;
}

async function deleteView(id: string): Promise<void> {
  await api.delete(`/admin/module-views/${id}`);
}

export function useModuleViews(params: ModuleViewListParams = {}) {
  return useQuery({
    queryKey: ['admin', 'module-views', params],
    queryFn: () => listViews(params),
    staleTime: 30_000,
  });
}

export function useModuleView(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'module-views', id],
    queryFn: () => getView(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateModuleView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createView,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'module-views'] }),
  });
}

export function useUpdateModuleView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateView,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'module-views'] }),
  });
}

export function useDeleteModuleView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteView,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'module-views'] }),
  });
}
