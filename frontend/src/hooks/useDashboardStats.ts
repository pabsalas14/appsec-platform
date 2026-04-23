import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export type DashboardStats = {
  scope: 'admin' | 'user';
  totals: {
    tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    users: number;
    active_users: number;
  };
  task_breakdown: Array<{ status: string; count: number }>;
  users_by_role: Array<{ role: string; count: number }>;
  activity: Array<{ day: string; count: number }>;
  recent_audit_logs: Array<{
    id: string;
    ts: string;
    action: string;
    entity_type?: string | null;
    entity_id?: string | null;
    status: string;
    actor_user_id?: string | null;
  }>;
};

async function fetchStats(): Promise<DashboardStats> {
  const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return res.data.data;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchStats,
    staleTime: 60 * 1000,
  });
}
