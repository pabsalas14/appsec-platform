import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { OkrCompromiso, OkrCompromisoCreate, OkrCompromisoUpdate } from '@/lib/schemas/okr_compromiso.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['okr_compromisos'] as const;

export function useOkrCompromisos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<OkrCompromiso[]>>('/okr_compromisos/');
      return data.data;
    },
  });
}

export function useCreateOkrCompromiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OkrCompromisoCreate) => {
      const { data } = await api.post<Envelope<OkrCompromiso>>('/okr_compromisos/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOkrCompromiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OkrCompromisoUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<OkrCompromiso>>(`/okr_compromisos/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOkrCompromiso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/okr_compromisos/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
