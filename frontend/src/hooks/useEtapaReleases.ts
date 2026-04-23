import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { EtapaRelease, EtapaReleaseCreate, EtapaReleaseUpdate } from '@/lib/schemas/etapa_release.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['etapa_releases'] as const;

export function useEtapaReleases() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<EtapaRelease[]>>('/etapa_releases/');
      return data.data;
    },
  });
}

export function useCreateEtapaRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EtapaReleaseCreate) => {
      const { data } = await api.post<Envelope<EtapaRelease>>('/etapa_releases/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEtapaRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EtapaReleaseUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<EtapaRelease>>(`/etapa_releases/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEtapaRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/etapa_releases/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
