# 🔗 SCR Frontend Integration Guide

**Guía práctica para conectar los componentes frontend con los endpoints backend de SCR**

---

## 📦 Setup Inicial

### 1. Importar el API Service

```typescript
// frontend/src/hooks/useCodeSecurityReviews.ts (crear este archivo)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scr } from '@/services/scr-api';

// Hook para obtener KPIs del dashboard
export function useSCRDashboard(days: number = 30) {
  return useQuery({
    queryKey: ['scr-dashboard-kpis', days],
    queryFn: () => scr.dashboard.getKPIs(days),
  });
}

// Hook para obtener costos
export function useSCRCosts(days: number = 30) {
  return useQuery({
    queryKey: ['scr-dashboard-costs', days],
    queryFn: () => scr.dashboard.getCosts(days),
  });
}

// Hook para obtener tendencias
export function useSCRTrends(days: number = 30) {
  return useQuery({
    queryKey: ['scr-dashboard-trends', days],
    queryFn: () => scr.dashboard.getTrends(days),
  });
}

// Hook para obtener top repos
export function useSCRTopRepos() {
  return useQuery({
    queryKey: ['scr-dashboard-top-repos'],
    queryFn: () => scr.dashboard.getTopRepos(),
  });
}
```

### 2. Actualizar SCRDashboard Component

```typescript
// frontend/src/components/scr/SCRDashboard.tsx

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useSCRDashboard, useSCRCosts, useSCRTrends, useSCRTopRepos } from '@/hooks/useCodeSecurityReviews';

export function SCRDashboard() {
  const [days, setDays] = useState(30);
  
  // Queries
  const kpis = useSCRDashboard(days);
  const costs = useSCRCosts(days);
  const trends = useSCRTrends(days);
  const repos = useSCRTopRepos();

  if (kpis.isLoading) return <div>Loading...</div>;
  if (kpis.isError) return <div>Error loading dashboard</div>;

  const kpiData = kpis.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SCR Dashboard</h1>
        
        {/* Period Selector */}
        <select 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="activity">Actividad y Riesgo</TabsTrigger>
          <TabsTrigger value="costs">Análisis de Costos</TabsTrigger>
        </TabsList>

        {/* Tab 1: Activity */}
        <TabsContent value="activity" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard 
              label="Total Escaneos"
              value={kpiData?.total_scans || 0}
              icon="📊"
            />
            <KPICard 
              label="Hallazgos Críticos"
              value={kpiData?.critical_findings || 0}
              icon="⚠️"
              variant="critical"
            />
            <KPICard 
              label="Hallazgos Altos"
              value={kpiData?.high_findings || 0}
              icon="🔴"
              variant="high"
            />
            <KPICard 
              label="Repos Escaneados"
              value={kpiData?.scanned_repos || 0}
              icon="📦"
            />
            <KPICard 
              label="Remediación Promedio"
              value={`${kpiData?.avg_remediation_days || 0} días`}
              icon="⏱️"
            />
          </div>

          {/* Top Repos Table */}
          {repos.data && (
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Top 5 Repositorios</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Repositorio</th>
                    <th className="text-center">Críticos</th>
                    <th className="text-center">Altos</th>
                    <th className="text-center">Medios</th>
                    <th className="text-center">Bajos</th>
                    <th className="text-right">Último Escaneo</th>
                  </tr>
                </thead>
                <tbody>
                  {repos.data.map((repo) => (
                    <tr key={repo.name} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div>
                          <div className="font-semibold">{repo.name}</div>
                          <div className="text-sm text-gray-500">{repo.organization}</div>
                        </div>
                      </td>
                      <td className="text-center text-red-600 font-bold">{repo.critical}</td>
                      <td className="text-center text-orange-600 font-bold">{repo.high}</td>
                      <td className="text-center text-yellow-600">{repo.medium}</td>
                      <td className="text-center text-green-600">{repo.low}</td>
                      <td className="text-right text-sm text-gray-500">
                        {new Date(repo.last_scan).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Costs */}
        <TabsContent value="costs" className="space-y-6">
          {costs.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard 
                label="Costo Total"
                value={`$${costs.data.total_cost.toFixed(2)}`}
                icon="💰"
              />
              <KPICard 
                label="Tokens Consumidos"
                value={`${(costs.data.tokens_consumed / 1_000_000).toFixed(1)}M`}
                icon="🔷"
              />
              <KPICard 
                label="Costo Promedio/Escaneo"
                value={`$${costs.data.avg_cost_per_scan.toFixed(2)}`}
                icon="📈"
              />
              <KPICard 
                label="Ahorros Incrementales"
                value={`${costs.data.incremental_savings}%`}
                icon="📉"
                variant="success"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente KPI Card
interface KPICardProps {
  label: string;
  value: string | number;
  icon: string;
  variant?: 'default' | 'critical' | 'high' | 'success';
}

function KPICard({ label, value, icon, variant = 'default' }: KPICardProps) {
  const bgColor = {
    default: 'bg-blue-50',
    critical: 'bg-red-50',
    high: 'bg-orange-50',
    success: 'bg-green-50',
  }[variant];

  const textColor = {
    default: 'text-blue-600',
    critical: 'text-red-600',
    high: 'text-orange-600',
    success: 'text-green-600',
  }[variant];

  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}
```

