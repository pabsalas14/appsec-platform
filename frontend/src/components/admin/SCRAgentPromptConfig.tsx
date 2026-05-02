'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, FileText, RotateCcw, Save, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Label,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { cn } from '@/lib/utils';

type AgentId = 'inspector' | 'detective' | 'fiscal';
type AgentTab = 'prompt' | 'patterns' | 'stats';

type AgentPrompt = {
  agent: AgentId;
  system_prompt: string;
  analysis_context: string;
  output_format: string;
  llm_config_id?: string | null;
  provider?: string | null;
  last_updated?: string | null;
};

type LlmConfig = {
  id: string;
  provider: string;
  model: string;
  is_default: boolean;
};

type AgentStats = {
  agent: AgentId;
  period_days: number;
  tokens_consumed: number;
  avg_processing_time_seconds: number;
  estimated_cost_usd?: number;
  precision_rate?: number | null;
  confirmed_findings?: number;
  false_positives?: number;
  analyses_count?: number;
  findings_detected?: number;
  forensic_events_detected?: number;
  reports_generated?: number;
};

type DetectionPattern = {
  id: string;
  agent: AgentId;
  category: string;
  name: string;
  description: string;
  enabled: boolean;
  detections_count: number;
};

type AgentMeta = {
  id: AgentId;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryMetricLabel: string;
  secondaryMetricLabel: string;
};

const AGENTS: AgentMeta[] = [
  {
    id: 'inspector',
    title: 'Inspector Agent',
    subtitle: 'Detección de código malicioso',
    description: 'Analiza código fuente y reporta evidencia técnica con confianza.',
    accent: 'blue',
    icon: Search,
    primaryMetricLabel: 'Escaneos',
    secondaryMetricLabel: 'Hallazgos',
  },
  {
    id: 'detective',
    title: 'Detective Agent',
    subtitle: 'Forense Git y trazabilidad',
    description: 'Correlaciona hallazgos con commits, autores y anomalías.',
    accent: 'amber',
    icon: ShieldCheck,
    primaryMetricLabel: 'Análisis',
    secondaryMetricLabel: 'Eventos',
  },
  {
    id: 'fiscal',
    title: 'Fiscal Agent',
    subtitle: 'Dictamen ejecutivo',
    description: 'Consolida evidencia, impacto, riesgo y remediación.',
    accent: 'emerald',
    icon: FileText,
    primaryMetricLabel: 'Análisis',
    secondaryMetricLabel: 'Reportes',
  },
];

