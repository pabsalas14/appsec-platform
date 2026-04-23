import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type { AuditLog, PaginatedResponse } from '@/types';

export type AuditLogListParams = {
  actor_user_id?: string;
  action?: string;
  entity_type?: string;
  since?: string;
  until?: string;
  page?: number;
  page_size?: number;
};

export type AuditLogListResult = {
  items: AuditLog[];
  pagination: PaginatedResponse<AuditLog>['pagination'];
};

async function fetchAuditLogs(params: AuditLogListParams): Promise<AuditLogListResult> {
  const res = await api.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
  return { items: res.data.data, pagination: res.data.pagination };
}

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
    staleTime: 15_000,
  });
}
