import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type {
  ActividadMensualServiciosRegulados,
  ActividadMensualServiciosReguladosCreate,
  ActividadMensualServiciosReguladosUpdate,
} from '@/lib/schemas/actividad_mensual_servicios_regulados.schema';

type Envelope<T> = { status: 'success'; data: T };
type ScoringConfig = { sub_estados_mes: string[]; pesos_severidad: Record<string, number> };

const KEY = ['actividad_mensual_servicios_regulados'] as const;
const KEY_CFG = ['actividad_mensual_servicios_regulados', 'config'] as const;

export function useActividadMensualServiciosRegulados() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ActividadMensualServiciosRegulados[]>>(
        '/actividad_mensual_servicios_regulados/',
      );
      return data.data;
    },
  });
}

export function useActividadMensualServiciosReguladosScoringConfig() {
  return useQuery({
    queryKey: KEY_CFG,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ScoringConfig>>(
        '/actividad_mensual_servicios_regulados/config/scoring',
      );
      return data.data;
    },
  });
}

export function useCreateActividadMensualServiciosRegulados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ActividadMensualServiciosReguladosCreate) => {
      const { data } = await api.post<Envelope<ActividadMensualServiciosRegulados>>(
        '/actividad_mensual_servicios_regulados/',
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateActividadMensualServiciosRegulados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ActividadMensualServiciosReguladosUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ActividadMensualServiciosRegulados>>(
        `/actividad_mensual_servicios_regulados/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteActividadMensualServiciosRegulados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/actividad_mensual_servicios_regulados/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
