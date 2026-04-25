import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ServiceRelease, ServiceReleaseCreate, ServiceReleaseUpdate } from '@/lib/schemas/service_release.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['service_releases'] as const;

export type ServiceReleasesListParams = {
  servicio_id?: string;
  estado_actual?: string;
  jira?: string;
  creado_desde?: string;
  creado_hasta?: string;
};

function listParamsToQuery(p?: ServiceReleasesListParams): Record<string, string> | undefined {
  if (!p) return undefined;
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(p) as [keyof ServiceReleasesListParams, string | undefined][]) {
    if (v !== undefined && v !== '') o[k] = v;
  }
  return Object.keys(o).length ? o : undefined;
}

export function useServiceReleases(params?: ServiceReleasesListParams) {
  const q = listParamsToQuery(params);
  return useQuery({
    queryKey: [...KEY, q ?? {}] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ServiceRelease[]>>('/service_releases/', {
        params: q,
      });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service_releases'] }),
  });
}

export function useUpdateServiceRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ServiceReleaseUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ServiceRelease>>(`/service_releases/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service_releases'] }),
  });
}

export function useDeleteServiceRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/service_releases/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service_releases'] }),
  });
}
