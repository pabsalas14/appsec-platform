import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Repositorio, RepositorioCreate, RepositorioUpdate } from '@/lib/schemas/repositorio.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['repositorios'] as const;

export function useRepositorios() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Repositorio[]>>('/repositorios/');
      return data.data;
    },
  });
}

export function useRepositorio(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Repositorio>>(`/repositorios/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateRepositorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RepositorioCreate) => {
      const { data } = await api.post<Envelope<Repositorio>>('/repositorios/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRepositorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: RepositorioUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Repositorio>>(`/repositorios/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRepositorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/repositorios/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
