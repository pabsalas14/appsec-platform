import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Notificacion, NotificacionCreate, NotificacionUpdate } from '@/lib/schemas/notificacion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['notificacions'] as const;

export function useNotificacions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Notificacion[]>>('/notificacions/');
      return data.data;
    },
  });
}

type MarcarTodasRes = { marked_read: number };

export function useMarcarTodasNotificacionesLeidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Envelope<MarcarTodasRes>>('/notificacions/marcar-todas-leidas');
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateNotificacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NotificacionCreate) => {
      const { data } = await api.post<Envelope<Notificacion>>('/notificacions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateNotificacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: NotificacionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Notificacion>>(`/notificacions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteNotificacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notificacions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
