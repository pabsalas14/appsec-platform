import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ActivoWeb, ActivoWebCreate, ActivoWebUpdate } from '@/lib/schemas/activo_web.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['activo_webs'] as const;

export function useActivoWebs() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ActivoWeb[]>>('/activo_webs/');
      return data.data;
    },
  });
}

export function useCreateActivoWeb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ActivoWebCreate) => {
      const { data } = await api.post<Envelope<ActivoWeb>>('/activo_webs/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateActivoWeb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ActivoWebUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ActivoWeb>>(`/activo_webs/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteActivoWeb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activo_webs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
