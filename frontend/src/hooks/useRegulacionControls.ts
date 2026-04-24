import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { RegulacionControl, RegulacionControlCreate, RegulacionControlUpdate } from '@/lib/schemas/regulacion_control.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['regulacion_controls'] as const;

export function useRegulacionControls() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<RegulacionControl[]>>('/regulacion_controls/');
      return data.data;
    },
  });
}

export function useCreateRegulacionControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RegulacionControlCreate) => {
      const { data } = await api.post<Envelope<RegulacionControl>>('/regulacion_controls/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRegulacionControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: RegulacionControlUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<RegulacionControl>>(`/regulacion_controls/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRegulacionControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/regulacion_controls/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
