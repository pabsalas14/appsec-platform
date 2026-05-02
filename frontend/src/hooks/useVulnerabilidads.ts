import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import { logger } from '@/lib/logger';
import { VulnerabilidadIATriageResponseSchema } from '@/lib/schemas/vulnerabilidad_ia_triage_response.schema';
import type { Vulnerabilidad, VulnerabilidadCreate, VulnerabilidadUpdate } from '@/lib/schemas/vulnerabilidad.schema';
import type { components } from '@/types/api';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['vulnerabilidads'] as const;

type IATriageRequest = components['schemas']['VulnerabilidadIATriageRequest'];

export type VulnerabilidadListMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

type ListResponse = { status: 'success'; data: Vulnerabilidad[]; meta: VulnerabilidadListMeta };

/** Primera página (hasta 100) — selects y formularios dependientes. */
export function useVulnerabilidads() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Vulnerabilidad[]>>('/vulnerabilidads/?page_size=100&page=1');
      return data.data;
    },
  });
}

/** Listado con filtros/orden/paginación vía querystring (BRD P19–P20). */
export function useVulnerabilidadsList(sp: string) {
  return useQuery({
    queryKey: [...KEY, 'list', sp] as const,
    queryFn: async () => {
      const qs = new URLSearchParams(sp);
      if (!qs.has('page')) qs.set('page', '1');
      if (!qs.has('page_size')) qs.set('page_size', '20');
      const { data } = await api.get<ListResponse>(`/vulnerabilidads/?${qs.toString()}`);
      return { items: data.data, meta: data.meta };
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
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: [...KEY, variables.id] });
      void qc.invalidateQueries({ queryKey: [...KEY, 'historial', variables.id] });
    },
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

export function useVulnerabilidadHistorial(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'historial', id] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<unknown[]>>(`/vulnerabilidads/${id}/historial`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

type BulkPayload =
  | { action: 'estado'; ids: string[]; estado: string }
  | { action: 'responsable'; ids: string[]; responsable_id: string | null }
  | { action: 'delete'; ids: string[] };

export function useVulnerabilidadBulkAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BulkPayload) => {
      const body =
        payload.action === 'delete'
          ? { ids: payload.ids, action: 'delete' as const }
          : payload.action === 'estado'
            ? { ids: payload.ids, action: 'estado' as const, estado: payload.estado }
            : {
                ids: payload.ids,
                action: 'responsable' as const,
                responsable_id: payload.responsable_id,
              };
      const { data } = await api.post<Envelope<{ processed: number; failed: number; errors: string[] }>>(
        '/vulnerabilidads/bulk-action',
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: [...KEY, 'historial'] });
    },
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
