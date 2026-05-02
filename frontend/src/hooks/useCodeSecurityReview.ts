'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface CodeSecurityFinding {
  id: string;
  archivo: string;
  linea_inicio: number;
  linea_fin: number;
  tipo_riesgo: string;
  severidad: string;
  confianza: number;
  descripcion: string;
  codigo_snippet: string;
  impacto: string;
  explotabilidad: string;
  remediacion: string;
  estado: string;
}

export interface CodeSecurityEvent {
  id: string;
  timestamp: string;
  commit_hash: string;
  autor: string;
  archivo: string;
  accion: string;
  mensaje_commit: string;
  nivel_riesgo: string;
  indicadores: string[];
}

export interface CodeSecurityReport {
  resumen_ejecutivo: string;
  desglose_severidad: Record<string, number>;
  funciones_comprometidas: string[];
  narrativa_evolucion: string;
  pasos_remediacion: Array<{ paso: number; descripcion: string }>;
  autores_sospechosos: string[];
  puntuacion_riesgo: number;
  recomendaciones: string[];
}

export interface CodeSecurityReviewDetail {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: string;
  progreso: number;
  tipo_escaneo: string;
  url_repositorio?: string;
  rama: string;
  agente_actual?: string;
  actividad?: string;
  findings_count: number;
  events_count: number;
  risk_score?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  findings?: CodeSecurityFinding[];
  events?: CodeSecurityEvent[];
  report?: CodeSecurityReport;
}

export function useCodeSecurityReview(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['code-security-review', id],
    queryFn: async () => {
      const response = await api.get<{ review: CodeSecurityReviewDetail }>(
        `/api/v1/code_security_reviews/${id}`
      );
      return response.data.review;
    },
    enabled: !!id && enabled,
    staleTime: 15000,
    gcTime: 5 * 60 * 1000,
  });
}
