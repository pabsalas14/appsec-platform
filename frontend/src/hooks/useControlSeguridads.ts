import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ControlSeguridad, ControlSeguridadCreate, ControlSeguridadUpdate } from '@/lib/schemas/control_seguridad.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['control_seguridads'] as const;

export function useControlSeguridads() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ControlSeguridad[]>>('/control_seguridads/');
      return data.data;
    },
  });
}

export function useCreateControlSeguridad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ControlSeguridadCreate) => {
      const { data } = await api.post<Envelope<ControlSeguridad>>('/control_seguridads/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateControlSeguridad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ControlSeguridadUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ControlSeguridad>>(`/control_seguridads/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteControlSeguridad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/control_seguridads/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
