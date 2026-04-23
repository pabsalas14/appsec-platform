import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ReglaSoD, ReglaSoDCreate, ReglaSoDUpdate } from '@/lib/schemas/regla_so_d.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['regla_so_ds'] as const;

export function useReglaSoDs() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ReglaSoD[]>>('/regla_so_ds/');
      return data.data;
    },
  });
}

export function useCreateReglaSoD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReglaSoDCreate) => {
      const { data } = await api.post<Envelope<ReglaSoD>>('/regla_so_ds/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateReglaSoD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ReglaSoDUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ReglaSoD>>(`/regla_so_ds/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteReglaSoD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/regla_so_ds/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
