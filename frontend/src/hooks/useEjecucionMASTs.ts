import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { EjecucionMAST, EjecucionMASTCreate, EjecucionMASTUpdate } from '@/lib/schemas/ejecucion_mast.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['ejecucion_masts'] as const;

export function useEjecucionMASTs() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<EjecucionMAST[]>>('/ejecucion_masts/');
      return data.data;
    },
  });
}

export function useCreateEjecucionMAST() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EjecucionMASTCreate) => {
      const { data } = await api.post<Envelope<EjecucionMAST>>('/ejecucion_masts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEjecucionMAST() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EjecucionMASTUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<EjecucionMAST>>(`/ejecucion_masts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEjecucionMAST() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ejecucion_masts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
