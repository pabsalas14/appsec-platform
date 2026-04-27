"use client";

import { Loader2, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Switch,
} from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useSystemSettings, useUpsertSystemSetting } from '@/hooks/useSystemSettings';
import type { SystemSetting } from '@/types';

type Draft = Record<string, unknown>;

function renderEditor(setting: SystemSetting, value: unknown, onChange: (v: unknown) => void) {
  if (
    (setting.value !== null && typeof setting.value === 'object') ||
    (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('[')))
  ) {
    return (
      <textarea
        className="min-h-[132px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    );
  }
  if (typeof setting.value === 'boolean' || typeof value === 'boolean') {
    return <Switch checked={Boolean(value)} onCheckedChange={onChange} />;
  }
  if (typeof setting.value === 'number') {
    return (
      <Input
        type="number"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    );
  }
  if (setting.key === 'app.default_theme') {
    return (
      <Select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
      />
    );
  }
  return <Input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
}

function normalizeDraftValue(setting: SystemSetting, draftValue: unknown): unknown {
  if (setting.value !== null && typeof setting.value === 'object') {
    if (typeof draftValue !== 'string') return draftValue;
    try {
      return JSON.parse(draftValue);
    } catch {
      throw new Error('JSON inválido');
    }
  }
  return draftValue;
}

export default function AdminSettingsPage() {
  const { data, isLoading } = useSystemSettings();
  const upsert = useUpsertSystemSetting();
  const [draft, setDraft] = useState<Draft>({});

  const hasUnsavedChanges = useMemo(() => {
    if (!data?.length) return false;
    return data.some((setting) => {
      const original =
        setting.value !== null && typeof setting.value === 'object'
          ? JSON.stringify(setting.value, null, 2)
          : setting.value;
      return draft[setting.key] !== original;
    });
  }, [data, draft]);
  const { confirmIfNeeded } = useUnsavedChanges({ enabled: hasUnsavedChanges });

  useEffect(() => {
    if (!data) return;
    const initial: Draft = {};
    for (const row of data) {
      initial[row.key] =
        row.value !== null && typeof row.value === 'object' ? JSON.stringify(row.value, null, 2) : row.value;
    }
    setDraft(initial);
  }, [data]);

  const onSave = async (setting: SystemSetting) => {
    try {
      const value = normalizeDraftValue(setting, draft[setting.key]);
      await upsert.mutateAsync({ key: setting.key, value });
      toast.success(`${setting.key} saved`);
    } catch (e) {
      const msg = e instanceof Error && e.message === 'JSON inválido' ? 'JSON inválido' : `Failed to save ${setting.key}`;
      toast.error(msg);
    }
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="System Settings"
        description="Runtime-configurable values persisted in the database. Changes apply immediately; clients may need to refresh."
        action={
          hasUnsavedChanges ? (
            <span className="text-xs font-medium text-amber-600">Cambios sin guardar</span>
          ) : null
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((setting) => {
            const original =
              setting.value !== null && typeof setting.value === 'object'
                ? JSON.stringify(setting.value, null, 2)
                : setting.value;
            const dirty = draft[setting.key] !== original;
            return (
              <Card key={setting.key}>
                <CardHeader>
                  <CardTitle className="font-mono text-sm">{setting.key}</CardTitle>
                  {setting.description && (
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>{renderEditor(setting, draft[setting.key], (v) => setDraft((d) => ({ ...d, [setting.key]: v })))}</div>
                  <div className="flex items-center justify-end gap-2">
                    {dirty && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!confirmIfNeeded()) return;
                          setDraft((d) => ({ ...d, [setting.key]: original }));
                        }}
                      >
                        Discard
                      </Button>
                    )}
                    <Button size="sm" disabled={!dirty || upsert.isPending} onClick={() => onSave(setting)}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
