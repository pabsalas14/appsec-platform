import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { OkrPlanAnual, OkrPlanAnualCreate, OkrPlanAnualUpdate } from '@/lib/schemas/okr_plan_anual.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['okr_plan_anuals'] as const;

export function useOkrPlanAnuals() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<OkrPlanAnual[]>>('/okr_plan_anuals/');
      return data.data;
    },
  });
}

export function useCreateOkrPlanAnual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OkrPlanAnualCreate) => {
      const { data } = await api.post<Envelope<OkrPlanAnual>>('/okr_plan_anuals/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOkrPlanAnual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OkrPlanAnualUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<OkrPlanAnual>>(`/okr_plan_anuals/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOkrPlanAnual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/okr_plan_anuals/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
