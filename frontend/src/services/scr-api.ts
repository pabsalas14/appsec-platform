/**
 * SCR API Service — Centralized API client for all SCR endpoints
 *
 * This service provides type-safe API calls to all SCR backend endpoints.
 * Uses the existing api client from the app.
 */

import { api } from '@/lib/api';

type JsonRecord = Record<string, unknown>;

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard API
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  total_scans: number;
  critical_findings: number;
  high_findings: number;
  scanned_repos: number;
  avg_remediation_days: number;
}

export interface DashboardCosts {
  total_cost: number;
  tokens_consumed: number;
  avg_cost_per_scan: number;
  incremental_savings: number;
}

export interface TrendData {
  week: string;
  detected: number;
  resolved: number;
}

export interface TopRepo {
  name: string;
  organization: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  last_scan: string;
}

export const scrDashboardAPI = {
  async getKPIs(days: number = 30): Promise<DashboardKPIs> {
    const { data } = await api.get('/scr/dashboard/kpis', {
      params: { days },
    });
    return data.data;
  },

  async getCosts(days: number = 30): Promise<DashboardCosts> {
    const { data } = await api.get('/scr/dashboard/costs', {
      params: { days },
    });
    return data.data;
  },

  async getTrends(days: number = 30): Promise<TrendData[]> {
    const { data } = await api.get('/scr/dashboard/trends', {
      params: { days },
    });
    return data.data;
  },

  async getTopRepos(): Promise<TopRepo[]> {
    const { data } = await api.get('/scr/dashboard/top-repos');
    return data.data;
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// Admin Configuration API
// ─────────────────────────────────────────────────────────────────────────────

export interface LLMProviderConfig {
  provider: string;
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
  timeout_seconds: number;
}

export interface GitHubTokenInfo {
  id: string;
  platform: string;
  user: string;
  organizations: string[];
  repos_count: number;
  last_validated: string;
  expiration_date: string;
  created_at: string;
}

export interface AgentPromptConfig {
  agent: string;
  system_prompt: string;
  analysis_context?: string;
  output_format?: string;
  last_updated: string;
}

export const scrAdminAPI = {
  // LLM Configuration
  async getLLMConfig() {
    const { data } = await api.get('/admin/scr/llm-config');
    return data.data;
  },

  async setLLMConfig(config: LLMProviderConfig) {
    const { data } = await api.post('/admin/scr/llm-config', config);
    return data.data;
  },

  async testLLMConnection(config: LLMProviderConfig) {
    const { data } = await api.post(
      '/admin/scr/llm-config/test-connection',
      config
    );
    return data.data;
  },

  // GitHub Token Management
  async listGitHubTokens(): Promise<GitHubTokenInfo[]> {
    const { data } = await api.get('/admin/scr/github-tokens');
    return data.data.tokens;
  },

  async addGitHubToken(token: { platform: string; token: string; token_type: string }) {
    const { data } = await api.post('/admin/scr/github-tokens', token);
    return data.data;
  },

  async validateGitHubToken(token: { platform: string; token: string }) {
    const { data } = await api.post(
      '/admin/scr/github-tokens/validate',
      token
    );
    return data.data;
  },

  async updateGitHubToken(
    tokenId: string,
    token: { platform: string; token: string }
  ) {
    const { data } = await api.patch(
      `/admin/scr/github-tokens/${tokenId}`,
      token
    );
    return data.data;
  },

  async deleteGitHubToken(tokenId: string) {
    const { data } = await api.delete(`/admin/scr/github-tokens/${tokenId}`);
    return data.data;
  },

  // Agent Prompts
  async getAgentPrompt(agent: string): Promise<AgentPromptConfig> {
    const { data } = await api.get(`/admin/scr/agents/${agent}/prompts`);
    return data.data;
  },

  async updateAgentPrompt(agent: string, config: AgentPromptConfig) {
    const { data } = await api.patch(
      `/admin/scr/agents/${agent}/prompts`,
      config
    );
    return data.data;
  },

  async testAgentPrompt(agent: string, codeSnippet: string) {
    const { data } = await api.post(
      `/admin/scr/agents/${agent}/test-prompt`,
      { agent, code_snippet: codeSnippet }
    );
    return data.data;
  },

  async getAgentStats(agent: string, days: number = 30) {
    const { data } = await api.get(`/admin/scr/agents/${agent}/stats`, {
      params: { days },
    });
    return data.data;
  },

  // Pattern Library
  async listPatterns(agent?: string, category?: string) {
    const { data } = await api.get('/admin/scr/patterns', {
      params: { agent, category },
    });
    return data.data.patterns;
  },

  async updatePattern(patternId: string, enabled: boolean) {
    const { data } = await api.patch(`/admin/scr/patterns/${patternId}`, {
      enabled,
    });
    return data.data;
  },

  async createCustomPattern(patternData: JsonRecord) {
    const { data } = await api.post('/admin/scr/patterns', patternData);
    return data.data;
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// Findings CRUD API
// ─────────────────────────────────────────────────────────────────────────────

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
  estado: string;
  assignee_email?: string;
  responsable_notas?: string;
  created_at: string;
  updated_at: string;
}

export const scrFindingsAPI = {
  async listFindings(
    reviewId: string,
    filters?: {
      skip?: number;
      limit?: number;
      severidad?: string;
      estado?: string;
      tipo_riesgo?: string;
      sort_by?: string;
      sort_order?: string;
    }
  ) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/findings`,
      { params: filters }
    );
    return data.data;
  },

  async getFinding(reviewId: string, findingId: string): Promise<CodeSecurityFinding> {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/findings/${findingId}`
    );
    return data.data.finding;
  },

  async createFinding(reviewId: string, finding: JsonRecord) {
    const { data } = await api.post(
      `/code_security_reviews/${reviewId}/findings`,
      finding
    );
    return data.data.finding;
  },

  async updateFinding(
    reviewId: string,
    findingId: string,
    updates: JsonRecord
  ) {
    const { data } = await api.patch(
      `/code_security_reviews/${reviewId}/findings/${findingId}`,
      updates
    );
    return data.data.finding;
  },

  async deleteFinding(reviewId: string, findingId: string) {
    const { data } = await api.delete(
      `/code_security_reviews/${reviewId}/findings/${findingId}`
    );
    return data.data;
  },

  async transitionFindingState(
    reviewId: string,
    findingId: string,
    newState: string,
    reason?: string
  ) {
    const { data } = await api.post(
      `/code_security_reviews/${reviewId}/findings/${findingId}/transition-state`,
      { new_state: newState, reason }
    );
    return data.data;
  },

  async getRemediationPlan(reviewId: string, findingId: string) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/findings/${findingId}/remediation-plan`
    );
    return data.data.remediation_plan;
  },

  async addComment(reviewId: string, findingId: string, comment: string) {
    const { data } = await api.post(
      `/code_security_reviews/${reviewId}/findings/${findingId}/comments`,
      { comment }
    );
    return data.data.comment;
  },

  async getComments(reviewId: string, findingId: string) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/findings/${findingId}/comments`
    );
    return data.data.comments;
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// Forensic Investigation API
// ─────────────────────────────────────────────────────────────────────────────

export const scrForensicAPI = {
  async getForensicEvents(
    reviewId: string,
    filters?: { skip?: number; limit?: number; severity?: string }
  ) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/events`,
      { params: filters }
    );
    return data.data;
  },

  async searchForensicEvents(
    reviewId: string,
    query: string,
    filters?: {
      author?: string;
      file_pattern?: string;
      start_date?: string;
      end_date?: string;
    }
  ) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/events/search`,
      { params: { query, ...filters } }
    );
    return data.data;
  },

  async getTimeline(reviewId: string, granularity: string = 'daily') {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/timeline`,
      { params: { granularity } }
    );
    return data.data.timeline;
  },

  async getForensicSummary(reviewId: string) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/forensic/summary`
    );
    return data.data.summary;
  },

  async analyzeAuthorActivity(reviewId: string, author: string) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/author-analysis/${author}`
    );
    return data.data.analysis;
  },

  async detectAnomalies(reviewId: string, anomalyType?: string) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/anomalies`,
      { params: { anomaly_type: anomalyType } }
    );
    return data.data.anomalies;
  },

  async getCommitDetails(reviewId: string, commitHash: string) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/commit/${commitHash}/details`
    );
    return data.data.details;
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// Bulk Actions API
// ─────────────────────────────────────────────────────────────────────────────

export const scrBulkActionsAPI = {
  async bulkUpdateStatus(
    reviewId: string,
    findingIds: string[],
    newStatus: string,
    comment?: string
  ) {
    const { data } = await api.patch(
      `/code_security_reviews/${reviewId}/findings/bulk/status`,
      { finding_ids: findingIds, new_status: newStatus, comment }
    );
    return data.data;
  },

  async bulkAssign(
    reviewId: string,
    findingIds: string[],
    assigneeEmail: string,
    priority?: string
  ) {
    const { data } = await api.patch(
      `/code_security_reviews/${reviewId}/findings/bulk/assign`,
      { finding_ids: findingIds, assignee_email: assigneeEmail, priority }
    );
    return data.data;
  },

  async bulkMarkFalsePositives(
    reviewId: string,
    findingIds: string[],
    reason: string,
    feedback?: string
  ) {
    const { data } = await api.post(
      `/code_security_reviews/${reviewId}/findings/bulk/false-positive`,
      { finding_ids: findingIds, reason, feedback }
    );
    return data.data;
  },

  async createRemediationPlan(reviewId: string, findingIds: string[]) {
    const { data } = await api.post(
      `/code_security_reviews/${reviewId}/findings/bulk/remediation-plan`,
      { finding_ids: findingIds }
    );
    return data.data;
  },

  async exportFindings(
    reviewId: string,
    findingIds: string[],
    format: string = 'json',
    includeCodeSnippets: boolean = true
  ) {
    const { data } = await api.post(
      `/code_security_reviews/${reviewId}/findings/bulk/export`,
      {
        finding_ids: findingIds,
        format,
        include_code_snippets: includeCodeSnippets,
      }
    );
    return data.data;
  },

  async getStatusReport(reviewId: string) {
    const { data } = await api.get(
      `/code_security_reviews/${reviewId}/findings/bulk/status-report`
    );
    return data.data;
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// Exports for convenience
// ─────────────────────────────────────────────────────────────────────────────

export const scr = {
  dashboard: scrDashboardAPI,
  admin: scrAdminAPI,
  findings: scrFindingsAPI,
  forensic: scrForensicAPI,
  bulkActions: scrBulkActionsAPI,
};
