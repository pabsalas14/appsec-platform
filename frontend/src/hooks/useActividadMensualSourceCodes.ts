import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type {
  ActividadMensualSourceCode,
  ActividadMensualSourceCodeCreate,
  ActividadMensualSourceCodeUpdate,
} from '@/lib/schemas/actividad_mensual_source_code.schema';

type Envelope<T> = { status: 'success'; data: T };
type ScoringConfig = { sub_estados_mes: string[]; pesos_severidad: Record<string, number> };

const KEY = ['actividad_mensual_source_codes'] as const;
const KEY_CFG = ['actividad_mensual_source_codes', 'config'] as const;

export function useActividadMensualSourceCodes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ActividadMensualSourceCode[]>>('/actividad_mensual_source_codes/');
      return data.data;
    },
  });
}

export function useActividadMensualSourceCodeScoringConfig() {
  return useQuery({
    queryKey: KEY_CFG,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ScoringConfig>>('/actividad_mensual_source_codes/config/scoring');
      return data.data;
    },
  });
}

export function useCreateActividadMensualSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ActividadMensualSourceCodeCreate) => {
      const { data } = await api.post<Envelope<ActividadMensualSourceCode>>(
        '/actividad_mensual_source_codes/',
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateActividadMensualSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ActividadMensualSourceCodeUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ActividadMensualSourceCode>>(
        `/actividad_mensual_source_codes/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteActividadMensualSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/actividad_mensual_source_codes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
