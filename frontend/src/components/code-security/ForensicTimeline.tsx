'use client';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/card';
import { GitCommit, User, FileText, AlertTriangle } from 'lucide-react';

import type { CodeSecurityEvent } from '@/types';

interface ForensicTimelineProps {
  events: CodeSecurityEvent[];
}

const RISK_COLORS = {
  CRITICO: 'bg-red-100 text-red-800 border-red-200',
  ALTO: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  BAJO: 'bg-green-100 text-green-800 border-green-200',
};

const INDICATOR_COLORS = {
  HIDDEN_COMMITS: 'bg-purple-100 text-purple-800',
  TIMING_ANOMALIES: 'bg-red-100 text-red-800',
  CRITICAL_FILES: 'bg-orange-100 text-orange-800',
  MASS_CHANGES: 'bg-yellow-100 text-yellow-800',
  AUTHOR_ANOMALIES: 'bg-blue-100 text-blue-800',
  RAPID_SUCCESSION: 'bg-indigo-100 text-indigo-800',
};

export function ForensicTimeline({ events }: ForensicTimelineProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No forensic events recorded for this analysis.
        </CardContent>
      </Card>
    );
  }

  // Sort events by timestamp (most recent first)
  const sortedEvents = [...events].sort((a, b) =>
    new Date(b.event_ts).getTime() - new Date(a.event_ts).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'modified':
        return <FileText className="h-4 w-4" />;
      case 'added':
        return <GitCommit className="h-4 w-4" />;
      default:
        return <GitCommit className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {sortedEvents.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Timeline line */}
          {index < sortedEvents.length - 1 && (
            <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
          )}

          <Card className="relative">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-primary mt-2" />

                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(event.accion)}
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {event.commit_hash.slice(0, 7)}
                      </code>
                      <Badge className={RISK_COLORS[event.nivel_riesgo as keyof typeof RISK_COLORS]}>
                        {event.nivel_riesgo}
                      </Badge>
                    </div>
                    <time className="text-sm text-muted-foreground">
                      {formatDate(event.event_ts)}
                    </time>
                  </div>

                  {/* Author and file */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{event.autor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <code className="text-muted-foreground">{event.archivo}</code>
                    </div>
                  </div>

                  {/* Commit message */}
                  {event.descripcion && (
                    <p className="text-sm text-muted-foreground italic">
                      &quot;{event.descripcion}&quot;
                    </p>
                  )}

                  {/* Suspicion indicators */}
                  {event.indicadores && event.indicadores.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {event.indicadores.map((indicator) => (
                          <Badge
                            key={indicator}
                            variant="outline"
                            className={INDICATOR_COLORS[indicator as keyof typeof INDICATOR_COLORS] || 'bg-gray-100 text-gray-800'}
                          >
                            {indicator.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {event.descripcion && (
                    <p className="text-sm text-muted-foreground">
                      {event.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}