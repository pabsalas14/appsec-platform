/**
 * AI Rules types — FASE 8
 * These types are derived from the backend schemas and used for frontend components.
 */

export type TriggerType =
  | 'on_vulnerability_created'
  | 'on_vulnerability_status_changed'
  | 'on_release_created'
  | 'on_theme_created'
  | 'on_sla_at_risk'
  | 'cron';

export type ActionType =
  | 'send_notification'
  | 'create_ticket'
  | 'assign_to_user'
  | 'tag_entity'
  | 'generate_summary'
  | 'enrich_data'
  | 'suggest_fix';

export interface AIRuleBase {
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  enabled: boolean;
  max_retries: number;
  timeout_seconds: number;
}

export type AIRuleCreate = AIRuleBase;

export interface AIRuleUpdate {
  name?: string;
  description?: string;
  trigger_type?: TriggerType;
  trigger_config?: Record<string, unknown>;
  action_type?: ActionType;
  action_config?: Record<string, unknown>;
  enabled?: boolean;
  max_retries?: number;
  timeout_seconds?: number;
}

export interface AIRuleRead extends AIRuleBase {
  id: string; // UUID string
  created_by?: string; // UUID string
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface AIRuleList {
  items: AIRuleRead[];
  total: number;
  page: number;
  per_page: number;
}

export interface AIRuleTest {
  data: Record<string, unknown>;
}

export interface AIRuleTestResult {
  rule_id: string; // UUID
  status: 'success' | 'error';
  message: string;
  dry_run: boolean;
  execution_time_ms?: number;
  error_details?: string;
}

export interface TriggerMetadata {
  id: TriggerType;
  label: string;
  description: string;
  configurable_fields: string[];
}

export interface ActionMetadata {
  id: ActionType;
  label: string;
  description: string;
  configurable_fields: string[];
}
