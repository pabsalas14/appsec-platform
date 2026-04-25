import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Dashboard, DashboardCreate, DashboardUpdate } from '@/schemas/dashboard-schema';

interface DashboardFilters {
  search?: string;
  is_system?: boolean;
}

export function useDashboard(id?: string) {
  return useQuery({
    queryKey: ['dashboard', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get(`/api/v1/dashboards/${id}`);
      return response.data.data as Dashboard;
    },
    enabled: !!id,
  });
}

export function useDashboards(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboards', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.is_system !== undefined) params.append('is_system', String(filters.is_system));
      
      const response = await apiClient.get(`/api/v1/dashboards?${params.toString()}`);
      return response.data.data as Dashboard[];
    },
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DashboardCreate) => {
      const response = await apiClient.post('/api/v1/dashboards', data);
      return response.data.data as Dashboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useUpdateDashboard(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DashboardUpdate) => {
      const response = await apiClient.patch(`/api/v1/dashboards/${id}`, data);
      return response.data.data as Dashboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/dashboards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}