const DEFAULT_PROMPTS: Record<AgentId, Omit<AgentPrompt, 'agent' | 'llm_config_id'>> = {
  inspector: {
    system_prompt:
      'Actúa como Inspector SCR senior especializado en detección de código malicioso dentro de repositorios corporativos. Tu misión es encontrar evidencia técnica de comportamiento malicioso o abuso deliberado, no vulnerabilidades genéricas. Prioriza backdoors, ejecución remota encubierta, exfiltración, robo o exposición de secretos, logic bombs, sabotaje, persistencia, evasión, dependencias sospechosas y cambios que degraden controles de seguridad. Debes basar cada hallazgo en evidencia observable del código recibido. No inventes archivos, líneas, autores ni impacto. Si la evidencia es débil, baja la confianza o no reportes el hallazgo. Responde exclusivamente JSON válido, sin markdown ni texto adicional.',
    analysis_context:
      'Analiza el fragmento como parte de un escaneo SCR. Revisa intención, flujo de datos, llamadas a red, manejo de archivos, ejecución de comandos, uso de credenciales, dependencias, hooks, scripts de build/deploy y cualquier patrón diseñado para ocultarse. Diferencia código legítimo de administración/observabilidad frente a comportamiento malicioso. Cada hallazgo debe incluir archivo, rango de líneas cuando exista, snippet mínimo, explicación de por qué es sospechoso, impacto probable, confianza entre 0 y 1 y remediación accionable.',
    output_format:
      'JSON estricto: {"findings":[{"tipo_malicia":"backdoor|exfiltracion|secreto|rce|logic_bomb|sabotaje|persistencia|evasion|dependencia_sospechosa|otro","severidad":"critical|high|medium|low","confianza":0.0,"archivo":"string","linea_inicio":0,"linea_fin":0,"snippet":"string","descripcion":"string","evidencia":["string"],"impacto":"string","remediacion_sugerida":"string","razonamiento":"string"}]}. Si no hay evidencia suficiente: {"findings":[]}.',
    provider: null,
    last_updated: null,
  },
  detective: {
    system_prompt:
      'Actúa como Detective SCR, investigador forense de Git y trazabilidad de cambios. Tu trabajo es correlacionar hallazgos técnicos con commits, autores, archivos, tiempos, ramas y patrones de modificación para explicar cómo pudo introducirse el riesgo. Busca señales como cambios pequeños en zonas críticas, commits fuera de horario, mensajes evasivos, autores nuevos, modificaciones a CI/CD, dependencias, scripts, permisos, autenticación o controles de auditoría. No acuses a una persona sin evidencia: reporta hechos verificables e indicadores. Responde exclusivamente JSON válido, sin markdown ni texto adicional.',
    analysis_context:
      'Usa los hallazgos del Inspector y la metadata Git disponible para construir una línea de tiempo forense. Evalúa si el cambio parece accidental, negligente o deliberadamente sospechoso según evidencia concreta. Agrupa eventos relacionados, identifica archivos críticos, commits pivote, autoría, señales de ocultamiento y dependencias entre cambios. Si falta metadata, declara la limitación en el campo descripcion y reduce la confianza.',
    output_format:
      'JSON estricto: {"events":[{"commit_hash":"string|null","autor":"string|null","fecha":"string|null","archivo":"string","accion":"added|modified|deleted|renamed|unknown","nivel_riesgo":"critical|high|medium|low","confianza":0.0,"indicadores":["string"],"hallazgos_relacionados":["string"],"descripcion":"string","hipotesis":"string","siguiente_paso":"string"}],"timeline_summary":"string"}. Si no hay evidencia suficiente: {"events":[],"timeline_summary":"Sin eventos forenses concluyentes con la evidencia disponible."}.',
    provider: null,
    last_updated: null,
  },
  fiscal: {
    system_prompt:
      'Actúa como Fiscal SCR, responsable de convertir evidencia técnica y forense en un dictamen ejecutivo claro, defendible y accionable. Debes consolidar hallazgos del Inspector y eventos del Detective, estimar riesgo global, separar hechos de hipótesis, priorizar remediación y explicar impacto para seguridad, negocio y operación. No exageres severidad ni inventes datos. Si la evidencia no sostiene una conclusión, decláralo explícitamente. Responde exclusivamente JSON válido, sin markdown ni texto adicional.',
    analysis_context:
      'Genera un reporte final para responsables técnicos y gerenciales. Resume el alcance analizado, principales riesgos, evidencia clave, confianza, impacto, recomendaciones priorizadas y pasos de contención/remediación. Incluye una conclusión proporcional a la evidencia y marca supuestos o limitaciones cuando existan. La puntuación global debe considerar severidad, confianza, explotabilidad, alcance del repositorio y correlación forense.',
    output_format:
      'JSON estricto: {"resumen_ejecutivo":"string","puntuacion_riesgo_global":0,"severidad_global":"critical|high|medium|low|informational","confianza_global":0.0,"evidencia_clave":["string"],"impacto":"string","pasos_remediacion":["string"],"acciones_inmediatas":["string"],"supuestos_limitaciones":["string"],"conclusion":"string"}.',
    provider: null,
    last_updated: null,
  },
};

const emptyPrompt = (agent: AgentId): AgentPrompt => ({
  agent,
  system_prompt: DEFAULT_PROMPTS[agent].system_prompt,
  analysis_context: DEFAULT_PROMPTS[agent].analysis_context,
  output_format: DEFAULT_PROMPTS[agent].output_format,
  provider: DEFAULT_PROMPTS[agent].provider,
  last_updated: DEFAULT_PROMPTS[agent].last_updated,
  llm_config_id: null,
});

const agentById = (agent: AgentId) => AGENTS.find((item) => item.id === agent) ?? AGENTS[0];

function metricPair(agent: AgentId, stats?: AgentStats) {
  if (agent === 'inspector') {
    return [stats?.analyses_count ?? 0, stats?.findings_detected ?? 0];
  }
  if (agent === 'detective') {
    return [stats?.analyses_count ?? 0, stats?.forensic_events_detected ?? 0];
  }
  return [stats?.analyses_count ?? 0, stats?.reports_generated ?? 0];
}

