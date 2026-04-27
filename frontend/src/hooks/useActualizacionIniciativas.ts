import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ActualizacionIniciativa, ActualizacionIniciativaCreate, ActualizacionIniciativaUpdate } from '@/lib/schemas/actualizacion_iniciativa.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['actualizacion_iniciativas'] as const;

export function useActualizacionIniciativas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ActualizacionIniciativa[]>>('/actualizacion_iniciativas/');
      return data.data;
    },
  });
}

export function useCreateActualizacionIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ActualizacionIniciativaCreate) => {
      const { data } = await api.post<Envelope<ActualizacionIniciativa>>('/actualizacion_iniciativas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateActualizacionIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ActualizacionIniciativaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ActualizacionIniciativa>>(`/actualizacion_iniciativas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteActualizacionIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/actualizacion_iniciativas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
