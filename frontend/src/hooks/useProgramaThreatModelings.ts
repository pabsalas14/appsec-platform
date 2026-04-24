import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ProgramaThreatModeling, ProgramaThreatModelingCreate, ProgramaThreatModelingUpdate } from '@/lib/schemas/programa_threat_modeling.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['programa_threat_modelings'] as const;

export function useProgramaThreatModelings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ProgramaThreatModeling[]>>('/programa_threat_modelings/');
      return data.data;
    },
  });
}

export function useCreateProgramaThreatModeling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProgramaThreatModelingCreate) => {
      const { data } = await api.post<Envelope<ProgramaThreatModeling>>('/programa_threat_modelings/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProgramaThreatModeling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ProgramaThreatModelingUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ProgramaThreatModeling>>(`/programa_threat_modelings/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProgramaThreatModeling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/programa_threat_modelings/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
