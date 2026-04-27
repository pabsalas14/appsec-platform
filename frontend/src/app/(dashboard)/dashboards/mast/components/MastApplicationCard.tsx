'use client';

import { AlertTriangle, Shield, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AplicacionMovil } from '@/lib/schemas/aplicacion_movil.schema';
import type { EjecucionMAST } from '@/lib/schemas/ejecucion_mast.schema';
import type { HallazgoMAST } from '@/lib/schemas/hallazgo_mast.schema';

interface MastApplicationCardProps {
  app: AplicacionMovil;
  executions: EjecucionMAST[];
  findings: HallazgoMAST[];
  selected?: boolean;
  onClick?: () => void;
}

export function MastApplicationCard({
  app,
  executions,
  findings,
  selected,
  onClick,
}: MastApplicationCardProps) {
  const metrics = useMemo(() => {
    const criticals = findings.filter((f) => f.severidad === 'Critica').length;
    const highs = findings.filter((f) => f.severidad === 'Alta').length;
    const mediums = findings.filter((f) => f.severidad === 'Media').length;
    const lows = findings.filter((f) => f.severidad === 'Baja').length;
    const total = findings.length;

    const lastExecution = executions[executions.length - 1];
    const executionDate = lastExecution ? new Date(lastExecution.fecha_fin).toLocaleDateString() : 'N/A';

    // Simple score: 100 - (critica*40 + alta*20 + media*10 + baja*5) / total if total > 0
    const securityScore = total === 0 ? 100 : Math.max(0, 100 - (criticals * 40 + highs * 20 + mediums * 10 + lows * 5) / total);

    return {
      total,
      criticals,
      highs,
      mediums,
      lows,
      securityScore: Math.round(securityScore),
      lastExecution: executionDate,
      executionCount: executions.length,
    };
  }, [findings, executions]);

  const scoreColor = metrics.securityScore >= 80 ? 'text-emerald-500' : metrics.securityScore >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card
      onClick={onClick}
      className={cn('cursor-pointer transition-all hover:shadow-md', selected && 'ring-2 ring-primary border-primary')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{app.nombre}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {app.plataforma} · {app.bundle_id}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {metrics.executionCount} scans
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Score</span>
          </div>
          <div className={cn('text-2xl font-bold', scoreColor)}>
            {metrics.securityScore}
          </div>
        </div>

        {/* Total Vulnerabilities */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Vulnerabilidades</span>
          </div>
          <span className="text-lg font-semibold">{metrics.total}</span>
        </div>

        {/* Severity Distribution */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Distribución</p>
          <div className="space-y-1.5">
            {metrics.criticals > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-500 font-medium">Críticas</span>
                <span className="font-semibold text-red-500">{metrics.criticals}</span>
              </div>
            )}
            {metrics.highs > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-500 font-medium">Altas</span>
                <span className="font-semibold text-orange-500">{metrics.highs}</span>
              </div>
            )}
            {metrics.mediums > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-500 font-medium">Medias</span>
                <span className="font-semibold text-yellow-500">{metrics.mediums}</span>
              </div>
            )}
            {metrics.lows > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-500 font-medium">Bajas</span>
                <span className="font-semibold text-blue-500">{metrics.lows}</span>
              </div>
            )}
            {metrics.total === 0 && (
              <p className="text-xs text-emerald-500 font-medium">Sin hallazgos</p>
            )}
          </div>
        </div>

        {/* Last Execution */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Último escaneo</span>
          </div>
          <span className="font-mono">{metrics.lastExecution}</span>
        </div>
      </CardContent>
    </Card>
  );
}
