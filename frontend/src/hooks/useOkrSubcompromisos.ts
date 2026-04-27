import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { OkrSubcompromiso, OkrSubcompromisoCreate, OkrSubcompromisoUpdate } from '@/lib/schemas/okr_subcompromiso.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['okr_subcompromisos'] as const;

export function useOkrSubcompromisos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<OkrSubcompromiso[]>>('/okr_subcompromisos/');
      return data.data;
    },
  });
}

export function useCreateOkrSubcompromiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OkrSubcompromisoCreate) => {
      const { data } = await api.post<Envelope<OkrSubcompromiso>>('/okr_subcompromisos/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOkrSubcompromiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OkrSubcompromisoUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<OkrSubcompromiso>>(`/okr_subcompromisos/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOkrSubcompromiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/okr_subcompromisos/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
