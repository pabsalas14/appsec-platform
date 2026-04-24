import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Iniciativa, IniciativaCreate, IniciativaUpdate } from '@/lib/schemas/iniciativa.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['iniciativas'] as const;

export function useIniciativas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Iniciativa[]>>('/iniciativas/');
      return data.data;
    },
  });
}

export function useCreateIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IniciativaCreate) => {
      const { data } = await api.post<Envelope<Iniciativa>>('/iniciativas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: IniciativaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Iniciativa>>(`/iniciativas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/iniciativas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
