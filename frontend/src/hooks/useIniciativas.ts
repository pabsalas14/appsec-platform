import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Iniciativa, IniciativaCreate, IniciativaUpdate } from '@/lib/schemas/iniciativa.schema';

type Envelope<T> = { status: 'success'; data: T };
type PaginatedIniciativas = Envelope<Iniciativa[]> & {
  meta?: { page: number; page_size: number; total: number; total_pages?: number };
  pagination?: { page: number; page_size: number; total: number; total_pages?: number };
};

const KEY = ['iniciativas'] as const;

export function useIniciativa(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('id requerido');
      const { data } = await api.get<Envelope<Iniciativa>>(`/iniciativas/${id}`);
      if (data.status !== 'success' || !data.data) {
        throw new Error('Respuesta inválida del servidor');
      }
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useIniciativas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<PaginatedIniciativas>('/iniciativas/', {
        params: { page: 1, page_size: 100 },
      });
      if (data.status !== 'success' || !Array.isArray(data.data)) {
        throw new Error('Respuesta inválida del servidor');
      }
      return data.data;
    },
  });
}

export function useCreateIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IniciativaCreate) => {
      const { data } = await api.post<Envelope<Iniciativa>>('/iniciativas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: IniciativaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Iniciativa>>(`/iniciativas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteIniciativa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/iniciativas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
