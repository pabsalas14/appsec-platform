import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { VulnerabilidadIATriageResponseSchema } from '@/lib/schemas/vulnerabilidad_ia_triage_response.schema';
import type { Vulnerabilidad, VulnerabilidadCreate, VulnerabilidadUpdate } from '@/lib/schemas/vulnerabilidad.schema';
import type { components } from '@/types/api';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['vulnerabilidads'] as const;

type IATriageRequest = components['schemas']['VulnerabilidadIATriageRequest'];

export function useVulnerabilidads() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Vulnerabilidad[]>>('/vulnerabilidads/');
      return data.data;
    },
  });
}

export function useVulnerabilidad(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Vulnerabilidad>>(`/vulnerabilidads/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VulnerabilidadCreate) => {
      const { data } = await api.post<Envelope<Vulnerabilidad>>('/vulnerabilidads/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: VulnerabilidadUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Vulnerabilidad>>(`/vulnerabilidads/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/vulnerabilidads/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useTriageVulnerabilidadIa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: IATriageRequest & { id: string }) => {
      const { id, ...body } = args;
      const { data } = await api.post<Envelope<unknown>>(
        `/vulnerabilidads/${id}/ia/triage-fp`,
        body,
      );
      const parsed = VulnerabilidadIATriageResponseSchema.safeParse(data.data);
      if (!parsed.success) {
        logger.warn('vulnerabilidad.ia_triage_fp.parse', {
          issues: parsed.error.issues,
        });
      }
      return parsed.success ? parsed.data : null;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, variables.id] });
    },
  });
}
