import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { OkrCierreQ, OkrCierreQCreate, OkrCierreQUpdate } from '@/lib/schemas/okr_cierre_q.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['okr_cierre_qs'] as const;

export function useOkrCierreQs() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<OkrCierreQ[]>>('/okr_cierre_qs/');
      return data.data;
    },
  });
}

export function useCreateOkrCierreQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OkrCierreQCreate) => {
      const { data } = await api.post<Envelope<OkrCierreQ>>('/okr_cierre_qs/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOkrCierreQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OkrCierreQUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<OkrCierreQ>>(`/okr_cierre_qs/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOkrCierreQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/okr_cierre_qs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
