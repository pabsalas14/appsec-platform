'use client';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, FileText, Shield, Target } from 'lucide-react';

import type { CodeSecurityReport } from '@/types';

interface ExecutiveReportViewerProps {
  report: CodeSecurityReport;
}

const RISK_LEVELS = {
  CRITICO: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ALTO: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  MEDIO: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  BAJO: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
};

export function ExecutiveReportViewer({ report }: ExecutiveReportViewerProps) {
  // Determinar nivel de riesgo basado en la puntuación
  const getRiskLevel = (score: number) => {
    if (score >= 90) return 'CRITICO';
    if (score >= 75) return 'ALTO';
    if (score >= 50) return 'MEDIO';
    return 'BAJO';
  };

  const riskLevel = getRiskLevel(report.puntuacion_riesgo_global);
  const riskStyle = RISK_LEVELS[riskLevel as keyof typeof RISK_LEVELS] || RISK_LEVELS.BAJO;

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critico':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'alto':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medio':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'bajo':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  // Extraer conteos de severidad del desglose
  const severityCounts = report.desglose_severidad || {};
  const critico = severityCounts.critico || severityCounts.CRITICO || 0;
  const alto = severityCounts.alto || severityCounts.ALTO || 0;
  const medio = severityCounts.medio || severityCounts.MEDIO || 0;
  const bajo = severityCounts.bajo || severityCounts.BAJO || 0;

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Resumen Ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getRiskIcon(riskLevel)}
              <div>
                <h3 className="font-semibold">Nivel de Riesgo Global</h3>
                <Badge className={`${riskStyle.bg} ${riskStyle.color} border ${riskStyle.border}`}>
                  {riskLevel}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{report.puntuacion_riesgo_global}/100</div>
              <div className="text-sm text-muted-foreground">Puntuación de Riesgo</div>
            </div>
          </div>

          <Progress value={report.puntuacion_riesgo_global} className="h-3" />

          {report.resumen_ejecutivo && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {report.resumen_ejecutivo}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Risk Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Desglose de Riesgos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{critico}</div>
              <div className="text-sm text-muted-foreground">Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{alto}</div>
              <div className="text-sm text-muted-foreground">Altos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{medio}</div>
              <div className="text-sm text-muted-foreground">Medios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{bajo}</div>
              <div className="text-sm text-muted-foreground">Bajos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remediation Steps */}
      {report.pasos_remediacion && report.pasos_remediacion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Pasos de Remediación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.pasos_remediacion.map((step) => (
                <div key={step.orden} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                    {step.orden}
                  </div>
                  <p className="text-sm leading-relaxed">{step.paso}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolution Narrative */}
      {report.narrativa_evolucion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Narrativa de Evolución
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {report.narrativa_evolucion}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}