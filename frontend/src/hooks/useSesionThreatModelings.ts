import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { SesionThreatModelingIASuggestResponseSchema } from '@/lib/schemas/sesion_threat_modeling_ia_suggest_response.schema';
import type { SesionThreatModeling, SesionThreatModelingCreate, SesionThreatModelingUpdate } from '@/lib/schemas/sesion_threat_modeling.schema';
import type { components } from '@/types/api';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['sesion_threat_modelings'] as const;

type IASuggestRequest = components['schemas']['SesionThreatModelingIASuggestRequest'];

export function useSesionThreatModelings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<SesionThreatModeling[]>>('/sesion_threat_modelings/');
      return data.data;
    },
  });
}

export function useSesionThreatModeling(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<SesionThreatModeling>>(
        `/sesion_threat_modelings/${id}`,
      );
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateSesionThreatModeling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SesionThreatModelingCreate) => {
      const { data } = await api.post<Envelope<SesionThreatModeling>>('/sesion_threat_modelings/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSesionThreatModeling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: SesionThreatModelingUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<SesionThreatModeling>>(`/sesion_threat_modelings/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSesionThreatModeling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sesion_threat_modelings/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSuggestSesionThreatModelingIa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: IASuggestRequest & { id: string }) => {
      const { id, ...body } = args;
      const { data } = await api.post<Envelope<unknown>>(
        `/sesion_threat_modelings/${id}/ia/suggest`,
        body,
      );
      const parsed = SesionThreatModelingIASuggestResponseSchema.safeParse(data.data);
      if (!parsed.success) {
        logger.warn('sesion_threat_modeling.ia_suggest.parse', {
          issues: parsed.error.issues,
        });
      }
      return parsed.success ? parsed.data : null;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, variables.id] });
      qc.invalidateQueries({ queryKey: ['amenazas'] });
    },
  });
}
