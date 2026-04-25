import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ProgramaSourceCode, ProgramaSourceCodeCreate, ProgramaSourceCodeUpdate } from '@/lib/schemas/programa_source_code.schema';

type Envelope<T> = { status: 'success'; data: T; meta?: { page?: number; page_size?: number; total?: number } };

const KEY = ['programa_source_codes'] as const;

export function useProgramaSourceCodes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ProgramaSourceCode[]>>('/programa_source_codes/', {
        params: { page: 1, page_size: 100 },
      });
      return data.data;
    },
  });
}

export function useCreateProgramaSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProgramaSourceCodeCreate) => {
      const { data } = await api.post<Envelope<ProgramaSourceCode>>('/programa_source_codes/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProgramaSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ProgramaSourceCodeUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ProgramaSourceCode>>(`/programa_source_codes/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProgramaSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/programa_source_codes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
