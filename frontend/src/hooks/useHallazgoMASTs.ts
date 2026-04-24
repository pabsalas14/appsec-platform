import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HallazgoMAST, HallazgoMASTCreate, HallazgoMASTUpdate } from '@/lib/schemas/hallazgo_mast.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['hallazgo_masts'] as const;

export function useHallazgoMASTs() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HallazgoMAST[]>>('/hallazgo_masts/');
      return data.data;
    },
  });
}

export function useCreateHallazgoMAST() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HallazgoMASTCreate) => {
      const { data } = await api.post<Envelope<HallazgoMAST>>('/hallazgo_masts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHallazgoMAST() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HallazgoMASTUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HallazgoMAST>>(`/hallazgo_masts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHallazgoMAST() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hallazgo_masts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
