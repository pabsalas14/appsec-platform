'use client';

import { ChevronLeft, Loader2, Save, Sparkles } from 'lucide-react';
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
import { useActivoWebs } from '@/hooks/useActivoWebs';
import { useAmenazasBySesion } from '@/hooks/useAmenazas';
import {
  useSesionThreatModeling,
  useSuggestSesionThreatModelingIa,
  useUpdateSesionThreatModeling,
} from '@/hooks/useSesionThreatModelings';
import { logger } from '@/lib/logger';
import type { SesionThreatModelingIASuggestResponse } from '@/lib/schemas/sesion_threat_modeling_ia_suggest_response.schema';
import { cn, extractErrorMessage, formatDate } from '@/lib/utils';

export default function SesionThreatModelingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const { data: sesion, isLoading, error } = useSesionThreatModeling(id);
  const { data: amenazas, isLoading: loadingAmenazas } = useAmenazasBySesion(id);
  const suggest = useSuggestSesionThreatModelingIa();
  const { data: activoWebs } = useActivoWebs();
  const updateSesion = useUpdateSesionThreatModeling();
  const [backlog, setBacklog] = useState('');
  const [planTrabajo, setPlanTrabajo] = useState('');
  const [activoSecId, setActivoSecId] = useState('');

  const [contextoAdicional, setContextoAdicional] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [crearAmenazas, setCrearAmenazas] = useState(false);
  const [ultimaRespuesta, setUltimaRespuesta] = useState<SesionThreatModelingIASuggestResponse | null>(
    null,
  );

  useEffect(() => {
    if (!sesion) return;
    setBacklog(sesion.backlog_tareas ?? '');
    setPlanTrabajo(sesion.plan_trabajo ?? '');
    setActivoSecId(sesion.activo_web_secundario_id ?? '');
  }, [sesion]);

  const activoOptions = useMemo(
    () => [
      { value: '', label: '— Ninguno' },
      ...(activoWebs ?? []).map((a) => ({ value: a.id, label: a.nombre })),
    ],
    [activoWebs],
  );

  if (!id) {
    return (
      <PageWrapper>
        <p className="p-6 text-destructive">Identificador de sesión no válido.</p>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando sesión…
        </div>
      </PageWrapper>
    );
  }

  if (error || !sesion) {
    return (
      <PageWrapper>
        <p className="p-6 text-destructive">
          No se pudo cargar la sesión. Comprueba el enlace o vuelve al listado.
        </p>
        <Button
          type="button"
          variant="outline"
          className="ml-6"
          onClick={() => router.push('/sesion_threat_modelings')}
        >
          Volver a sesiones
        </Button>
      </PageWrapper>
    );
  }

  const onSubmit = () => {
    suggest.mutate(
      {
        id,
        contexto_adicional: contextoAdicional.trim() || null,
        dry_run: dryRun,
        crear_amenazas: dryRun ? false : crearAmenazas,
      },
      {
        onSuccess: (data) => {
          if (data) {
            setUltimaRespuesta(data);
            logger.info('sesion_threat_modeling.ia_suggest.ui_success', {
              dry_run: data.dry_run,
              suggested_count: data.suggested_threats.length,
              created_count: data.created_amenaza_ids.length,
            });
          } else {
            setUltimaRespuesta(null);
            logger.warn('sesion_threat_modeling.ia_suggest.unparsed');
          }
        },
      },
    );
  };

  return (
    <PageWrapper>
      <div className="mb-4">
        <Link
          href="/sesion_threat_modelings"
          className={cn(
            'inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors',
            'hover:text-foreground',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Sesiones de threat modeling
        </Link>
      </div>

      <PageHeader
        title="Sesión de threat modeling"
        description={`Fecha: ${formatDate(sesion.fecha)} · Estado: ${sesion.estado}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la sesión</CardTitle>
            <CardDescription>Contexto y participantes registrados en la sesión.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Programa (ID)</span>
              <p className="font-mono text-xs break-all">{sesion.programa_tm_id}</p>
            </div>
            {sesion.participantes ? (
              <div>
                <span className="text-muted-foreground">Participantes</span>
                <p className="whitespace-pre-wrap">{sesion.participantes}</p>
              </div>
            ) : null}
            {sesion.contexto ? (
              <div>
                <span className="text-muted-foreground">Contexto</span>
                <p className="whitespace-pre-wrap text-muted-foreground">{sesion.contexto}</p>
              </div>
            ) : null}
            {sesion.ia_utilizada != null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">IA usada en sesión</span>
                <Badge variant={sesion.ia_utilizada ? 'primary' : 'default'}>
                  {sesion.ia_utilizada ? 'Sí' : 'No'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backlog y plan (MDA)</CardTitle>
            <CardDescription>
              Tareas y plan de trabajo; activo web secundario de referencia (BRD 3.3).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="backlog_tareas">Backlog de tareas</Label>
              <Textarea
                id="backlog_tareas"
                rows={3}
                value={backlog}
                onChange={(e) => setBacklog(e.target.value)}
                className="resize-y"
                maxLength={8000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan_trabajo">Plan de trabajo</Label>
              <Textarea
                id="plan_trabajo"
                rows={3}
                value={planTrabajo}
                onChange={(e) => setPlanTrabajo(e.target.value)}
                className="resize-y"
                maxLength={8000}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Activo web secundario</span>
              <Select
                className="mt-0"
                value={activoSecId}
                onChange={(e) => setActivoSecId(e.target.value)}
                options={activoOptions}
              />
            </div>
            <Button
              type="button"
              className="gap-2"
              disabled={updateSesion.isPending}
              onClick={() => {
                updateSesion.mutate(
                  {
                    id: sesion.id,
                    backlog_tareas: backlog.trim() || null,
                    plan_trabajo: planTrabajo.trim() || null,
                    activo_web_secundario_id: activoSecId || null,
                  },
                  {
                    onSuccess: () => toast.success('Sesión actualizada'),
                    onError: (e) => {
                      logger.error('sesion_threat_modeling.mda_update.failed', { id: sesion.id, error: e });
                      toast.error(extractErrorMessage(e, 'No se pudo guardar'));
                    },
                  },
                );
              }}
            >
              {updateSesion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar backlog / plan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>IA asistida</CardTitle>
            </div>
            <CardDescription>
              Este análisis requiere el permiso
              <code className="mx-1 rounded bg-muted px-1 text-xs">ia.execute</code>
              . En simulación no se persisten amenazas; desactiva simulación y activa
              <span className="whitespace-nowrap"> «Crear amenazas»</span> para generar filas
              a partir del JSON estructurado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contexto_adicional">Contexto adicional para el modelo</Label>
              <Textarea
                id="contexto_adicional"
                placeholder="Objetivo del análisis, supuestos, activos en juego…"
                value={contextoAdicional}
                onChange={(e) => setContextoAdicional(e.target.value)}
                rows={5}
                className="resize-y"
                maxLength={4000}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 sm:flex-1">
                <div>
                  <Label htmlFor="dry_run" className="text-sm font-medium">
                    Simulación (dry run)
                  </Label>
                  <p className="text-xs text-muted-foreground">No persiste amenazas nuevas.</p>
                </div>
                <Switch
                  id="dry_run"
                  checked={dryRun}
                  onCheckedChange={(v) => {
                    setDryRun(v);
                    if (v) setCrearAmenazas(false);
                  }}
                />
              </div>
              <div
                className={`flex items-center justify-between gap-4 rounded-lg border border-border p-3 sm:flex-1 ${dryRun ? 'opacity-50' : ''}`}
              >
                <div>
                  <Label htmlFor="crear_amenazas" className="text-sm font-medium">
                    Crear amenazas
                  </Label>
                  <p className="text-xs text-muted-foreground">Requiere permiso y simulación off.</p>
                </div>
                <Switch
                  id="crear_amenazas"
                  checked={crearAmenazas}
                  disabled={dryRun}
                  onCheckedChange={setCrearAmenazas}
                />
              </div>
            </div>

            {suggest.isError && (
              <p className="text-sm text-destructive" role="alert">
                {extractErrorMessage(
                  suggest.error,
                  'No se pudo completar la sugerencia. Comprueba permisos y configuración de IA.',
                )}
              </p>
            )}

            <Button
              type="button"
              onClick={onSubmit}
              disabled={suggest.isPending}
              className="gap-2"
            >
              {suggest.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {dryRun ? 'Obtener sugerencias (simulación)' : 'Ejecutar análisis'}
            </Button>

            {ultimaRespuesta && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="text-xs text-muted-foreground">
                  Modelo: {ultimaRespuesta.model} · Proveedor: {ultimaRespuesta.provider}
                </p>
                <div>
                  <span className="font-medium">Texto de análisis</span>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {ultimaRespuesta.content}
                  </p>
                </div>
                {ultimaRespuesta.suggested_threats.length > 0 && (
                  <div>
                    <span className="font-medium">Amenazas sugeridas</span>
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      {ultimaRespuesta.suggested_threats.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!ultimaRespuesta.dry_run && ultimaRespuesta.created_amenaza_ids.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Amenazas creadas: {ultimaRespuesta.created_amenaza_ids.length} (IDs en la lista
                    lateral).
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Amenazas de esta sesión</h2>
        {loadingAmenazas && (
          <p className="text-sm text-muted-foreground">Cargando amenazas…</p>
        )}
        {!loadingAmenazas && (!amenazas || amenazas.length === 0) && (
          <p className="text-sm text-muted-foreground">
            Aún no hay amenazas asociadas. Usa la simulación o crea amenazas desde el análisis.
          </p>
        )}
        {amenazas && amenazas.length > 0 && (
          <ul className="space-y-3">
            {amenazas.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-border bg-card/50 p-4 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{a.titulo}</span>
                  <Badge variant="default" className="text-xs">
                    {a.categoria_stride}
                  </Badge>
                </div>
                {a.descripcion && (
                  <p className="mt-1 text-muted-foreground">{a.descripcion}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  DREAD total: {a.score_total ?? '—'} · {a.estado}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageWrapper>
  );
}
