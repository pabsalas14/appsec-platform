'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCodeSecurityReview, useReviewProgress, useReviewFindings, useReviewEvents, useReviewReport } from '@/hooks/useCodeSecurityReviews';
import { CodeSecurityFindingsTable } from '@/components/code-security/CodeSecurityFindingsTable';
import { ForensicTimeline } from '@/components/code-security/ForensicTimeline';
import { ExecutiveReportViewer } from '@/components/code-security/ExecutiveReportViewer';
import { RiskScoreGauge } from '@/components/code-security/RiskScoreGauge';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { formatDuration, formatUsd } from '@/lib/scr-format';
import { cn } from '@/lib/utils';

type TabType = 'findings' | 'timeline' | 'report' | 'summary';

type LiveProgress = {
  progress: number;
  agent?: string | null;
  activity?: string | null;
  estado?: string;
};

export default function CodeSecurityReviewDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reviewId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [findingSearch, setFindingSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [riskTypeFilter, setRiskTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [liveProgress, setLiveProgress] = useState<LiveProgress | null>(null);

  // Fetch data
  const { data: review, isLoading: reviewLoading } = useCodeSecurityReview(reviewId);
  const { data: progress } = useReviewProgress(reviewId);
  const { data: findings } = useReviewFindings(reviewId);
  const { data: events } = useReviewEvents(reviewId);
  const { data: report } = useReviewReport(reviewId);

  const isAnalyzing = review?.estado === 'ANALYZING';
  const isComplete = review?.estado === 'COMPLETED';

  async function cancelScan() {
    try {
      await api.post(`/code_security_reviews/${reviewId}/cancel`);
      toast.success('Escaneo cancelado');
      window.location.reload();
    } catch (error) {
      logger.error('scr.review.cancel_failed', { error: String(error), reviewId });
      toast.error('No se pudo cancelar el escaneo');
    }
  }

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'summary' || tab === 'findings' || tab === 'timeline' || tab === 'report') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!reviewId || !isAnalyzing) {
      return;
    }

    const source = new EventSource(`/api/v1/code_security_reviews/${reviewId}/stream`, { withCredentials: true });
    source.onmessage = (event) => {
      try {
        setLiveProgress(JSON.parse(event.data) as LiveProgress);
      } catch {
        setLiveProgress(null);
      }
    };
    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [isAnalyzing, reviewId]);

  // Filter findings
  const filteredFindings = findings?.filter((f) => {
    if (findingSearch.trim()) {
      const query = findingSearch.toLowerCase();
      const searchable = [f.tipo_malicia, f.archivo, f.descripcion].join(' ').toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    if (severityFilter && f.severidad !== severityFilter) return false;
    if (riskTypeFilter && f.tipo_malicia !== riskTypeFilter) return false;
    if (statusFilter && f.estado !== statusFilter) return false;
    return true;
  }) || [];

  const stats = {
    total: findings?.length || 0,
    critical: findings?.filter(f => f.severidad === 'CRITICO').length || 0,
    high: findings?.filter(f => f.severidad === 'ALTO').length || 0,
    medium: findings?.filter(f => f.severidad === 'MEDIO').length || 0,
    low: findings?.filter(f => f.severidad === 'BAJO').length || 0,
  };

  const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
    { id: 'summary', label: 'Resumen', icon: '📊' },
    { id: 'findings', label: 'Hallazgos', icon: '🔍', count: stats.total },
    { id: 'timeline', label: 'Timeline', icon: '⏱️', count: events?.length },
    { id: 'report', label: 'Reporte', icon: '📄' },
  ];

  if (reviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading review...</p>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Review not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{review.titulo}</h1>
              <p className="text-muted-foreground">{review.descripcion}</p>
              {isComplete && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => window.location.href = `/api/v1/code_security_reviews/${reviewId}/export?format=json`}>
                    Exportar JSON
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = `/api/v1/code_security_reviews/${reviewId}/export?format=pdf`}>
                    Reporte PDF
                  </Button>
                </div>
              )}
              {isAnalyzing && (
                <div className="mt-4">
                  <Button variant="outline" onClick={() => void cancelScan()}>
                    Cancelar escaneo
                  </Button>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={cn(
                'inline-block px-4 py-2 rounded-full text-sm font-medium',
                review.estado === 'ANALYZING' ? 'bg-blue-500/20 text-blue-400' :
                review.estado === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                'bg-gray-500/20 text-gray-400'
              )}>
                {review.estado}
              </div>
            </div>
          </div>

          {/* Repository Info */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>📦 {review.url_repositorio}</div>
            <div>🌿 {review.rama_analizar}</div>
            <div>📅 {new Date(review.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <Card className="mb-8 border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Analysis in Progress</p>
                  <p className="text-sm text-muted-foreground">{liveProgress?.progress ?? progress?.progreso ?? review.progreso}%</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${liveProgress?.progress ?? progress?.progreso ?? review.progreso}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {liveProgress?.activity || progress?.actividad || progress?.agente_actual || 'Analizando…'}
                </p>
                {(liveProgress?.agent || progress?.agente_actual) && (
                  <p className="text-xs text-muted-foreground/80">Agente: {liveProgress?.agent || progress?.agente_actual}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="mb-8 border-b border-white/[0.1]">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-4 px-2 border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 text-xs bg-white/10 px-2 py-1 rounded">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Risk Gauge */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-white/[0.1] bg-white/[0.02]">
                  <CardHeader>
                    <CardTitle>Evaluación de Riesgo</CardTitle>
                    <CardDescription>Puntuación global del escaneo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report ? (
                      <RiskScoreGauge score={report.puntuacion_riesgo_global || 0} />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Análisis no completado - reporte pendiente
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Statistics */}
                <div className="space-y-3">
                  <Card className="border-white/[0.1] bg-white/[0.02]">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Hallazgos totales</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-white/[0.1] bg-white/[0.02]">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{formatDuration(review.duration_ms)}</p>
                          <p className="text-xs text-muted-foreground">Duración</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{review.total_tokens_used ?? 0}</p>
                          <p className="text-xs text-muted-foreground">Tokens</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{formatUsd(review.estimated_cost_usd)}</p>
                          <p className="text-xs text-muted-foreground">Costo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-2">
                    <Card className="border-red-500/20 bg-red-500/5">
                      <CardContent className="pt-4 pb-4 px-4">
                        <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
                        <p className="text-xs text-muted-foreground">Critical</p>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-500/20 bg-orange-500/5">
                      <CardContent className="pt-4 pb-4 px-4">
                        <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
                        <p className="text-xs text-muted-foreground">High</p>
                      </CardContent>
                    </Card>
                    <Card className="border-yellow-500/20 bg-yellow-500/5">
                      <CardContent className="pt-4 pb-4 px-4">
                        <p className="text-2xl font-bold text-yellow-400">{stats.medium}</p>
                        <p className="text-xs text-muted-foreground">Medium</p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-500/20 bg-blue-500/5">
                      <CardContent className="pt-4 pb-4 px-4">
                        <p className="text-2xl font-bold text-blue-400">{stats.low}</p>
                        <p className="text-xs text-muted-foreground">Low</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Repository & Analysis Info */}
              {report && (
                <Card className="border-white/[0.1] bg-white/[0.02]">
                  <CardHeader>
                    <CardTitle>Información Clave</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Resumen Ejecutivo</p>
                      <p className="text-foreground">{report.resumen_ejecutivo}</p>
                    </div>
                    {report.pasos_remediacion && report.pasos_remediacion.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Pasos de Remediación</p>
                        <ol className="list-decimal list-inside space-y-1">
                          {report.pasos_remediacion.map((step, idx) => (
                            <li key={idx} className="text-sm text-foreground">
                              {typeof step === 'string' ? step : JSON.stringify(step)}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Findings Tab */}
          {activeTab === 'findings' && (
            <div className="space-y-6">
              {/* Filters */}
              <Card className="border-white/[0.1] bg-white/[0.02]">
                <CardHeader>
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Búsqueda</label>
                      <input
                        value={findingSearch}
                        onChange={(e) => setFindingSearch(e.target.value)}
                        placeholder="Archivo, patrón, descripción..."
                        className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Severidad</label>
                      <select
                        value={severityFilter || ''}
                        onChange={(e) => setSeverityFilter(e.target.value || null)}
                        className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      >
                        <option value="">Todas</option>
                        <option value="CRITICO">Critical</option>
                        <option value="ALTO">High</option>
                        <option value="MEDIO">Medium</option>
                        <option value="BAJO">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">Tipo</label>
                      <select
                        value={riskTypeFilter || ''}
                        onChange={(e) => setRiskTypeFilter(e.target.value || null)}
                        className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      >
                        <option value="">Todos</option>
                        <option value="BACKDOOR">Backdoor</option>
                        <option value="INJECTION">Injection</option>
                        <option value="LOGIC_BOMB">Logic Bomb</option>
                        <option value="PRIVILEGE_ESCALATION">Privilege Escalation</option>
                        <option value="DATA_EXFILTRATION">Data Exfiltration</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">Estatus</label>
                      <select
                        value={statusFilter || ''}
                        onChange={(e) => setStatusFilter(e.target.value || null)}
                        className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      >
                        <option value="">Todos</option>
                        <option value="DETECTED">Detected</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="IN_CORRECTION">In Correction</option>
                        <option value="CORRECTED">Corrected</option>
                        <option value="VERIFIED">Verified</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Findings Table */}
              <CodeSecurityFindingsTable findings={filteredFindings} reviewId={reviewId} />
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              {events && events.length > 0 ? (
                <ForensicTimeline events={events} />
              ) : (
                <Card className="border-white/[0.1] bg-white/[0.02]">
                  <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                    <p>No forensic events available yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && (
            <div>
              {report ? (
                <ExecutiveReportViewer report={report} />
              ) : (
                <Card className="border-white/[0.1] bg-white/[0.02]">
                  <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                    <p>Report not available yet. Analysis may still be in progress.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Export Button */}
        {isComplete && (
          <div className="mt-8 flex gap-4">
            <Button onClick={() => window.location.href = `/api/v1/code_security_reviews/${reviewId}/export?format=json`}>
              📥 Export JSON
            </Button>
            <Button onClick={() => window.location.href = `/api/v1/code_security_reviews/${reviewId}/export?format=pdf`}>
              📄 Export PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
