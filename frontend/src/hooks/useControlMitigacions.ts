import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ControlMitigacion, ControlMitigacionCreate, ControlMitigacionUpdate } from '@/lib/schemas/control_mitigacion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['control_mitigacions'] as const;

export function useControlMitigacions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ControlMitigacion[]>>('/control_mitigacions/');
      return data.data;
    },
  });
}

export function useCreateControlMitigacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ControlMitigacionCreate) => {
      const { data } = await api.post<Envelope<ControlMitigacion>>('/control_mitigacions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateControlMitigacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ControlMitigacionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ControlMitigacion>>(`/control_mitigacions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteControlMitigacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/control_mitigacions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
