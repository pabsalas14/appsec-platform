import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { TemaEmergente, TemaEmergenteCreate, TemaEmergenteUpdate } from '@/lib/schemas/tema_emergente.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['temas_emergentes'] as const;

export function useTemaEmergentes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<TemaEmergente[]>>('/temas_emergentes/');
      return data.data;
    },
  });
}

export function useCreateTemaEmergente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TemaEmergenteCreate) => {
      const { data } = await api.post<Envelope<TemaEmergente>>('/temas_emergentes/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTemaEmergente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: TemaEmergenteUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<TemaEmergente>>(`/temas_emergentes/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTemaEmergente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/temas_emergentes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
