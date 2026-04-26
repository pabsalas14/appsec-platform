import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type {
  ActividadMensualDast,
  ActividadMensualDastCreate,
  ActividadMensualDastUpdate,
} from '@/lib/schemas/actividad_mensual_dast.schema';

type Envelope<T> = { status: 'success'; data: T };
type ScoringConfig = { sub_estados_mes: string[]; pesos_severidad: Record<string, number> };

const KEY = ['actividad_mensual_dasts'] as const;
const KEY_CFG = ['actividad_mensual_dasts', 'config'] as const;

export function useActividadMensualDasts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ActividadMensualDast[]>>('/actividad_mensual_dasts/');
      return data.data;
    },
  });
}

export function useActividadMensualDastScoringConfig() {
  return useQuery({
    queryKey: KEY_CFG,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ScoringConfig>>('/actividad_mensual_dasts/config/scoring');
      return data.data;
    },
  });
}

export function useCreateActividadMensualDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ActividadMensualDastCreate) => {
      const { data } = await api.post<Envelope<ActividadMensualDast>>('/actividad_mensual_dasts/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateActividadMensualDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ActividadMensualDastUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ActividadMensualDast>>(`/actividad_mensual_dasts/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteActividadMensualDast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/actividad_mensual_dasts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
