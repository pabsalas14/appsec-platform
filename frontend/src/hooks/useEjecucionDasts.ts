import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { EjecucionDast, EjecucionDastCreate, EjecucionDastUpdate } from '@/lib/schemas/ejecucion_dast.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['ejecucion_dasts'] as const;

export function useEjecucionDasts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<EjecucionDast[]>>('/ejecucion_dasts/');
      return data.data;
    },
  });
}

export function useCreateEjecucionDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EjecucionDastCreate) => {
      const { data } = await api.post<Envelope<EjecucionDast>>('/ejecucion_dasts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEjecucionDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EjecucionDastUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<EjecucionDast>>(`/ejecucion_dasts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEjecucionDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ejecucion_dasts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
