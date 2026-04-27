'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  PageWrapper,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import { useIATestCall, useIAConfig, useUpdateIAConfig, type IAConfig } from '@/hooks/useIAConfig';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const PROVIDERS = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'azure_openai', label: 'Azure OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'bedrock', label: 'AWS Bedrock' },
];

export default function AdminIAConfigPage() {
  const { data, isLoading } = useIAConfig();
  const update = useUpdateIAConfig();
  const testCall = useIATestCall();
  const [draft, setDraft] = useState<IAConfig | null>(null);
  const [testPrompt, setTestPrompt] = useState(
    'Resume en 3 puntos el objetivo de una plataforma AppSec orientada a riesgo.',
  );
  const [dryRun, setDryRun] = useState(true);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const dirty = useMemo(() => {
    if (!data || !draft) return false;
    return JSON.stringify(data) !== JSON.stringify(draft);
  }, [data, draft]);
  const { confirmIfNeeded } = useUnsavedChanges({ enabled: dirty });

  const onSave = async () => {
    if (!draft) return;
    await update.mutateAsync(draft);
    toast.success('Configuración IA guardada');
  };

  const onTest = async () => {
    const result = await testCall.mutateAsync({ prompt: testPrompt, dry_run: dryRun });
    toast.success(`Respuesta IA (${result.provider}/${result.model}) recibida`);
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="IA Builder — Configuración global"
        description="Configura proveedor, modelo y parámetros base de IA. Incluye llamada de prueba auditada."
      />
      {isLoading || !draft ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Proveedor y modelo</CardTitle>
              <CardDescription>Estos valores alimentan los casos de uso de IA del sistema.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Proveedor activo</label>
                <Select
                  value={draft.proveedor_activo}
                  onChange={(e) => setDraft({ ...draft, proveedor_activo: e.target.value })}
                  options={PROVIDERS}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Modelo</label>
                <Input value={draft.modelo} onChange={(e) => setDraft({ ...draft, modelo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperatura</label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={draft.temperatura}
                  onChange={(e) => setDraft({ ...draft, temperatura: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max tokens</label>
                <Input
                  type="number"
                  min="128"
                  max="32768"
                  value={draft.max_tokens}
                  onChange={(e) => setDraft({ ...draft, max_tokens: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timeout (segundos)</label>
                <Input
                  type="number"
                  min="5"
                  max="300"
                  value={draft.timeout_segundos}
                  onChange={(e) => setDraft({ ...draft, timeout_segundos: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
                <span className="text-sm">Sanitizar datos PII</span>
                <Switch
                  checked={draft.sanitizar_datos_paga}
                  onCheckedChange={(v) => setDraft({ ...draft, sanitizar_datos_paga: v })}
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                {dirty && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!confirmIfNeeded()) return;
                      setDraft(data);
                    }}
                  >
                    Descartar
                  </Button>
                )}
                <Button onClick={onSave} disabled={!dirty || update.isPending}>
                  {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prueba de proveedor</CardTitle>
              <CardDescription>Ejecuta una llamada de prueba para validar conectividad y configuración.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} rows={4} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={dryRun} onCheckedChange={setDryRun} />
                  <span className="text-sm text-muted-foreground">Dry-run (sin costo real si aplica)</span>
                </div>
                <Button onClick={onTest} disabled={testCall.isPending || !testPrompt.trim()}>
                  {testCall.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FlaskConical className="mr-2 h-4 w-4" />
                  )}
                  Probar
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PageWrapper>
  );
}

