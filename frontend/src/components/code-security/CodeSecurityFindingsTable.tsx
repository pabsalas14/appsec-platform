'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/radix-select';
import { ChevronDown, ChevronRight, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CodeSecurityFinding } from '@/types';
import api from '@/lib/api';

const SEVERITY_COLORS = {
  CRITICO: 'bg-red-100 text-red-800 border-red-200',
  ALTO: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  BAJO: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS = {
  DETECTED: 'bg-gray-100 text-gray-800',
  IN_REVIEW: 'bg-blue-100 text-blue-800',
  IN_CORRECTION: 'bg-yellow-100 text-yellow-800',
  CORRECTED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  FALSE_POSITIVE: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export function CodeSecurityFindingsTable({ findings, reviewId }: { findings: CodeSecurityFinding[]; reviewId?: string }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const markAsFPMutation = useMutation({
    mutationFn: async (findingId: string) => {
      await api.post(`/code_security_reviews/${reviewId}/findings/${findingId}/false-positive`, {
        reason: 'Marked by user',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code_security_reviews', reviewId, 'findings'] });
    },
  });

  const unmarkAsFPMutation = useMutation({
    mutationFn: async (findingId: string) => {
      await api.delete(`/code_security_reviews/${reviewId}/findings/${findingId}/false-positive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code_security_reviews', reviewId, 'findings'] });
    },
  });

  const isFP = (finding: CodeSecurityFinding) => finding.estado === 'FALSE_POSITIVE';

  const _toggleExpanded = (_findingId: string) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(_findingId)) {
        newExpanded.delete(_findingId);
      } else {
        newExpanded.add(_findingId);
      }
      return newExpanded;
    });
  };

  if (findings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No findings detected in this analysis.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {findings.map((finding) => (
        <Card key={finding.id} className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newExpanded = new Set(expandedRows);
                    if (newExpanded.has(finding.id)) {
                      newExpanded.delete(finding.id);
                    } else {
                      newExpanded.add(finding.id);
                    }
                    setExpandedRows(newExpanded);
                  }}
                  className="p-0 h-auto"
                >
                  {expandedRows.has(finding.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm font-mono">
                      {finding.archivo}:{finding.linea_inicio}-{finding.linea_fin}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={SEVERITY_COLORS[finding.severidad as keyof typeof SEVERITY_COLORS]}>
                      {finding.severidad}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {finding.tipo_malicia}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {(finding.confianza * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {reviewId && (
                  <>
                    {isFP(finding) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unmarkAsFPMutation.mutate(finding.id)}
                        disabled={unmarkAsFPMutation.isPending}
                        title="Unmark as False Positive"
                      >
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsFPMutation.mutate(finding.id)}
                        disabled={markAsFPMutation.isPending}
                        title="Mark as False Positive"
                      >
                        <XCircle className="h-4 w-4 text-gray-400 hover:text-purple-500" />
                      </Button>
                    )}
                  </>
                )}
                <Badge className={STATUS_COLORS[finding.estado as keyof typeof STATUS_COLORS]}>
                  {finding.estado}
                </Badge>
                <RadixSelect
                  value={finding.estado}
                  onValueChange={(_value: string) => {
                    // TODO: Update finding status through API
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DETECTED">Detected</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="IN_CORRECTION">In Correction</SelectItem>
                    <SelectItem value="CORRECTED">Corrected</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </RadixSelect>
              </div>
            </div>

            {expandedRows.has(finding.id) && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{finding.descripcion}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}