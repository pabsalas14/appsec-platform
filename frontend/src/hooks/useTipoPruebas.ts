import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { TipoPrueba, TipoPruebaCreate, TipoPruebaUpdate } from '@/lib/schemas/tipo_prueba.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['tipo_pruebas'] as const;

export function useTipoPruebas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<TipoPrueba[]>>('/tipo_pruebas/');
      return data.data;
    },
  });
}

export function useCreateTipoPrueba() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TipoPruebaCreate) => {
      const { data } = await api.post<Envelope<TipoPrueba>>('/tipo_pruebas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTipoPrueba() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: TipoPruebaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<TipoPrueba>>(`/tipo_pruebas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTipoPrueba() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tipo_pruebas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
