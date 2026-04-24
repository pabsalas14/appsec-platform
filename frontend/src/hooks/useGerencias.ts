import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Gerencia, GerenciaCreate, GerenciaUpdate } from '@/lib/schemas/gerencia.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['gerencias'] as const;

export function useGerencias() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Gerencia[]>>('/gerencias/');
      return data.data;
    },
  });
}

export function useCreateGerencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GerenciaCreate) => {
      const { data } = await api.post<Envelope<Gerencia>>('/gerencias/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateGerencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: GerenciaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Gerencia>>(`/gerencias/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGerencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gerencias/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
