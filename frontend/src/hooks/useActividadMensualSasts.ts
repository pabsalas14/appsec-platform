import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ActividadMensualSast, ActividadMensualSastCreate, ActividadMensualSastUpdate } from '@/lib/schemas/actividad_mensual_sast.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['actividad_mensual_sasts'] as const;

export function useActividadMensualSasts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ActividadMensualSast[]>>('/actividad_mensual_sasts/');
      return data.data;
    },
  });
}

export function useCreateActividadMensualSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ActividadMensualSastCreate) => {
      const { data } = await api.post<Envelope<ActividadMensualSast>>('/actividad_mensual_sasts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateActividadMensualSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ActividadMensualSastUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ActividadMensualSast>>(`/actividad_mensual_sasts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteActividadMensualSast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/actividad_mensual_sasts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