function accentClasses(accent: string, selected: boolean) {
  const map: Record<string, { icon: string; metric: string; selected: string }> = {
    blue: {
      icon: 'border-blue-500 bg-blue-950/60 text-blue-300',
      metric: 'text-blue-300',
      selected: 'border-blue-500 bg-blue-950/30',
    },
    amber: {
      icon: 'border-amber-500 bg-amber-950/60 text-amber-300',
      metric: 'text-amber-300',
      selected: 'border-amber-500 bg-amber-950/30',
    },
    emerald: {
      icon: 'border-emerald-500 bg-emerald-950/60 text-emerald-300',
      metric: 'text-emerald-300',
      selected: 'border-emerald-500 bg-emerald-950/30',
    },
  };
  return {
    icon: map[accent]?.icon ?? map.blue.icon,
    metric: map[accent]?.metric ?? map.blue.metric,
    card: selected ? map[accent]?.selected ?? map.blue.selected : 'border-border bg-card hover:bg-muted/40',
  };
}

export function SCRAgentPromptConfig() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('inspector');
  const [activeTab, setActiveTab] = useState<AgentTab>('prompt');
  const [prompt, setPrompt] = useState<AgentPrompt>(emptyPrompt('inspector'));
  const [sampleCode, setSampleCode] = useState('function example(input) { return input; }');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [llmConfigs, setLlmConfigs] = useState<LlmConfig[]>([]);
  const [stats, setStats] = useState<Partial<Record<AgentId, AgentStats>>>({});
  const [patterns, setPatterns] = useState<DetectionPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isPatternLoading, setIsPatternLoading] = useState(false);

  const selectedMeta = useMemo(() => agentById(selectedAgent), [selectedAgent]);
  const selectedStats = stats[selectedAgent];
  const lastUpdated = prompt.last_updated ? new Date(prompt.last_updated).toLocaleString() : 'Sin cambios guardados';

  useEffect(() => {
    async function fetchGlobalData() {
      const [llmResult, ...statsResults] = await Promise.allSettled([
        api.get('/admin/scr/llm-config'),
        ...AGENTS.map((agent) => api.get(`/admin/scr/agents/${agent.id}/stats`, { params: { days: 30 } })),
      ]);

      if (llmResult.status === 'fulfilled') {
        const llmEnvelope = llmResult.value.data as { status?: string; data?: { providers?: LlmConfig[] } };
        setLlmConfigs(llmEnvelope.data?.providers ?? []);
      } else {
        logger.error('scr_agents.llm_fetch_failed', { error: String(llmResult.reason) });
        toast.error('No se pudieron cargar las configuraciones LLM');
      }

      const nextStats = AGENTS.reduce<Partial<Record<AgentId, AgentStats>>>((acc, agent, index) => {
        const result = statsResults[index];
        if (result?.status === 'fulfilled') {
          const envelope = result.value.data as { status?: string; data?: AgentStats };
          if (envelope.status === 'success' && envelope.data) {
            acc[agent.id] = envelope.data;
          }
        }
        return acc;
      }, {});
      setStats(nextStats);
    }

    void fetchGlobalData();
  }, []);

  useEffect(() => {
    setPrompt(emptyPrompt(selectedAgent));
    setTestOutput(null);
    setActiveTab('prompt');

    async function fetchPrompt() {
      try {
        setIsLoading(true);
        const response = await api.get(`/admin/scr/agents/${selectedAgent}/prompts`);
        const envelope = response.data as { status?: string; data?: AgentPrompt };
        if (envelope.status === 'success' && envelope.data) {
          setPrompt({
            ...emptyPrompt(selectedAgent),
            ...envelope.data,
            system_prompt: envelope.data.system_prompt || DEFAULT_PROMPTS[selectedAgent].system_prompt,
            analysis_context: envelope.data.analysis_context || DEFAULT_PROMPTS[selectedAgent].analysis_context,
            output_format: envelope.data.output_format || DEFAULT_PROMPTS[selectedAgent].output_format,
          });
        }
      } catch (error) {
        logger.error('scr_agents.prompt_fetch_failed', { error: String(error), agent: selectedAgent });
        toast.error(getApiErrorMessage(error, 'No se pudo cargar el prompt del agente'));
      } finally {
        setIsLoading(false);
      }
    }

    void fetchPrompt();
  }, [selectedAgent]);

  useEffect(() => {
    async function fetchPatterns() {
      if (activeTab !== 'patterns') {
        return;
      }
      try {
        setIsPatternLoading(true);
        const response = await api.get('/admin/scr/patterns', { params: { agent: selectedAgent } });
        const envelope = response.data as { status?: string; data?: { patterns?: DetectionPattern[] } };
        setPatterns(envelope.data?.patterns ?? []);
      } catch (error) {
        logger.error('scr_agents.patterns_fetch_failed', { error: String(error), agent: selectedAgent });
        toast.error('No se pudieron cargar los patrones');
      } finally {
        setIsPatternLoading(false);
      }
    }

    void fetchPatterns();
  }, [activeTab, selectedAgent]);

  function restoreDefaults() {
    setPrompt((current) => ({
      ...current,
      system_prompt: DEFAULT_PROMPTS[selectedAgent].system_prompt,
      analysis_context: DEFAULT_PROMPTS[selectedAgent].analysis_context,
      output_format: DEFAULT_PROMPTS[selectedAgent].output_format,
    }));
    toast.success('Prompt restaurado al valor por defecto');
  }

  async function handleSave() {
    if (!prompt.system_prompt.trim()) {
      toast.error('El prompt de sistema es requerido');
      return;
    }

    try {
      setIsLoading(true);
      await api.patch(`/admin/scr/agents/${selectedAgent}/prompts`, {
        agent: selectedAgent,
        system_prompt: prompt.system_prompt,
        analysis_context: prompt.analysis_context,
        output_format: prompt.output_format,
        llm_config_id: prompt.llm_config_id,
      });
      toast.success('Configuración del agente guardada');
    } catch (error) {
      logger.error('scr_agents.save_failed', { error: String(error), agent: selectedAgent });
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el agente'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTest() {
    if (!sampleCode.trim()) {
      toast.error('Ingresa código de prueba');
      return;
    }

    try {
      setIsTesting(true);
      const response = await api.post(`/admin/scr/agents/${selectedAgent}/test-prompt`, {
        agent: selectedAgent,
        code_snippet: sampleCode,
      });
      const envelope = response.data as { status?: string; data?: { output_sample?: string; message?: string } };
      if (envelope.status === 'success') {
        setTestOutput(envelope.data?.output_sample ?? envelope.data?.message ?? 'Prueba ejecutada sin salida.');
        toast.success('Prueba completada');
      }
    } catch (error) {
      logger.error('scr_agents.test_failed', { error: String(error), agent: selectedAgent });
      toast.error('No se pudo probar el prompt. Revisa que exista un LLM configurado.');
    } finally {
      setIsTesting(false);
    }
  }

  async function togglePattern(pattern: DetectionPattern) {
    try {
      await api.patch(`/admin/scr/patterns/${encodeURIComponent(pattern.id)}`, { enabled: !pattern.enabled });
      setPatterns((current) =>
        current.map((item) => (item.id === pattern.id ? { ...item, enabled: !item.enabled } : item)),
      );
      toast.success('Patrón actualizado');
    } catch (error) {
      logger.error('scr_agents.pattern_update_failed', { error: String(error), patternId: pattern.id });
      toast.error('No se pudo actualizar el patrón');
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {AGENTS.map((agent) => {
          const agentStats = stats[agent.id];
          const [primaryMetric, secondaryMetric] = metricPair(agent.id, agentStats);
          const Icon = agent.icon;
          const classes = accentClasses(agent.accent, selectedAgent === agent.id);

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgent(agent.id)}
              className={cn('rounded-xl border p-4 text-left transition', classes.card)}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-full border-2', classes.icon)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">{agent.title}</div>
                  <div className="text-xs text-emerald-400">Activo</div>
                  <p className="mt-1 text-xs text-muted-foreground">{agent.subtitle}</p>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-background/70 p-2 text-center">
                  <div className={cn('text-lg font-bold', classes.metric)}>{primaryMetric}</div>
                  <div className="text-xs text-muted-foreground">{agent.primaryMetricLabel}</div>
                </div>
                <div className="rounded-lg bg-background/70 p-2 text-center">
                  <div className={cn('text-lg font-bold', classes.metric)}>{secondaryMetric}</div>
                  <div className="text-xs text-muted-foreground">{agent.secondaryMetricLabel}</div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{agent.description}</p>
                <p>
                  Tokens consumidos: <span className="text-foreground">{agentStats?.tokens_consumed ?? 0}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <selectedMeta.icon className="h-4 w-4 text-primary" />
                {selectedMeta.title} - Configuración
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{selectedMeta.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={restoreDefaults} disabled={isLoading}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar por defecto
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1.5fr]">
            <div className="space-y-2">
              <Label>Modelo LLM asignado</Label>
              <Select
                value={prompt.llm_config_id ?? ''}
                onChange={(event) => setPrompt({ ...prompt, llm_config_id: event.target.value || null })}
                placeholder={
                  llmConfigs.length > 0
                    ? 'Selecciona una configuración LLM'
                    : 'No hay configuraciones LLM disponibles'
                }
                options={llmConfigs.map((config) => ({
                  value: config.id,
                  label: `${config.provider} / ${config.model}${config.is_default ? ' (default)' : ''}`,
                }))}
              />
              {llmConfigs.length === 0 && (
                <p className="text-xs text-amber-400">
                  Guarda primero un proveedor LLM válido en Configuración SCR y vuelve a esta pantalla.
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
              El pipeline usará este modelo para ejecutar el agente seleccionado. Las API keys y endpoints se mantienen en
              Integraciones SCR; aquí solo se asigna el modelo al agente.
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'prompt' as const, label: 'Prompt del Sistema', icon: FileText },
              { id: 'patterns' as const, label: 'Patrones de Detección', icon: SlidersHorizontal },
              { id: 'stats' as const, label: 'Estadísticas', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Define el comportamiento base del agente, el contexto organizacional y el contrato JSON que debe
                devolver al pipeline.
              </p>
              <div className="space-y-2">
                <Label>Prompt de sistema</Label>
                <Textarea
                  rows={12}
                  value={prompt.system_prompt}
                  onChange={(event) => setPrompt({ ...prompt, system_prompt: event.target.value })}
                  disabled={isLoading}
                  className="font-mono text-xs"
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contexto de análisis</Label>
                  <Textarea
                    rows={7}
                    value={prompt.analysis_context}
                    onChange={(event) => setPrompt({ ...prompt, analysis_context: event.target.value })}
                    disabled={isLoading}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Formato de salida esperado</Label>
                  <Textarea
                    rows={7}
                    value={prompt.output_format}
                    onChange={(event) => setPrompt({ ...prompt, output_format: event.target.value })}
                    disabled={isLoading}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>{prompt.system_prompt.length.toLocaleString()} caracteres en prompt de sistema</span>
                <span>Última modificación: {lastUpdated}</span>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <div className="mb-3 flex flex-col gap-1">
                  <div className="text-sm font-semibold">Probar prompt</div>
                  <p className="text-xs text-muted-foreground">
                    Ejecuta el agente contra un fragmento de código usando el LLM configurado.
                  </p>
                </div>
                <Textarea rows={5} value={sampleCode} onChange={(event) => setSampleCode(event.target.value)} />
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                    {isTesting ? 'Probando...' : 'Probar agente'}
                  </Button>
                </div>
                {testOutput && (
                  <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">
                    {testOutput}
                  </pre>
                )}
              </div>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Patrones activos para {selectedMeta.title}. Puedes activar o desactivar patrones base; los cambios
                personalizados viven en el prompt del agente.
              </p>
              {selectedAgent === 'fiscal' ? (
                <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                  Fiscal no usa patrones directos; sintetiza hallazgos del Inspector y eventos del Detective.
                </div>
              ) : isPatternLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : patterns.length === 0 ? (
                <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                  No hay patrones configurados para este agente.
                </div>
              ) : (
                <div className="space-y-2">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{pattern.name}</Badge>
                          <span className="text-xs text-muted-foreground">{pattern.detections_count} detecciones</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{pattern.description}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => void togglePattern(pattern)}>
                        {pattern.enabled ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <div className="text-xs text-muted-foreground">Periodo</div>
                <div className="mt-1 text-2xl font-semibold">{selectedStats?.period_days ?? 30}d</div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <div className="text-xs text-muted-foreground">{selectedMeta.primaryMetricLabel}</div>
                <div className="mt-1 text-2xl font-semibold">{metricPair(selectedAgent, selectedStats)[0]}</div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <div className="text-xs text-muted-foreground">{selectedMeta.secondaryMetricLabel}</div>
                <div className="mt-1 text-2xl font-semibold">{metricPair(selectedAgent, selectedStats)[1]}</div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <div className="text-xs text-muted-foreground">Tiempo promedio</div>
                <div className="mt-1 text-2xl font-semibold">
                  {selectedStats?.avg_processing_time_seconds ?? 0}s
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4 md:col-span-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Tokens</div>
                    <div className="text-lg font-semibold">{selectedStats?.tokens_consumed ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Costo estimado</div>
                    <div className="text-lg font-semibold">${(selectedStats?.estimated_cost_usd ?? 0).toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Precisión validada</div>
                    <div className="text-lg font-semibold">
                      {typeof selectedStats?.precision_rate === 'number' ? `${selectedStats.precision_rate}%` : 'Sin muestra'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Confirmados / FP</div>
                    <div className="text-lg font-semibold">
                      {selectedStats?.confirmed_findings ?? 0} / {selectedStats?.false_positives ?? 0}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4 md:col-span-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Métricas calculadas desde datos reales del módulo SCR.
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  La precisión se calcula con hallazgos confirmados frente a falsos positivos marcados por analistas.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
