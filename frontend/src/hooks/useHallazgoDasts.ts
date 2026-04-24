import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HallazgoDast, HallazgoDastCreate, HallazgoDastUpdate } from '@/lib/schemas/hallazgo_dast.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['hallazgo_dasts'] as const;

export function useHallazgoDasts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HallazgoDast[]>>('/hallazgo_dasts/');
      return data.data;
    },
  });
}

export function useCreateHallazgoDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HallazgoDastCreate) => {
      const { data } = await api.post<Envelope<HallazgoDast>>('/hallazgo_dasts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHallazgoDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HallazgoDastUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HallazgoDast>>(`/hallazgo_dasts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHallazgoDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hallazgo_dasts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
