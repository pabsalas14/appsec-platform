'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type {
  CodeSecurityEvent,
  CodeSecurityFinding,
  CodeSecurityReport,
  CodeSecurityReview,
} from '@/types';

type Envelope<T> = { status: string; data: T };

export function useCodeSecurityReview(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['code-security-review', id],
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityReview>>(`/code_security_reviews/${id}`);
      return data.data;
    },
    enabled: Boolean(id) && enabled,
    staleTime: 15000,
    gcTime: 5 * 60 * 1000,
  });
}

/** Misma fila que el detalle; re-fetch más frecuente mientras analiza. */
export function useReviewProgress(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['code-security-progress', id],
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityReview>>(`/code_security_reviews/${id}`);
      return data.data;
    },
    enabled: Boolean(id) && enabled,
    refetchInterval: (q) => (q.state.data?.estado === 'ANALYZING' ? 2500 : false),
  });
}

export function useReviewFindings(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['code-security-findings', id],
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityFinding[]>>(`/code_security_reviews/${id}/findings`);
      return data.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useReviewEvents(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['code-security-events', id],
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityEvent[]>>(`/code_security_reviews/${id}/events`);
      return data.data;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useReviewReport(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['code-security-report', id],
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityReport>>(`/code_security_reviews/${id}/report`);
      return data.data;
    },
    enabled: Boolean(id) && enabled,
    retry: 1,
  });
}
