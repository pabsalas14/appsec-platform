import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Servicio, ServicioCreate, ServicioUpdate } from '@/lib/schemas/servicio.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['servicios'] as const;

export function useServicios() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Servicio[]>>('/servicios/');
      return data.data;
    },
  });
}

export function useCreateServicio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ServicioCreate) => {
      const { data } = await api.post<Envelope<Servicio>>('/servicios/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateServicio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ServicioUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Servicio>>(`/servicios/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteServicio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/servicios/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
