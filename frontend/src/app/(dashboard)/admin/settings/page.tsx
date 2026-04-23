"use client";

import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { useSystemSettings, useUpsertSystemSetting } from '@/hooks/useSystemSettings';
import type { SystemSetting } from '@/types';

type Draft = Record<string, unknown>;

function renderEditor(setting: SystemSetting, value: unknown, onChange: (v: unknown) => void) {
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

export default function AdminSettingsPage() {
  const { data, isLoading } = useSystemSettings();
  const upsert = useUpsertSystemSetting();
  const [draft, setDraft] = useState<Draft>({});

  useEffect(() => {
    if (!data) return;
    const initial: Draft = {};
    for (const row of data) initial[row.key] = row.value;
    setDraft(initial);
  }, [data]);

  const onSave = async (setting: SystemSetting) => {
    try {
      await upsert.mutateAsync({ key: setting.key, value: draft[setting.key] });
      toast.success(`${setting.key} saved`);
    } catch (_e) {
      toast.error(`Failed to save ${setting.key}`);
    }
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="System Settings"
        description="Runtime-configurable values persisted in the database. Changes apply immediately; clients may need to refresh."
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((setting) => {
            const dirty = draft[setting.key] !== setting.value;
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
                        onClick={() => setDraft((d) => ({ ...d, [setting.key]: setting.value }))}
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
