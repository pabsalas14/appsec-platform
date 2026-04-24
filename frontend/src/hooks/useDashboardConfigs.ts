import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { DashboardConfig, DashboardConfigCreate, DashboardConfigUpdate } from '@/lib/schemas/dashboard_config.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['dashboard_configs'] as const;
const VISIBILITY_KEY = ['dashboard_configs', 'visibility'] as const;

export type DashboardVisibility = {
  dashboard_id: string;
  role: string;
  default_visible: boolean;
  widgets: Record<string, { visible: boolean; editable_by_role: boolean }>;
};

export function useDashboardConfigs() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<DashboardConfig[]>>('/dashboard_configs/');
      return data.data;
    },
  });
}

export function useCreateDashboardConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DashboardConfigCreate) => {
      const { data } = await api.post<Envelope<DashboardConfig>>('/dashboard_configs/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDashboardConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: DashboardConfigUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<DashboardConfig>>(`/dashboard_configs/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDashboardConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dashboard_configs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMyDashboardVisibility(dashboardId = 'home') {
  return useQuery({
    queryKey: [...VISIBILITY_KEY, dashboardId],
    queryFn: async () => {
      const { data } = await api.get<Envelope<DashboardVisibility>>(
        `/dashboard_configs/my-visibility?dashboard_id=${encodeURIComponent(dashboardId)}`
      );
      return data.data;
    },
    staleTime: 60_000,
  });
}
