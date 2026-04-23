import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse, SystemSetting } from '@/types';

async function listSettings(): Promise<SystemSetting[]> {
  const res = await api.get<ApiResponse<SystemSetting[]>>('/admin/settings');
  return res.data.data;
}

type UpsertInput = { key: string; value: unknown; description?: string };

async function upsertSetting({ key, value, description }: UpsertInput): Promise<SystemSetting> {
  const res = await api.put<ApiResponse<SystemSetting>>(`/admin/settings/${key}`, {
    value,
    description,
  });
  return res.data.data;
}

export function useSystemSettings() {
  return useQuery({ queryKey: ['admin', 'settings'], queryFn: listSettings });
}

export function useUpsertSystemSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertSetting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}
