import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ProgramaSast, ProgramaSastCreate, ProgramaSastUpdate } from '@/lib/schemas/programa_sast.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['programa_sasts'] as const;

export function useProgramaSasts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ProgramaSast[]>>('/programa_sasts/');
      return data.data;
    },
  });
}

export function useCreateProgramaSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProgramaSastCreate) => {
      const { data } = await api.post<Envelope<ProgramaSast>>('/programa_sasts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProgramaSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ProgramaSastUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ProgramaSast>>(`/programa_sasts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProgramaSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/programa_sasts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
