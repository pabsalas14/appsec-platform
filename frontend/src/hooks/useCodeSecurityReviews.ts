import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type {
  CodeSecurityEvent,
  CodeSecurityFinding,
  CodeSecurityReport,
  CodeSecurityReview,
} from '@/types';
import type {
  CodeSecurityOrgBatchCreate,
  CodeSecurityReviewCreate,
  CodeSecurityReviewUpdate,
} from '@/lib/schemas/code_security_review.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['code_security_reviews'] as const;

export function useCodeSecurityReviews() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityReview[]>>('/code_security_reviews/');
      return data.data;
    },
  });
}

export function useCodeSecurityReview(reviewId?: string) {
  return useQuery({
    queryKey: [...KEY, reviewId],
    enabled: Boolean(reviewId),
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityReview>>(`/code_security_reviews/${reviewId}`);
      return data.data;
    },
  });
}

export function useCreateCodeSecurityReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CodeSecurityReviewCreate) => {
      const { data } = await api.post<Envelope<CodeSecurityReview>>('/code_security_reviews/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCodeSecurityReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: CodeSecurityReviewUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<CodeSecurityReview>>(`/code_security_reviews/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCodeSecurityReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/code_security_reviews/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAnalyzeCodeSecurityReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/code_security_reviews/${id}/analyze`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReviewProgress(reviewId?: string) {
  return useQuery({
    queryKey: ['code_security_reviews', reviewId, 'progress'],
    enabled: Boolean(reviewId),
    queryFn: async () => {
      const { data } = await api.get<Envelope<{ progress: number; status: string; current_phase: string }>>(
        `/code_security_reviews/${reviewId}/progress`
      );
      return data.data;
    },
    refetchInterval: 2500,
  });
}

export function useReviewFindings(reviewId?: string) {
  return useQuery({
    queryKey: ['code_security_reviews', reviewId, 'findings'],
    enabled: Boolean(reviewId),
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityFinding[]>>(`/code_security_reviews/${reviewId}/findings`);
      return data.data;
    },
  });
}

export function useReviewEvents(reviewId?: string) {
  return useQuery({
    queryKey: ['code_security_reviews', reviewId, 'events'],
    enabled: Boolean(reviewId),
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityEvent[]>>(`/code_security_reviews/${reviewId}/events`);
      return data.data;
    },
  });
}

export function useReviewReport(reviewId?: string) {
  return useQuery({
    queryKey: ['code_security_reviews', reviewId, 'report'],
    enabled: Boolean(reviewId),
    queryFn: async () => {
      const { data } = await api.get<Envelope<CodeSecurityReport>>(`/code_security_reviews/${reviewId}/report`);
      return data.data;
    },
  });
}

export function useCreateOrgBatchCodeSecurityReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CodeSecurityOrgBatchCreate) => {
      const { data } = await api.post('/code_security_reviews/batch/org', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
