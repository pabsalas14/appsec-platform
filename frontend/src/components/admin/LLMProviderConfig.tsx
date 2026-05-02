'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Label,
} from '@/components/ui';

interface LLMProviderRow {
  id: string;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  timeout_seconds: number;
  is_default: boolean;
  api_key_hint: string;
  configured_at: string | null;
}

const PROVIDERS = [
  {
    value: 'anthropic',
    label: 'Anthropic',
    models: [
      'claude-sonnet-4-5',
      'claude-sonnet-4-20250514',
      'claude-opus-4-1',
      'claude-opus-4-20250514',
      'claude-3-5-haiku-20241022',
    ],
    description: 'Claude models from Anthropic',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    description: 'OpenAI GPT models',
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    models: ['openrouter/auto', 'gpt-4o', 'claude-3-5-sonnet', 'o1', 'qwen-2.5-coder', 'gemini-2.0-flash'],
    description: 'Multi-model routing via OpenRouter',
  },
  {
    value: 'litellm',
    label: 'LiteLLM Proxy',
    models: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-2.0-flash', 'custom-model'],
    description: 'LiteLLM Proxy endpoint',
  },
  {
    value: 'ollama',
    label: 'Ollama (Local)',
    models: ['llama2', 'mistral', 'neural-chat', 'dolphin-mixtral', 'custom-model'],
    description: 'Local Ollama instance',
  },
  {
    value: 'lmstudio',
    label: 'LM Studio (Local)',
    models: ['local-model'],
    description: 'Servidor local compatible con OpenAI',
  },
  {
    value: 'gemini',
    label: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    description: 'Modelos Gemini de Google',
  },
  {
    value: 'nvidia_nim',
    label: 'NVIDIA NIM',
    models: ['meta/llama-3.1-70b-instruct', 'mistralai/mixtral-8x7b-instruct-v0.1', 'custom-nim-model'],
    description: 'NVIDIA NIM u otro endpoint compatible con OpenAI',
  },
];

export function LLMProviderConfig() {
  const [providers, setProviders] = useState<LLMProviderRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('anthropic');
  const [formData, setFormData] = useState({
    api_key: '',
    model: 'claude-sonnet-4-5',
    base_url: '',
    temperature: 0.2,
    max_tokens: 4096,
    timeout: 60,
  });

  const currentProviderConfig = PROVIDERS.find((p) => p.value === selectedProvider);
  const [availableModels, setAvailableModels] = useState<string[]>(currentProviderConfig?.models || []);

  const requiresApiKey = !['ollama', 'lmstudio', 'litellm'].includes(selectedProvider);

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== 'object' || !('response' in error)) {
      return fallback;
    }
    const response = (error as { response?: { data?: { detail?: unknown } } }).response;
    const detail = response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (detail && typeof detail === 'object' && 'message' in detail) {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
    return fallback;
  };

  async function fetchProviders() {
    try {
      const response = await api.get('/admin/scr/llm-config');
      const envelope = response.data as {
        status?: string;
        data?: { providers?: LLMProviderRow[] };
      };
      if (envelope?.status === 'success' && Array.isArray(envelope.data?.providers)) {
        setProviders(envelope.data.providers);
      }
    } catch (error) {
      logger.error('admin.llm.fetch_failed', { error: String(error) });
    }
  }

  useEffect(() => {
    void fetchProviders();
  }, []);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const defaultModel = PROVIDERS.find((p) => p.value === provider)?.models[0] || '';
    setAvailableModels(PROVIDERS.find((p) => p.value === provider)?.models || []);
    setFormData((prev) => ({
      ...prev,
      model: defaultModel,
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.model) {
      toast.error('Selecciona un modelo primero');
      return;
    }
    if (requiresApiKey && !formData.api_key.trim()) {
      toast.error(`${currentProviderConfig?.label ?? 'Este proveedor'} requiere API key`);
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await api.post('/admin/scr/llm-config/test-connection', {
        provider: selectedProvider,
        api_key: formData.api_key.trim(),
        model: formData.model.trim(),
        base_url: formData.base_url.trim() || null,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        timeout_seconds: formData.timeout,
      });

      const envelope = response.data as { status?: string; data?: { valid?: boolean; message?: string; response_time_ms?: number; models?: string[] } };
      const data = envelope?.data;
      if (envelope?.status === 'success' && data?.valid) {
        if (Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
          if (!data.models.includes(formData.model)) {
            setFormData((prev) => ({ ...prev, model: data.models?.[0] ?? prev.model }));
          }
        }
        toast.success(`Conexión correcta (${data.response_time_ms ?? '?'} ms)`);
      } else {
        toast.error(data?.message ?? 'La prueba de conexión falló');
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error de conexión'));
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!formData.model) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    if (requiresApiKey && !formData.api_key.trim()) {
      toast.error(`${currentProviderConfig?.label ?? 'Este proveedor'} requiere API key`);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/admin/scr/llm-config', {
        provider: selectedProvider,
        model: formData.model.trim(),
        api_key: formData.api_key.trim(),
        base_url: formData.base_url.trim() || null,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        timeout_seconds: formData.timeout,
        is_default: true,
      });

      toast.success('✅ Configuración guardada');
      setFormData({
        api_key: '',
        model: availableModels[0],
        base_url: '',
        temperature: 0.2,
        max_tokens: 4096,
        timeout: 60,
      });
      // Reload providers
      void fetchProviders();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al guardar'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Proveedor LLM</CardTitle>
          <CardDescription>
            Selecciona un proveedor y configura los parámetros de IA para el módulo SCR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Proveedor*</Label>
              <Select
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                options={PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
              />
              <p className="text-xs text-muted-foreground">{currentProviderConfig?.description}</p>
            </div>

            {/* Model Selection - Dynamic */}
            <div className="space-y-2">
              <Label htmlFor="model">Modelo*</Label>
              <Select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                options={availableModels.map((m) => ({ value: m, label: m }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_url">Base URL</Label>
            <Input
              id="base_url"
              placeholder="Opcional: http://localhost:1234/v1, https://integrate.api.nvidia.com/v1"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Útil para LiteLLM, Ollama, LM Studio, OpenRouter y NIM.</p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key{requiresApiKey ? '*' : ''}</Label>
            <Input
              id="api_key"
              type="password"
              placeholder={`Ej: sk-ant-... (para ${selectedProvider})`}
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {requiresApiKey
                ? 'Requerida para este proveedor. Se guarda cifrada y solo se muestra un hint.'
                : 'Opcional para proveedores locales o proxies que no exigen autenticación.'}
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Temperatura: {formData.temperature.toFixed(2)}</Label>
              <span className="text-xs text-muted-foreground">0 = Determinístico, 1 = Creativo</span>
            </div>
            <Input
              type="range"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Max Tokens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Tokens por Chunk</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                min={512}
                max={4096}
              />
              <p className="text-xs text-muted-foreground">Tokens máximos por fragmento de código</p>
            </div>

            {/* Timeout */}
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (segundos)</Label>
              <Input
                id="timeout"
                type="number"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                min={10}
                max={300}
              />
              <p className="text-xs text-muted-foreground">Tiempo máximo de espera</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection || !formData.model}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Probando...
                </>
              ) : (
                'Probar Conexión'
              )}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Configuración'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Configurations */}
      {providers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuraciones Guardadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {PROVIDERS.find((p) => p.value === provider.provider)?.label} - {provider.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Temperatura: {provider.temperature} | Max tokens: {provider.max_tokens}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.is_default ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Predeterminado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400">
                        <X className="h-4 w-4" />
                        <span className="text-sm">Secundario</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