---

## 🔧 Integration Examples

### Admin Integrations Component

```typescript
// frontend/src/components/admin/IntegrationsPage.tsx

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { scr } from '@/services/scr-api';
import { toast } from 'sonner';

export function AdminIntegrations() {
  const [selectedLLMProvider, setSelectedLLMProvider] = useState('anthropic');

  // Mutation para guardar configuración LLM
  const setLLMConfig = useMutation({
    mutationFn: (config) => scr.admin.setLLMConfig(config),
    onSuccess: () => {
      toast.success('LLM configuration saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });

  // Mutation para probar conexión
  const testConnection = useMutation({
    mutationFn: (config) => scr.admin.testLLMConnection(config),
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(`✅ Successfully connected to ${data.provider}`);
      } else {
        toast.error(`❌ Connection failed: ${data.message}`);
      }
    },
  });

  const handleSaveLLM = async (formData) => {
    await setLLMConfig.mutateAsync({
      provider: formData.provider,
      api_key: formData.apiKey,
      model: formData.model,
      temperature: formData.temperature,
      max_tokens: formData.maxTokens,
      timeout_seconds: formData.timeout,
    });
  };

  return (
    <div className="space-y-6">
      {/* LLM Provider Tab */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Proveedor LLM</h2>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSaveLLM({
            provider: formData.get('provider'),
            apiKey: formData.get('apiKey'),
            model: formData.get('model'),
            temperature: parseFloat(formData.get('temperature')),
            maxTokens: parseInt(formData.get('maxTokens')),
            timeout: parseInt(formData.get('timeout')),
          });
        }}>
          
          {/* Provider Select */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Provider</label>
            <select
              name="provider"
              value={selectedLLMProvider}
              onChange={(e) => setSelectedLLMProvider(e.target.value)}
              className="w-full px-4 py-2 border rounded"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="litellm">LiteLLM</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>

          {/* API Key Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">API Key</label>
            <input
              name="apiKey"
              type="password"
              placeholder="sk-..."
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          {/* Model Select (dynamic based on provider) */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              name="model"
              className="w-full px-4 py-2 border rounded"
            >
              {selectedLLMProvider === 'anthropic' && (
                <>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-opus">Claude Opus</option>
                </>
              )}
              {selectedLLMProvider === 'openai' && (
                <>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </>
              )}
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Temperature: <span id="temp-value">0.3</span>
            </label>
            <input
              name="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              defaultValue="0.3"
              onChange={(e) => {
                document.getElementById('temp-value').textContent = e.target.value;
              }}
              className="w-full"
            />
          </div>

          {/* Max Tokens */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Max Tokens</label>
            <input
              name="maxTokens"
              type="number"
              defaultValue="2048"
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          {/* Timeout */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Timeout (seconds)</label>
            <input
              name="timeout"
              type="number"
              defaultValue="300"
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                const formData = new FormData(document.querySelector('form'));
                testConnection.mutate({
                  provider: formData.get('provider'),
                  api_key: formData.get('apiKey'),
                  model: formData.get('model'),
                  temperature: parseFloat(formData.get('temperature')),
                  max_tokens: parseInt(formData.get('maxTokens')),
                  timeout_seconds: parseInt(formData.get('timeout')),
                });
              }}
              disabled={testConnection.isPending}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {testConnection.isPending ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              type="submit"
              disabled={setLLMConfig.isPending}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {setLLMConfig.isPending ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Findings Management Component

```typescript
// frontend/src/hooks/useCodeSecurityFindings.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scr } from '@/services/scr-api';

