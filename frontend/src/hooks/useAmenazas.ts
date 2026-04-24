import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Amenaza, AmenazaCreate, AmenazaUpdate } from '@/lib/schemas/amenaza.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['amenazas'] as const;

export function useAmenazas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Amenaza[]>>('/amenazas/');
      return data.data;
    },
  });
}

export function useAmenazasBySesion(sesionId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'sesion', sesionId] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Amenaza[]>>('/amenazas/', {
        params: { sesion_id: sesionId },
      });
      return data.data;
    },
    enabled: Boolean(sesionId),
  });
}

export function useCreateAmenaza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AmenazaCreate) => {
      const { data } = await api.post<Envelope<Amenaza>>('/amenazas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAmenaza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: AmenazaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Amenaza>>(`/amenazas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAmenaza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/amenazas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
