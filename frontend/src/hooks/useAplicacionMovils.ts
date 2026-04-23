import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { AplicacionMovil, AplicacionMovilCreate, AplicacionMovilUpdate } from '@/lib/schemas/aplicacion_movil.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['aplicacion_movils'] as const;

export function useAplicacionMovils() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<AplicacionMovil[]>>('/aplicacion_movils/');
      return data.data;
    },
  });
}

export function useCreateAplicacionMovil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AplicacionMovilCreate) => {
      const { data } = await api.post<Envelope<AplicacionMovil>>('/aplicacion_movils/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAplicacionMovil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: AplicacionMovilUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<AplicacionMovil>>(`/aplicacion_movils/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAplicacionMovil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/aplicacion_movils/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
