import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HerramientaExterna, HerramientaExternaCreate, HerramientaExternaUpdate } from '@/lib/schemas/herramienta_externa.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['herramienta_externas'] as const;

export function useHerramientaExternas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HerramientaExterna[]>>('/herramienta_externas/');
      return data.data;
    },
  });
}

export function useCreateHerramientaExterna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HerramientaExternaCreate) => {
      const { data } = await api.post<Envelope<HerramientaExterna>>('/herramienta_externas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHerramientaExterna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HerramientaExternaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HerramientaExterna>>(`/herramienta_externas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHerramientaExterna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/herramienta_externas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
