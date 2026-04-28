import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject?: string;
  body?: string;
  html_content?: string;
  is_default: boolean;
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

export interface UserEmailPreference {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Email Templates
export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get('/email-templates');
      return response.data as EmailTemplate[];
    },
  });
}

export function useUpsertEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const response = await api.post('/email-templates', template);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}

// User Email Preferences
export function useUserEmailPreferences() {
  return useQuery({
    queryKey: ['user-email-preferences'],
    queryFn: async () => {
      const response = await api.get('/user-preferences');
      return response.data as UserEmailPreference[];
    },
  });
}

export function useUpsertUserEmailPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preference: Partial<UserEmailPreference>) => {
      const response = await api.put('/user-preferences', preference);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-email-preferences'] });
    },
  });
}

// Email Logs
export function useEmailLogs(limit: number = 50) {
  return useQuery({
    queryKey: ['email-logs', limit],
    queryFn: async () => {
      const response = await api.get(`/email-logs?limit=${limit}`);
      return response.data as EmailLog[];
    },
  });
}

// Send Test Notification
export function useSendTestNotification() {
  return useMutation({
    mutationFn: async (params: { notification_type: string; recipient_email?: string }) => {
      const response = await api.post('/send-notification', {
        action: 'send_test',
        ...params,
      });
      return response.data;
    },
  });
}
