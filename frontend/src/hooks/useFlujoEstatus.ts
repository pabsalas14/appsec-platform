import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { FlujoEstatus, FlujoEstatusCreate, FlujoEstatusUpdate } from '@/lib/schemas/flujo_estatus.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['flujos_estatus'] as const;

export function useFlujoEstatus() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<FlujoEstatus[]>>('/flujos_estatus/');
      return data.data;
    },
  });
}

export function useCreateFlujoEstatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FlujoEstatusCreate) => {
      const { data } = await api.post<Envelope<FlujoEstatus>>('/flujos_estatus/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateFlujoEstatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: FlujoEstatusUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<FlujoEstatus>>(`/flujos_estatus/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFlujoEstatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/flujos_estatus/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