export function useFindings(reviewId: string, filters?: any) {
  return useQuery({
    queryKey: ['findings', reviewId, filters],
    queryFn: () => scr.findings.listFindings(reviewId, filters),
  });
}

export function useFinding(reviewId: string, findingId: string) {
  return useQuery({
    queryKey: ['finding', reviewId, findingId],
    queryFn: () => scr.findings.getFinding(reviewId, findingId),
    enabled: !!findingId,
  });
}

export function useUpdateFindingStatus(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ findingId, estado }) =>
      scr.findings.updateFinding(reviewId, findingId, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', reviewId] });
    },
  });
}

export function useBulkUpdateStatus(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ findingIds, newStatus, comment }) =>
      scr.bulkActions.bulkUpdateStatus(reviewId, findingIds, newStatus, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', reviewId] });
    },
  });
}
```

---

## 🔄 Complete Flow Example: Update Finding Status

```typescript
// Complete example: Update a finding's status

import { useUpdateFindingStatus } from '@/hooks/useCodeSecurityFindings';
import { toast } from 'sonner';

function FindingStatusButton({ reviewId, findingId, currentStatus }) {
  const updateStatus = useUpdateFindingStatus(reviewId);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus.mutateAsync({
        findingId,
        estado: newStatus,
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={updateStatus.isPending}
      className="px-3 py-1 border rounded text-sm"
    >
      <option value="DETECTED">Detected</option>
      <option value="IN_REVIEW">In Review</option>
      <option value="IN_CORRECTION">In Correction</option>
      <option value="CORRECTED">Corrected</option>
      <option value="VERIFIED">Verified</option>
      <option value="FALSE_POSITIVE">False Positive</option>
    </select>
  );
}
```

---

## 📋 Checklist: Conexión Frontend-Backend

- [ ] Importar `scr-api.ts` en componentes
- [ ] Crear hooks para cada query/mutation
- [ ] Actualizar SCRDashboard con datos reales
- [ ] Actualizar LLMProviderConfig con API calls
- [ ] Actualizar GitHubTokenConfig con API calls
- [ ] Implementar findings table con CRUD
- [ ] Implementar forensic search
- [ ] Implementar bulk actions UI
- [ ] Agregar error handling con toast notifications
- [ ] Agregar loading states
- [ ] Validar permisos (P.CODE_SECURITY.*)
- [ ] Testing E2E de flujos completos

---

## 🚀 Próximos Pasos

1. Copiar este archivo
2. Implementar los hooks en `frontend/src/hooks/`
3. Actualizar componentes uno por uno
4. Probar cada endpoint con Postman primero
5. Implementar UI completa
6. Run: `npm run dev` y probar en http://localhost:3000
7. Ejecutar tests: `npm run test`
8. Deploy a staging

¡Ya está 95% listo! Solo queda conectar las últimas piezas del puzzle. 🎯
