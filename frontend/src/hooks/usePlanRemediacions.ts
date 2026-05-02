import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { PlanRemediacion, PlanRemediacionCreate, PlanRemediacionUpdate } from '@/lib/schemas/plan_remediacion.schema';

export type PlanRemediacionVulnerabilidadRow = {
  id: string;
  titulo: string;
  severidad: string;
  estado: string;
  fuente: string;
  fecha_limite_sla: string | null;
};

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['plan_remediacions'] as const;

export function usePlanRemediacions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<PlanRemediacion[]>>('/plan_remediacions/');
      return data.data;
    },
  });
}

export function usePlanRemediacion(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<PlanRemediacion>>(`/plan_remediacions/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function usePlanRemediacionVulnerabilidades(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id, 'vulnerabilidades'] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<PlanRemediacionVulnerabilidadRow[]>>(
        `/plan_remediacions/${id}/vulnerabilidades`,
      );
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useLinkPlanVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, vulnerabilidadId }: { planId: string; vulnerabilidadId: string }) => {
      const { data } = await api.post<Envelope<{ linked: boolean }>>(
        `/plan_remediacions/${planId}/vulnerabilidades`,
        { vulnerabilidad_id: vulnerabilidadId },
      );
      return data.data;
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: [...KEY, v.planId] });
      void qc.invalidateQueries({ queryKey: [...KEY, v.planId, 'vulnerabilidades'] });
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUnlinkPlanVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, vulnerabilidadId }: { planId: string; vulnerabilidadId: string }) => {
      const { data } = await api.delete<Envelope<{ unlinked: boolean }>>(
        `/plan_remediacions/${planId}/vulnerabilidades/${vulnerabilidadId}`,
      );
      return data.data;
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: [...KEY, v.planId] });
      void qc.invalidateQueries({ queryKey: [...KEY, v.planId, 'vulnerabilidades'] });
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useCreatePlanRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlanRemediacionCreate) => {
      const { data } = await api.post<Envelope<PlanRemediacion>>('/plan_remediacions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePlanRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: PlanRemediacionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<PlanRemediacion>>(`/plan_remediacions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePlanRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/plan_remediacions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
