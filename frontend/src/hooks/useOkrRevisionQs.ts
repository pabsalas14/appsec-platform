import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { OkrRevisionQ, OkrRevisionQCreate, OkrRevisionQUpdate } from '@/lib/schemas/okr_revision_q.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['okr_revision_qs'] as const;

export function useOkrRevisionQs() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<OkrRevisionQ[]>>('/okr_revision_qs/');
      return data.data;
    },
  });
}

export function useCreateOkrRevisionQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OkrRevisionQCreate) => {
      const { data } = await api.post<Envelope<OkrRevisionQ>>('/okr_revision_qs/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOkrRevisionQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OkrRevisionQUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<OkrRevisionQ>>(`/okr_revision_qs/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOkrRevisionQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/okr_revision_qs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
