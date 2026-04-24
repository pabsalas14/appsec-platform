import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { EstadoCumplimiento, EstadoCumplimientoCreate, EstadoCumplimientoUpdate } from '@/lib/schemas/estado_cumplimiento.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['estado_cumplimientos'] as const;

export function useEstadoCumplimientos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<EstadoCumplimiento[]>>('/estado_cumplimientos/');
      return data.data;
    },
  });
}

export function useCreateEstadoCumplimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EstadoCumplimientoCreate) => {
      const { data } = await api.post<Envelope<EstadoCumplimiento>>('/estado_cumplimientos/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEstadoCumplimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EstadoCumplimientoUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<EstadoCumplimiento>>(`/estado_cumplimientos/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEstadoCumplimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/estado_cumplimientos/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
