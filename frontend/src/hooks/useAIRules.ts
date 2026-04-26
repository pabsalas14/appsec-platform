import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import type {
  AIRuleCreate,
  AIRuleRead,
  AIRuleUpdate,
  AIRuleList,
  AIRuleTestResult,
  AIRuleTest,
  ActionMetadata,
  TriggerMetadata,
} from '@/types/ai-rules';

// List rules
async function listRules(
  skip: number = 0,
  limit: number = 20,
  filters?: { search?: string; trigger_type?: string; action_type?: string; enabled?: boolean }
): Promise<AIRuleList> {
  const params = new URLSearchParams();
  params.set('skip', String(skip));
  params.set('limit', String(limit));

  if (filters?.search) params.set('search', filters.search);
  if (filters?.trigger_type) params.set('trigger_type', filters.trigger_type);
  if (filters?.action_type) params.set('action_type', filters.action_type);
  if (filters?.enabled !== undefined) params.set('enabled', String(filters.enabled));

  const res = await api.get<ApiResponse<AIRuleList>>(`/admin/ai-rules?${params}`);
  return res.data.data;
}

// Get single rule
async function getRule(ruleId: string): Promise<AIRuleRead> {
  const res = await api.get<ApiResponse<AIRuleRead>>(`/admin/ai-rules/${ruleId}`);
  return res.data.data;
}

// Create rule
async function createRule(payload: AIRuleCreate): Promise<AIRuleRead> {
  const res = await api.post<ApiResponse<AIRuleRead>>('/admin/ai-rules', payload);
  return res.data.data;
}

// Update rule
async function updateRule(ruleId: string, payload: AIRuleUpdate): Promise<AIRuleRead> {
  const res = await api.patch<ApiResponse<AIRuleRead>>(`/admin/ai-rules/${ruleId}`, payload);
  return res.data.data;
}

// Delete rule
async function deleteRule(ruleId: string): Promise<{ deleted: boolean }> {
  const res = await api.delete<ApiResponse<{ deleted: boolean }>>(`/admin/ai-rules/${ruleId}`);
  return res.data.data;
}

// Test rule
async function testRule(ruleId: string, payload: AIRuleTest): Promise<AIRuleTestResult> {
  const res = await api.post<ApiResponse<AIRuleTestResult>>(`/admin/ai-rules/${ruleId}/test`, payload);
  return res.data.data;
}

// Get trigger types metadata
async function getTriggerTypes(): Promise<TriggerMetadata[]> {
  const res = await api.get<ApiResponse<{ triggers: TriggerMetadata[] }>>('/admin/ai-rules/metadata/triggers');
  return res.data.data.triggers;
}

// Get action types metadata
async function getActionTypes(): Promise<ActionMetadata[]> {
  const res = await api.get<ApiResponse<{ actions: ActionMetadata[] }>>('/admin/ai-rules/metadata/actions');
  return res.data.data.actions;
}

// Hooks
export function useAIRules(
  skip: number = 0,
  limit: number = 20,
  filters?: { search?: string; trigger_type?: string; action_type?: string; enabled?: boolean }
) {
  return useQuery({
    queryKey: ['admin', 'ai-rules', skip, limit, filters],
    queryFn: () => listRules(skip, limit, filters),
  });
}

export function useAIRule(ruleId: string) {
  return useQuery({
    queryKey: ['admin', 'ai-rules', ruleId],
    queryFn: () => getRule(ruleId),
    enabled: !!ruleId,
  });
}

export function useCreateAIRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'ai-rules'] }),
  });
}

export function useUpdateAIRule(ruleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AIRuleUpdate) => updateRule(ruleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ai-rules'] });
      qc.invalidateQueries({ queryKey: ['admin', 'ai-rules', ruleId] });
    },
  });
}

export function useDeleteAIRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'ai-rules'] }),
  });
}

export function useTestAIRule() {
  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: AIRuleTest }) => testRule(ruleId, payload),
  });
}

export function useTriggerTypes() {
  return useQuery({
    queryKey: ['admin', 'ai-rules', 'trigger-types'],
    queryFn: getTriggerTypes,
  });
}

export function useActionTypes() {
  return useQuery({
    queryKey: ['admin', 'ai-rules', 'action-types'],
    queryFn: getActionTypes,
  });
}
