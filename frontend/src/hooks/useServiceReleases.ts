import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ServiceRelease, ServiceReleaseCreate, ServiceReleaseUpdate } from '@/lib/schemas/service_release.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['service_releases'] as const;

export function useServiceReleases() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ServiceRelease[]>>('/service_releases/');
      return data.data;
    },
  });
}

export function useCreateServiceRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ServiceReleaseCreate) => {
      const { data } = await api.post<Envelope<ServiceRelease>>('/service_releases/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateServiceRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ServiceReleaseUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ServiceRelease>>(`/service_releases/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteServiceRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/service_releases/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
