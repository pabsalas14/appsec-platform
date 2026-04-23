import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { PaginatedResponse, User, UserAdminCreate, UserAdminUpdate } from '@/types';

export type UserListParams = {
  role?: string;
  is_active?: boolean;
  q?: string;
  page?: number;
  page_size?: number;
};

export type UserListResult = {
  items: User[];
  pagination: PaginatedResponse<User>['pagination'];
};

async function listUsers(params: UserListParams = {}): Promise<UserListResult> {
  const res = await api.get<PaginatedResponse<User>>('/admin/users', { params });
  return { items: res.data.data, pagination: res.data.pagination };
}

async function createUser(data: UserAdminCreate): Promise<User> {
  const res = await api.post<{ data: User }>('/admin/users', data);
  return res.data.data;
}

async function updateUser({ id, data }: { id: string; data: UserAdminUpdate }): Promise<User> {
  const res = await api.patch<{ data: User }>(`/admin/users/${id}`, data);
  return res.data.data;
}

async function resetPassword({ id, password }: { id: string; password: string }): Promise<void> {
  await api.post(`/admin/users/${id}/reset-password`, { new_password: password });
}

async function deleteUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}

export function useAdminUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => listUsers(params),
    staleTime: 30_000,
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useResetUserPassword() {
  return useMutation({ mutationFn: resetPassword });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
