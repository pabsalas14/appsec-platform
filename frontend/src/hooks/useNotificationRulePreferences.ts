'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  notificationRulePreferencesPatchSchema,
  notificationRulePreferencesSchema,
  type NotificationRulePreferences,
  type NotificationRulePreferencesPatch,
} from '@/lib/schemas/notification_rule_preferences.schema';

type Envelope<T> = { status: string; data: T };

const KEY = ['notification-rule-preferences'] as const;

export function useNotificationRulePreferences() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<NotificationRulePreferences>>(
        '/notificacions/preferences/me',
      );
      if (data.status !== 'success') {
        throw new Error('Preferencias no disponibles');
      }
      return notificationRulePreferencesSchema.parse(data.data);
    },
  });
}

export function useUpdateNotificationRulePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: NotificationRulePreferencesPatch) => {
      const payload = notificationRulePreferencesPatchSchema.parse(patch);
      const { data } = await api.patch<Envelope<NotificationRulePreferences>>(
        '/notificacions/preferences/me',
        payload,
      );
      if (data.status !== 'success') {
        throw new Error('No se pudieron guardar las preferencias');
      }
      return notificationRulePreferencesSchema.parse(data.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: unknown) => {
      logger.error('notification_rule_preferences.patch_failed', { err });
    },
  });
}
