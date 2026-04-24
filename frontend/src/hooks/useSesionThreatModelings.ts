import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { SesionThreatModeling, SesionThreatModelingCreate, SesionThreatModelingUpdate } from '@/lib/schemas/sesion_threat_modeling.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['sesion_threat_modelings'] as const;

export function useSesionThreatModelings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<SesionThreatModeling[]>>('/sesion_threat_modelings/');
      return data.data;
    },
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
