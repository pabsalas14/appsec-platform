'use client';

import { ChevronLeft, Loader2, Scale } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
  Select,
  Separator,
  Switch,
  Textarea,
} from '@/components/ui';
import { useVulnerabilidadFlujoConfig } from '@/hooks/useOperacionConfig';
import { VulnerabilidadHistorialTimeline } from '@/components/modules/VulnerabilidadHistorialTimeline';
import {
  useTriageVulnerabilidadIa,
  useUpdateVulnerabilidad,
  useVulnerabilidad,
  useVulnerabilidadHistorial,
} from '@/hooks/useVulnerabilidads';
import { logger } from '@/lib/logger';
import { labelForEstatusId, optionsForEstadoTransiciones, resolveEstatusIdFromRaw } from '@/lib/vulnerabilidadFlujo';
import type { VulnerabilidadIATriageResponse } from '@/lib/schemas/vulnerabilidad_ia_triage_response.schema';
import { EntityCustomFieldsCard } from '@/components/modules/EntityCustomFieldsCard';
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
  const { data: historialRaw, isLoading: histLoading } = useVulnerabilidadHistorial(id);
  const { data: flujoCfg } = useVulnerabilidadFlujoConfig();
  const estatus = flujoCfg?.estatus;
  const updateVuln = useUpdateVulnerabilidad();
  const triage = useTriageVulnerabilidadIa();

  const [contextoAdicional, setContextoAdicional] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [ultima, setUltima] = useState<VulnerabilidadIATriageResponse | null>(null);
  const [estadoEdit, setEstadoEdit] = useState('');

  const currentResuelto = useMemo(
    () => (vuln ? resolveEstatusIdFromRaw(vuln.estado, estatus) : ''),
    [vuln, estatus],
  );
  const estadoOptions = useMemo(
    () => (vuln ? optionsForEstadoTransiciones(estatus, vuln.estado) : []),
    [vuln, estatus],
  );
  const estadoLabel = useMemo(
    () => (vuln ? labelForEstatusId(estatus, vuln.estado) : ''),
    [vuln, estatus],
  );

  useEffect(() => {
    if (vuln) setEstadoEdit(resolveEstatusIdFromRaw(vuln.estado, estatus));
  }, [vuln, estatus]);

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
          onClick={() => router.push('/vulnerabilidads/registros')}
        >
          Volver al listado
        </Button>
      </PageWrapper>
    );
  }

  const onGuardarEstado = () => {
    if (!id || !vuln) return;
    if (!estadoEdit || estadoEdit === currentResuelto) {
      toast.info('No hay cambio de estado');
      return;
    }
    updateVuln.mutate(
      { id, estado: estadoEdit },
      {
        onSuccess: () => {
          toast.success('Estado actualizado (validado con catálogo D1 y transiciones).');
        },
        onError: (e) => {
          logger.error('vulnerabilidad.update_estado.failed', { id, error: e });
          toast.error(extractErrorMessage(e, 'Transición no permitida o estado inválido.'));
        },
      },
    );
  };

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
        description={`Motor: ${vuln.fuente} · ${vuln.severidad} · ${estadoLabel} (${vuln.estado})`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
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

        <EntityCustomFieldsCard entityType="vulnerabilidad" entityId={vuln.id} />

        <Card>
          <CardHeader>
            <CardTitle>Flujo de estatus (D1)</CardTitle>
            <CardDescription>
              Valores y transiciones según ajuste admin (`catalogo.estatus_vulnerabilidad`); el backend valida cada
              cambio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!estatus?.length && (
              <p className="text-muted-foreground">Catálogo no disponible. Mostrando valor almacenado: {vuln.estado}</p>
            )}
            {estatus && estatus.length > 0 && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Actual (resuelto a id)</p>
                  <p className="font-medium">
                    {estadoLabel} <span className="text-muted-foreground font-mono text-xs">· {currentResuelto}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="estado_d1">
                    Nuevo estatus
                  </label>
                  <Select
                    id="estado_d1"
                    className="mt-1"
                    value={estadoEdit}
                    onChange={(e) => setEstadoEdit(e.target.value)}
                    options={estadoOptions.length ? estadoOptions : [{ value: currentResuelto, label: estadoLabel }]}
                    disabled={updateVuln.isPending}
                  />
                </div>
                <Button
                  type="button"
                  onClick={onGuardarEstado}
                  disabled={
                    updateVuln.isPending || !estadoEdit || estadoEdit === currentResuelto
                  }
                >
                  {updateVuln.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Aplicar cambio de estatus
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        </div>

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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Bitácora de actividad</CardTitle>
          <CardDescription>
            Línea de tiempo de cambios de estado y responsable persistidos para este hallazgo (spec 30).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VulnerabilidadHistorialTimeline raw={historialRaw} isLoading={histLoading} />
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
