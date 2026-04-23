import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { AceptacionRiesgo, AceptacionRiesgoCreate, AceptacionRiesgoUpdate } from '@/lib/schemas/aceptacion_riesgo.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['aceptacion_riesgos'] as const;

export function useAceptacionRiesgos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<AceptacionRiesgo[]>>('/aceptacion_riesgos/');
      return data.data;
    },
  });
}

export function useCreateAceptacionRiesgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AceptacionRiesgoCreate) => {
      const { data } = await api.post<Envelope<AceptacionRiesgo>>('/aceptacion_riesgos/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAceptacionRiesgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: AceptacionRiesgoUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<AceptacionRiesgo>>(`/aceptacion_riesgos/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAceptacionRiesgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/aceptacion_riesgos/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
