import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ProgramaDast, ProgramaDastCreate, ProgramaDastUpdate } from '@/lib/schemas/programa_dast.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['programa_dasts'] as const;

export function useProgramaDasts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ProgramaDast[]>>('/programa_dasts/');
      return data.data;
    },
  });
}

export function useCreateProgramaDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProgramaDastCreate) => {
      const { data } = await api.post<Envelope<ProgramaDast>>('/programa_dasts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProgramaDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ProgramaDastUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ProgramaDast>>(`/programa_dasts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProgramaDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/programa_dasts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
