import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient as api } from '@/lib/api';

/** Alineado al backend `EmailTemplateResponse`. */
export interface EmailTemplate {
  id: string;
  nombre: string;
  descripcion?: string | null;
  asunto: string;
  cuerpo_html: string;
  variables?: string[] | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  notification_type: string;
  subject: string;
  recipient_email: string;
  status: 'sent' | 'failed' | 'pending';
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

/** Respuesta de `GET/PATCH /user-preferences` (S18). */
export interface NotificationPreferences {
  notificaciones_automaticas: boolean;
  email_notificaciones: Record<string, boolean | number>;
  digest_type: string;
  digest_hour_utc: number;
}

type Envelope<T> = { status: 'success'; data: T };

// Email Templates
export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get<Envelope<EmailTemplate[]>>('/email-templates');
      return response.data.data;
    },
  });
}

export function useUpsertEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const response = await api.post<Envelope<EmailTemplate>>('/email-templates', template);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['user-notification-preferences'],
    queryFn: async () => {
      const response = await api.get<Envelope<NotificationPreferences>>('/user-preferences');
      return response.data.data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => {
      const response = await api.patch<Envelope<NotificationPreferences>>('/user-preferences', patch);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notification-preferences'] });
    },
  });
}

export function useEmailLogs(limit: number = 50) {
  return useQuery({
    queryKey: ['email-logs', limit],
    queryFn: async () => {
      const response = await api.get<Envelope<EmailLog[]>>(`/email-logs?limit=${limit}`);
      return response.data.data;
    },
  });
}
