import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HitoIniciativa, HitoIniciativaCreate, HitoIniciativaUpdate } from '@/lib/schemas/hito_iniciativa.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['hito_iniciativas'] as const;

export function useHitoIniciativas(iniciativaId?: string) {
  return useQuery({
    queryKey: [...KEY, iniciativaId ?? 'all'] as const,
    queryFn: async () => {
      const qs = iniciativaId
        ? `?iniciativa_id=${encodeURIComponent(iniciativaId)}`
        : '';
      const { data } = await api.get<Envelope<HitoIniciativa[]>>(`/hito_iniciativas/${qs}`);
      return data.data;
    },
  });
}

export function useCreateHitoIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HitoIniciativaCreate) => {
      const { data } = await api.post<Envelope<HitoIniciativa>>('/hito_iniciativas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHitoIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HitoIniciativaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HitoIniciativa>>(`/hito_iniciativas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHitoIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hito_iniciativas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
