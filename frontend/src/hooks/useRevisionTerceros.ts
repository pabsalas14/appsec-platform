import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { RevisionTercero, RevisionTerceroCreate, RevisionTerceroUpdate } from '@/lib/schemas/revision_tercero.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['revision_terceros'] as const;

export type ChecklistTemplateItem = { id: string; label: string; tipo?: string };
export type ChecklistTemplate = { items: ChecklistTemplateItem[] };

export function useRevisionTerceroChecklistTemplate() {
  return useQuery({
    queryKey: [...KEY, 'config', 'checklist'] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ChecklistTemplate>>('/revision_terceros/config/checklist');
      return data.data;
    },
  });
}

export function useRevisionTerceros() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<RevisionTercero[]>>('/revision_terceros/');
      return data.data;
    },
  });
}

export function useRevisionTercero(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<RevisionTercero>>(`/revision_terceros/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateRevisionTercero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RevisionTerceroCreate) => {
      const { data } = await api.post<Envelope<RevisionTercero>>('/revision_terceros/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRevisionTercero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: RevisionTerceroUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<RevisionTercero>>(`/revision_terceros/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRevisionTercero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/revision_terceros/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
