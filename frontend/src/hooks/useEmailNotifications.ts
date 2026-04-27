import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { EmailTemplate, EmailLog, UserEmailPreference } from '@/types/api';

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
