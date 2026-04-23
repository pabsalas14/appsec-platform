import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Subdireccion, SubdireccionCreate, SubdireccionUpdate } from '@/lib/schemas/subdireccion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['subdireccions'] as const;

export function useSubdireccions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Subdireccion[]>>('/subdireccions/');
      return data.data;
    },
  });
}

export function useCreateSubdireccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubdireccionCreate) => {
      const { data } = await api.post<Envelope<Subdireccion>>('/subdireccions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSubdireccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: SubdireccionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Subdireccion>>(`/subdireccions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSubdireccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subdireccions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
