import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HallazgoSast, HallazgoSastCreate, HallazgoSastUpdate } from '@/lib/schemas/hallazgo_sast.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['hallazgo_sasts'] as const;

export function useHallazgoSasts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HallazgoSast[]>>('/hallazgo_sasts/');
      return data.data;
    },
  });
}

export function useCreateHallazgoSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HallazgoSastCreate) => {
      const { data } = await api.post<Envelope<HallazgoSast>>('/hallazgo_sasts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHallazgoSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HallazgoSastUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HallazgoSast>>(`/hallazgo_sasts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHallazgoSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hallazgo_sasts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
