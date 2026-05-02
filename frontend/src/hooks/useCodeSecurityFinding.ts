'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface CodeSecurityFinding {
  id: string;
  review_id: string;
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
  created_at: string;
  updated_at: string;
}

export function useCodeSecurityFinding(
  reviewId: string | undefined,
  findingId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: ['code-security-finding', reviewId, findingId],
    queryFn: async () => {
      const response = await api.get<{ finding: CodeSecurityFinding }>(
        `/api/v1/code_security_reviews/${reviewId}/findings/${findingId}`
      );
      return response.data.finding;
    },
    enabled: !!reviewId && !!findingId && enabled,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}
