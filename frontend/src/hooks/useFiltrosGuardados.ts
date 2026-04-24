import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import { logger } from '@/lib/logger';
import type { FiltroGuardado, FiltroGuardadoCreate } from '@/lib/schemas/filtro_guardado.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['filtros_guardados'] as const;

export function useFiltrosGuardados() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<FiltroGuardado[]>>('/filtros_guardados/');
      return data.data;
    },
  });
}

export function useCreateFiltroGuardado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FiltroGuardadoCreate) => {
      const { data } = await api.post<Envelope<FiltroGuardado>>('/filtros_guardados/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFiltroGuardado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/filtros_guardados/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => {
      logger.warn('filtro_guardado.delete_failed', { err: String(err) });
    },
  });
}
