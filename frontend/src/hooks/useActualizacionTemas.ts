import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ActualizacionTema, ActualizacionTemaCreate, ActualizacionTemaUpdate } from '@/lib/schemas/actualizacion_tema.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['actualizacion_temas'] as const;

export function useActualizacionTemas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ActualizacionTema[]>>('/actualizacion_temas/');
      return data.data;
    },
  });
}

export function useCreateActualizacionTema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ActualizacionTemaCreate) => {
      const { data } = await api.post<Envelope<ActualizacionTema>>('/actualizacion_temas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateActualizacionTema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ActualizacionTemaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ActualizacionTema>>(`/actualizacion_temas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteActualizacionTema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/actualizacion_temas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
