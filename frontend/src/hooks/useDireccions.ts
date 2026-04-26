import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Direccion, DireccionCreate, DireccionUpdate } from '@/lib/schemas/direccion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['direccions'] as const;

export function useDireccions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Direccion[]>>('/direccions/');
      return data.data;
    },
  });
}

export function useCreateDireccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DireccionCreate) => {
      const { data } = await api.post<Envelope<Direccion>>('/direccions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDireccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: DireccionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Direccion>>(`/direccions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDireccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/direccions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
