import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse, Permission, Role } from '@/types';

async function listRoles(): Promise<Role[]> {
  const res = await api.get<ApiResponse<Role[]>>('/admin/roles');
  return res.data.data;
}

async function listPermissions(): Promise<Permission[]> {
  const res = await api.get<ApiResponse<Permission[]>>('/admin/roles/_permissions');
  return res.data.data;
}

type CreateRoleInput = { name: string; description?: string; permissions: string[] };
type UpdateRoleInput = { description?: string; permissions?: string[] };

async function createRole(data: CreateRoleInput): Promise<Role> {
  const res = await api.post<ApiResponse<Role>>('/admin/roles', data);
  return res.data.data;
}

async function updateRole({ id, data }: { id: string; data: UpdateRoleInput }): Promise<Role> {
  const res = await api.patch<ApiResponse<Role>>(`/admin/roles/${id}`, data);
  return res.data.data;
}

async function deleteRole(id: string): Promise<void> {
  await api.delete(`/admin/roles/${id}`);
}

export function useRoles() {
  return useQuery({ queryKey: ['admin', 'roles'], queryFn: listRoles });
}

export function usePermissions() {
  return useQuery({ queryKey: ['admin', 'permissions'], queryFn: listPermissions });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'roles'] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'roles'] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'roles'] }),
  });
}
