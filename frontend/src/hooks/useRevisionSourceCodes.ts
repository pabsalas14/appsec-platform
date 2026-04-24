import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { RevisionSourceCode, RevisionSourceCodeCreate, RevisionSourceCodeUpdate } from '@/lib/schemas/revision_source_code.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['revision_source_codes'] as const;

export function useRevisionSourceCodes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<RevisionSourceCode[]>>('/revision_source_codes/');
      return data.data;
    },
  });
}

export function useCreateRevisionSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RevisionSourceCodeCreate) => {
      const { data } = await api.post<Envelope<RevisionSourceCode>>('/revision_source_codes/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRevisionSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: RevisionSourceCodeUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<RevisionSourceCode>>(`/revision_source_codes/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRevisionSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/revision_source_codes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
