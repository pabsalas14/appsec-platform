import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Celula, CelulaCreate, CelulaUpdate } from '@/lib/schemas/celula.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['celulas'] as const;

export function useCelulas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Celula[]>>('/celulas/');
      return data.data;
    },
  });
}

export function useCreateCelula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CelulaCreate) => {
      const { data } = await api.post<Envelope<Celula>>('/celulas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCelula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: CelulaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Celula>>(`/celulas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCelula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/celulas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
