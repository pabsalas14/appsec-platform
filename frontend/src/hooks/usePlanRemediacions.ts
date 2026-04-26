import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { PlanRemediacion, PlanRemediacionCreate, PlanRemediacionUpdate } from '@/lib/schemas/plan_remediacion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['plan_remediacions'] as const;

export function usePlanRemediacions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<PlanRemediacion[]>>('/plan_remediacions/');
      return data.data;
    },
  });
}

export function useCreatePlanRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlanRemediacionCreate) => {
      const { data } = await api.post<Envelope<PlanRemediacion>>('/plan_remediacions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePlanRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: PlanRemediacionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<PlanRemediacion>>(`/plan_remediacions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePlanRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/plan_remediacions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
