'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Clock, AlertTriangle, FileJson, FileType } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  useCodeSecurityReview,
  useReviewFindings,
  useReviewEvents,
  useReviewProgress,
  useReviewReport,
} from '@/hooks/useCodeSecurityReviews';
import { CodeSecurityFindingsTable } from './CodeSecurityFindingsTable';
import { ForensicTimeline } from './ForensicTimeline';
import { ExecutiveReportViewer } from './ExecutiveReportViewer';
import { RiskScoreGauge } from './RiskScoreGauge';
import { logger } from '@/lib/logger';

interface CodeSecurityReviewDetailProps {
  reviewId: string;
}

export function CodeSecurityReviewDetail({ reviewId }: CodeSecurityReviewDetailProps) {
  const [activeTab, setActiveTab] = useState('findings');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'pdf') => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/code_security_reviews/${reviewId}/export?format=${format}`,
        {
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'pdf' ? 'pdf' : 'json';
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `csr-${reviewId.slice(0, 8)}-${timestamp}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      logger.error('Export error', { error });
    } finally {
      setIsExporting(false);
    }
  };

  const { data: review, isLoading: reviewLoading } = useCodeSecurityReview(reviewId);
  const { data: progress } = useReviewProgress(reviewId);
  const { data: findings } = useReviewFindings(reviewId);
  const { data: events } = useReviewEvents(reviewId);
  const { data: report } = useReviewReport(reviewId);

  if (reviewLoading || !review) {
    return <div className="p-6">Loading review...</div>;
  }

  const isAnalyzing = progress?.status === 'ANALYZING';
  const currentProgress = progress?.progress ?? review.progreso;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ANALYZING': return 'bg-blue-100 text-blue-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityCounts = () => {
    if (!findings) return { critico: 0, alto: 0, medio: 0, bajo: 0 };
    return findings.reduce(
      (acc, finding) => {
        acc[finding.severidad.toLowerCase() as keyof typeof acc]++;
        return acc;
      },
      { critico: 0, alto: 0, medio: 0, bajo: 0 }
    );
  };

  const severityCounts = getSeverityCounts();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{review.titulo}</h1>
          <p className="text-sm text-muted-foreground">
            Code Security Review • {review.url_repositorio}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(review.estado)}>
            {review.estado}
          </Badge>
          {report?.puntuacion_riesgo_global && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Risk: {report.puntuacion_riesgo_global}/100</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={!report}>
                <FileType className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Bar */}
      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Analysis Progress</span>
                  <span className="text-sm text-muted-foreground">{currentProgress}%</span>
                </div>
                <Progress value={currentProgress} className="h-2" />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {progress?.current_phase || 'Processing...'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{findings?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{severityCounts.critico}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{severityCounts.alto}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Forensic Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Score */}
      {report?.puntuacion_riesgo_global && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskScoreGauge score={report.puntuacion_riesgo_global} />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="findings" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Findings ({findings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline ({events?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="report" disabled={!report}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Executive Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="mt-6">
          <CodeSecurityFindingsTable findings={findings || []} reviewId={reviewId} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <ForensicTimeline events={events || []} />
        </TabsContent>

        <TabsContent value="report" className="mt-6">
          {report ? (
            <ExecutiveReportViewer report={report} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Report not available yet. Analysis must be completed first.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}