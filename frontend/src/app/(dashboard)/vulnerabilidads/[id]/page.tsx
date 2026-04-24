'use client';

import { ChevronLeft, Loader2, Scale } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  PageHeader,
  PageWrapper,
  Separator,
  Switch,
  Textarea,
} from '@/components/ui';
import { useTriageVulnerabilidadIa, useVulnerabilidad } from '@/hooks/useVulnerabilidads';
import { logger } from '@/lib/logger';
import type { VulnerabilidadIATriageResponse } from '@/lib/schemas/vulnerabilidad_ia_triage_response.schema';
import { cn, extractErrorMessage, formatDate } from '@/lib/utils';

function verdictBadge(verdict: VulnerabilidadIATriageResponse['verdict']) {
  const map: Record<
    VulnerabilidadIATriageResponse['verdict'],
    { label: string; variant: 'success' | 'primary' | 'default' }
  > = {
    false_positive: { label: 'Falso positivo (probable)', variant: 'success' },
    likely_real: { label: 'Hallazgo real (probable)', variant: 'primary' },
    needs_review: { label: 'Requiere revisión', variant: 'default' },
  };
  const m = map[verdict];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export default function VulnerabilidadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const { data: vuln, isLoading, error } = useVulnerabilidad(id);
  const triage = useTriageVulnerabilidadIa();

  const [contextoAdicional, setContextoAdicional] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [ultima, setUltima] = useState<VulnerabilidadIATriageResponse | null>(null);

  if (!id) {
    return (
      <PageWrapper>
        <p className="p-6 text-destructive">Identificador no válido.</p>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando hallazgo…
        </div>
      </PageWrapper>
    );
  }

  if (error || !vuln) {
    return (
      <PageWrapper>
        <p className="p-6 text-destructive">No se pudo cargar la vulnerabilidad.</p>
        <Button
          type="button"
          variant="outline"
          className="ml-6"
          onClick={() => router.push('/vulnerabilidads')}
        >
          Volver al listado
        </Button>
      </PageWrapper>
    );
  }

  const onTriage = () => {
    triage.mutate(
      {
        id,
        contexto_adicional: contextoAdicional.trim() || null,
        dry_run: dryRun,
      },
      {
        onSuccess: (data) => {
          if (data) {
            setUltima(data);
            logger.info('vulnerabilidad.ia_triage_fp.ui_success', {
              verdict: data.verdict,
              dry_run: data.dry_run,
            });
          } else {
            setUltima(null);
            logger.warn('vulnerabilidad.ia_triage_fp.unparsed');
          }
        },
      },
    );
  };

  return (
    <PageWrapper>
      <div className="mb-4">
        <Link
          href="/vulnerabilidads"
          className={cn(
            'inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors',
            'hover:text-foreground',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Vulnerabilidades
        </Link>
      </div>

      <PageHeader
        title={vuln.titulo}
        description={`Motor: ${vuln.fuente} · ${vuln.severidad} · ${vuln.estado}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalle del hallazgo</CardTitle>
            <CardDescription>
              Creado {formatDate(vuln.created_at)} · SLA límite{' '}
              {vuln.fecha_limite_sla ? formatDate(vuln.fecha_limite_sla) : '—'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{vuln.fuente}</Badge>
              <Badge variant="severity" severityName={vuln.severidad.toLowerCase()}>
                {vuln.severidad}
              </Badge>
            </div>
            {vuln.descripcion && (
              <p className="whitespace-pre-wrap text-muted-foreground">{vuln.descripcion}</p>
            )}
            <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="font-medium text-foreground">CVSS</dt>
                <dd>{vuln.cvss_score ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">CWE</dt>
                <dd>{vuln.cwe_id ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">OWASP</dt>
                <dd>{vuln.owasp_categoria ?? '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <CardTitle>Triaje IA (falsos positivos)</CardTitle>
            </div>
            <CardDescription>
              El modelo recibe pistas según el motor
              <Badge variant="default" className="mx-1 align-middle text-[10px]">
                {vuln.fuente}
              </Badge>
              . Requiere permiso
              <code className="mx-1 rounded bg-muted px-1 text-xs">ia.execute</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ctx_fp">Contexto adicional</Label>
              <Textarea
                id="ctx_fp"
                placeholder="Notas de reproducción, entorno, por qué sospechas FP…"
                value={contextoAdicional}
                onChange={(e) => setContextoAdicional(e.target.value)}
                rows={4}
                maxLength={4000}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="dry_fp" className="text-sm font-medium">
                  Simulación (dry run)
                </Label>
                <p className="text-xs text-muted-foreground">No persiste cambios de estado.</p>
              </div>
              <Switch id="dry_fp" checked={dryRun} onCheckedChange={setDryRun} />
            </div>

            {triage.isError && (
              <p className="text-sm text-destructive" role="alert">
                {extractErrorMessage(
                  triage.error,
                  'No se pudo ejecutar el triaje. Comprueba permisos y configuración de IA.',
                )}
              </p>
            )}

            <Button type="button" onClick={onTriage} disabled={triage.isPending} className="gap-2">
              {triage.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {dryRun ? 'Analizar (simulación)' : 'Ejecutar triaje'}
            </Button>

            {ultima && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {verdictBadge(ultima.verdict)}
                  <span className="text-xs text-muted-foreground">
                    Confianza {(ultima.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-muted-foreground">{ultima.rationale}</p>
                {ultima.suggested_state && (
                  <p className="text-xs">
                    <span className="font-medium">Estado sugerido:</span> {ultima.suggested_state}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {ultima.model} · {ultima.provider}
                </p>
                <Separator />
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Respuesta cruda</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                    {ultima.raw_content}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
