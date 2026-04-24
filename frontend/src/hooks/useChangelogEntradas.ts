import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ChangelogEntrada, ChangelogEntradaCreate, ChangelogEntradaUpdate } from '@/lib/schemas/changelog_entrada.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['changelog_entradas'] as const;

export function useChangelogEntradas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ChangelogEntrada[]>>('/changelog_entradas/');
      return data.data;
    },
  });
}

export function useCreateChangelogEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ChangelogEntradaCreate) => {
      const { data } = await api.post<Envelope<ChangelogEntrada>>('/changelog_entradas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateChangelogEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ChangelogEntradaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ChangelogEntrada>>(`/changelog_entradas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteChangelogEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/changelog_entradas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
