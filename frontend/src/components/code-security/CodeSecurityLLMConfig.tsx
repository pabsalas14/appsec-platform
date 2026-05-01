'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProviderStatus {
  available: boolean;
  status: 'healthy' | 'unavailable' | 'error';
  error?: string;
}

interface ProvidersHealth {
  providers: Record<string, ProviderStatus>;
}

interface CodeSecurityLLMConfigProps {
  selectedProvider: string;
  onSelect: (provider: string) => void;
}

export function CodeSecurityLLMConfig({
  selectedProvider,
  onSelect,
}: CodeSecurityLLMConfigProps) {
  const [providersHealth, setProvidersHealth] = useState<ProvidersHealth | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch provider health on mount
  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const response = await api.get('/code_security_reviews/providers/health');
        setProvidersHealth(response.data.data);
      } catch (_error: unknown) {
        toast.error('Failed to check LLM provider status');
        setProvidersHealth(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  const providers = [
    { id: 'anthropic', name: 'Anthropic Claude', description: 'Claude 3.5 Sonnet (Recommended)' },
    { id: 'openai', name: 'OpenAI', description: 'GPT-4 Turbo' },
    { id: 'openrouter', name: 'OpenRouter', description: 'Multi-model gateway' },
    { id: 'ollama', name: 'Ollama', description: 'Local LLM (self-hosted)' },
    { id: 'litellm', name: 'LiteLLM', description: 'Multi-provider proxy' },
  ];

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Checking provider availability...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Provider Selector */}
      <select
        value={selectedProvider}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
            {providersHealth?.providers[provider.id]?.available ? ' ✓' : ' (unavailable)'}
          </option>
        ))}
      </select>

      {/* Provider Status Cards */}
      <div className="grid gap-3">
        {providers.map((provider) => {
          const health = providersHealth?.providers[provider.id];
          const isSelected = selectedProvider === provider.id;
          const isAvailable = health?.available ?? false;

          return (
            <button
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              disabled={!isAvailable}
              className={cn(
                'text-left p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.08]',
                !isAvailable && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    {provider.name}
                    {isSelected && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                    {isAvailable && (
                      <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                        ✓ Available
                      </span>
                    )}
                    {!isAvailable && (
                      <span className="text-xs bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                        ✗ Not available
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{provider.description}</p>
                  {health?.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Error: {health.error}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Warning if selected provider is unavailable */}
      {selectedProvider && !providersHealth?.providers[selectedProvider]?.available && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⚠ Warning: The selected provider is not available. Please check API keys and configuration.
          </p>
        </div>
      )}

      {/* Help text */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-400 space-y-2">
        <p>
          <strong>Note:</strong> Make sure your API keys are configured as environment variables or in system settings.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Anthropic: ANTHROPIC_API_KEY</li>
          <li>OpenAI: OPENAI_API_KEY</li>
          <li>OpenRouter: OPENROUTER_API_KEY</li>
          <li>Ollama: Running on localhost:11434</li>
        </ul>
      </div>
    </div>
  );
}
