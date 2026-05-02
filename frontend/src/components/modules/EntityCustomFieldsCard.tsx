'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Switch } from '@/components/ui';
import {
  type EntityCustomFieldDef,
  useEntityCustomFields,
  usePatchEntityCustomField,
} from '@/hooks/useEntityCustomFields';
import { logger } from '@/lib/logger';
import { extractErrorMessage } from '@/lib/utils';

function SelectOptionsFromConfig(config: string | null): { value: string; label: string }[] {
  if (!config?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(config);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'options' in parsed) {
      const opts = (parsed as { options?: unknown }).options;
      if (Array.isArray(opts)) {
        return opts
          .filter((o): o is string => typeof o === 'string')
          .map((o) => ({ value: o, label: o }));
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function FieldEditor({
  field,
  rawValue,
  onSave,
  disabled,
}: {
  field: EntityCustomFieldDef;
  rawValue: string | null | undefined;
  onSave: (fieldId: string, value: string | null) => void;
  disabled: boolean;
}) {
  const label = field.label || field.name;
  const [local, setLocal] = useState<string>(() =>
    rawValue === null || rawValue === undefined ? '' : String(rawValue),
  );

  useEffect(() => {
    setLocal(rawValue === null || rawValue === undefined ? '' : String(rawValue));
  }, [rawValue]);

  const selectOpts = useMemo(() => SelectOptionsFromConfig(field.config ?? null), [field.config]);

  const commit = () => {
    const trimmed = local.trim();
    const normalized =
      field.field_type === 'boolean' ? (local === 'true' ? 'true' : local === 'false' ? 'false' : '') : trimmed;
    const out = normalized === '' ? null : normalized;
    const prev = rawValue === null || rawValue === undefined ? null : String(rawValue);
    if (out === prev) return;
    onSave(field.id, out);
  };

  let control: ReactNode = null;
  if (field.field_type === 'boolean') {
    control = (
      <div className="flex items-center gap-2">
        <Switch
          checked={local === 'true'}
          onCheckedChange={(v) => {
            const s = v ? 'true' : 'false';
            setLocal(s);
            onSave(field.id, s);
          }}
          disabled={disabled}
        />
        <span className="text-sm text-muted-foreground">{local === 'true' ? 'Sí' : 'No'}</span>
      </div>
    );
  } else if (field.field_type === 'select' && selectOpts.length > 0) {
    control = (
      <Select
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          onSave(field.id, e.target.value.trim() ? e.target.value : null);
        }}
        disabled={disabled}
        options={selectOpts}
      />
    );
  } else {
    control = (
      <>
        <Input
          type={
            field.field_type === 'number'
              ? 'number'
              : field.field_type === 'date'
                ? 'date'
                : field.field_type === 'url'
                  ? 'url'
                  : 'text'
          }
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          disabled={disabled}
          className="font-mono text-sm"
        />
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={commit} disabled={disabled}>
            Guardar
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/80 p-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {field.description ? <p className="text-xs text-muted-foreground">{field.description}</p> : null}
      </div>
      {control}
    </div>
  );
}

export function EntityCustomFieldsCard({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { data, isLoading, isError } = useEntityCustomFields(entityType, entityId);
  const patch = usePatchEntityCustomField(entityType, entityId);

  const sortedFields = useMemo(() => {
    const f = data?.fields;
    if (!f?.length) return [];
    return [...f].sort((a, b) => (a.label ?? a.name).localeCompare(b.label ?? b.name));
  }, [data?.fields]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campos personalizados</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando…
        </CardContent>
      </Card>
    );
  }

  if (isError || !data || sortedFields.length === 0) {
    return null;
  }

  const values = data.values ?? {};

  const save = (fieldId: string, value: string | null) => {
    patch.mutate(
      { fieldId, value },
      {
        onSuccess: () => toast.success('Campo actualizado'),
        onError: (e) => {
          logger.error('entity_custom_field.save.failed', { entityType, entityId, fieldId });
          toast.error(extractErrorMessage(e, 'No se pudo guardar'));
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Campos personalizados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedFields.map((field) => (
          <FieldEditor
            key={field.id}
            field={field}
            rawValue={values[field.id] ?? null}
            onSave={save}
            disabled={patch.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
}
