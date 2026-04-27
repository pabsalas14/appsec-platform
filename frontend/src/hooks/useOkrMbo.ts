import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { OkrCierreQ } from '@/lib/schemas/okr_cierre_q.schema';
import type { OkrCompromiso } from '@/lib/schemas/okr_compromiso.schema';
import type { OkrEvidencia, OkrEvidenciaCreate } from '@/lib/schemas/okr_evidencia.schema';
import type { OkrPlanAnual } from '@/lib/schemas/okr_plan_anual.schema';
import type { OkrRevisionQ, OkrRevisionQUpdate } from '@/lib/schemas/okr_revision_q.schema';
import type { OkrSubcompromiso } from '@/lib/schemas/okr_subcompromiso.schema';
import type { Attachment, ApiResponse } from '@/types';

type Envelope<T> = { status: 'success'; data: T };

export type OkrQueryParams = {
  plan_id?: string;
  compromiso_id?: string;
  subcompromiso_id?: string;
  colaborador_id?: string;
  evaluador_id?: string;
  quarter?: string;
  ano?: number;
  estado?: string;
};

export type WorkflowAction = 'aprobar' | 'editar' | 'rechazar' | 'cerrar_q';

type WorkflowPayload = {
  revisionId: string;
  action: WorkflowAction;
  payload?: Record<string, unknown>;
};

type UploadAndLinkPayload = {
  revision_q_id: string;
  tipo_evidencia: string;
  file?: File | null;
  url_evidencia?: string;
  nombre_archivo?: string;
};

function withParams(path: string, params?: OkrQueryParams): string {
  if (!params) return path;
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    q.set(k, String(v));
  });
  const serialized = q.toString();
  return serialized ? `${path}?${serialized}` : path;
}

async function listOkrPlanes(params?: OkrQueryParams) {
  const { data } = await api.get<Envelope<OkrPlanAnual[]>>(withParams('/okr_plan_anuals/', params));
  return data.data;
}

async function listOkrCompromisos(params?: OkrQueryParams) {
  const { data } = await api.get<Envelope<OkrCompromiso[]>>(withParams('/okr_compromisos/', params));
  return data.data;
}

async function listOkrSubcompromisos(params?: OkrQueryParams) {
  const { data } = await api.get<Envelope<OkrSubcompromiso[]>>(withParams('/okr_subcompromisos/', params));
  return data.data;
}

async function listOkrRevisiones(params?: OkrQueryParams) {
  const { data } = await api.get<Envelope<OkrRevisionQ[]>>(withParams('/okr_revision_qs/', params));
  return data.data;
}

async function listOkrEvidencias(params?: OkrQueryParams) {
  const { data } = await api.get<Envelope<OkrEvidencia[]>>(withParams('/okr_evidencias/', params));
  return data.data;
}

async function listOkrCierres(params?: OkrQueryParams) {
  const { data } = await api.get<Envelope<OkrCierreQ[]>>(withParams('/okr_cierre_qs/', params));
  return data.data;
}

async function uploadFile(file: File): Promise<Attachment> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<ApiResponse<Attachment>>('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

async function createOkrEvidencia(payload: OkrEvidenciaCreate): Promise<OkrEvidencia> {
  const { data } = await api.post<Envelope<OkrEvidencia>>('/okr_evidencias/', payload);
  return data.data;
}

async function executeWorkflowAction({ revisionId, action, payload }: WorkflowPayload): Promise<OkrRevisionQ> {
  const candidates = [
    `/okr_revision_qs/${revisionId}/${action}`,
    `/okr_revision_qs/${revisionId}/actions/${action}`,
    `/okr_revision_qs/${revisionId}/workflow/${action}`,
  ];
  let lastError: unknown;
  for (const endpoint of candidates) {
    try {
      const { data } = await api.post<Envelope<OkrRevisionQ>>(endpoint, payload ?? {});
      return data.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function useOkrPlanes(params?: OkrQueryParams) {
  return useQuery({
    queryKey: ['okr', 'planes', params],
    queryFn: () => listOkrPlanes(params),
  });
}

export function useOkrCompromisosData(params?: OkrQueryParams) {
  return useQuery({
    queryKey: ['okr', 'compromisos', params],
    queryFn: () => listOkrCompromisos(params),
  });
}

export function useOkrSubcompromisosData(params?: OkrQueryParams) {
  return useQuery({
    queryKey: ['okr', 'subcompromisos', params],
    queryFn: () => listOkrSubcompromisos(params),
  });
}

export function useOkrRevisionesData(params?: OkrQueryParams) {
  return useQuery({
    queryKey: ['okr', 'revisiones', params],
    queryFn: () => listOkrRevisiones(params),
  });
}

export function useOkrEvidenciasData(params?: OkrQueryParams) {
  return useQuery({
    queryKey: ['okr', 'evidencias', params],
    queryFn: () => listOkrEvidencias(params),
  });
}

export function useOkrCierresData(params?: OkrQueryParams) {
  return useQuery({
    queryKey: ['okr', 'cierres', params],
    queryFn: () => listOkrCierres(params),
  });
}

export function useUpdateOkrPlanEvaluador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, evaluador_id }: { planId: string; evaluador_id: string }) => {
      const { data } = await api.patch<Envelope<OkrPlanAnual>>(`/okr_plan_anuals/${planId}`, { evaluador_id });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['okr', 'planes'] });
    },
  });
}

export function useSaveRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OkrRevisionQUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<OkrRevisionQ>>(`/okr_revision_qs/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['okr', 'revisiones'] });
    },
  });
}

export function useWorkflowRevisionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: executeWorkflowAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['okr', 'revisiones'] });
      qc.invalidateQueries({ queryKey: ['okr', 'cierres'] });
    },
  });
}

export function useUploadAndLinkOkrEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UploadAndLinkPayload) => {
      const file = payload.file ?? undefined;
      let attachmentId: string | null = null;
      let fileName = payload.nombre_archivo ?? null;
      if (file) {
        const attachment = await uploadFile(file);
        attachmentId = attachment.id;
        fileName = file.name;
      }
      return createOkrEvidencia({
        revision_q_id: payload.revision_q_id,
        tipo_evidencia: payload.tipo_evidencia,
        attachment_id: attachmentId,
        url_evidencia: payload.url_evidencia ?? null,
        nombre_archivo: fileName,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['okr', 'evidencias'] });
      qc.invalidateQueries({ queryKey: ['uploads'] });
    },
  });
}
