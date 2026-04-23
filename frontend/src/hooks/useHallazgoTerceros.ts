import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HallazgoTercero, HallazgoTerceroCreate, HallazgoTerceroUpdate } from '@/lib/schemas/hallazgo_tercero.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['hallazgo_terceros'] as const;

export function useHallazgoTerceros() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HallazgoTercero[]>>('/hallazgo_terceros/');
      return data.data;
    },
  });
}

export function useCreateHallazgoTercero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HallazgoTerceroCreate) => {
      const { data } = await api.post<Envelope<HallazgoTercero>>('/hallazgo_terceros/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHallazgoTercero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HallazgoTerceroUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HallazgoTercero>>(`/hallazgo_terceros/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHallazgoTercero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hallazgo_terceros/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
