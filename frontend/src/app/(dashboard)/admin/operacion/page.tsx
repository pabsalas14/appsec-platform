'use client';

import Link from 'next/link';
import { CalendarClock, Loader2, Play, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableRow,
  DataTableTh,
  Input,
  PageHeader,
  PageWrapper,
  Textarea,
} from '@/components/ui';
import { useCerrarPeriodoFreeze } from '@/hooks/useCerrarPeriodoFreeze';
import { useEjecutarScoringMensual, useHistoricoScoringMensual } from '@/hooks/useMonthlyScoring';
import { useServiceReleaseOperacionConfig, useVulnerabilidadFlujoConfig } from '@/hooks/useOperacionConfig';
import { useSystemSettings, useUpsertSystemSetting } from '@/hooks/useSystemSettings';
import { logger } from '@/lib/logger';
import { extractErrorMessage } from '@/lib/utils';
import type { SystemSetting } from '@/types';

const KEYS = {
  transiciones: 'flujo.transiciones_liberacion',
  kanban: 'kanban.liberacion',
  estatusVuln: 'catalogo.estatus_vulnerabilidad',
  freeze: 'periodo.freeze',
  cicloProgramas: 'programas.ciclo_vida',
  cicloKpis: 'kpis.ciclo_vida',
} as const;

function findSetting(settings: SystemSetting[] | undefined, key: string): SystemSetting | undefined {
  return settings?.find((s) => s.key === key);
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
}

export default function AdminOperacionPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useSystemSettings();
  const upsert = useUpsertSystemSetting();
  const { data: opRead } = useServiceReleaseOperacionConfig();
  const { data: flujoVuln } = useVulnerabilidadFlujoConfig();

  const [transicionesText, setTransicionesText] = useState('');
  const [kanbanText, setKanbanText] = useState('');
  const [estatusVulnText, setEstatusVulnText] = useState('');
  const [freezeText, setFreezeText] = useState('');
  const [cicloProgramasText, setCicloProgramasText] = useState('');
  const [cicloKpisText, setCicloKpisText] = useState('');

  const now = new Date();
  const [scoringAnio, setScoringAnio] = useState(now.getFullYear());
  const [scoringMes, setScoringMes] = useState(now.getMonth() + 1);
  const scoringHist = useHistoricoScoringMensual({ anio: scoringAnio, mes: scoringMes });
  const scoringRun = useEjecutarScoringMensual();
  const cerrarPeriodo = useCerrarPeriodoFreeze();
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [cpAnio, setCpAnio] = useState(now.getFullYear());
  const [cpMes, setCpMes] = useState(now.getMonth() + 1);

  const trS = findSetting(settings, KEYS.transiciones);
  const knS = findSetting(settings, KEYS.kanban);
  const estS = findSetting(settings, KEYS.estatusVuln);
  const frS = findSetting(settings, KEYS.freeze);
  const prS = findSetting(settings, KEYS.cicloProgramas);
  const kpS = findSetting(settings, KEYS.cicloKpis);

  useEffect(() => {
    if (!trS && !opRead) return;
    if (trS) setTransicionesText(stringify(trS.value));
    else if (opRead) setTransicionesText(JSON.stringify(opRead.transiciones ?? {}, null, 2));
  }, [trS, opRead]);

  useEffect(() => {
    if (!knS && !opRead) return;
    if (knS) setKanbanText(stringify(knS.value));
    else if (opRead) setKanbanText(JSON.stringify(opRead.kanban ?? {}, null, 2));
  }, [knS, opRead]);

  useEffect(() => {
    if (estS) setEstatusVulnText(stringify(estS.value));
    else if (flujoVuln?.estatus?.length) {
      setEstatusVulnText(JSON.stringify(flujoVuln.estatus, null, 2));
    }
  }, [estS, flujoVuln]);

  useEffect(() => {
    if (frS) setFreezeText(stringify(frS.value));
  }, [frS]);

  useEffect(() => {
    if (prS) setCicloProgramasText(stringify(prS.value));
  }, [prS]);

  useEffect(() => {
    if (kpS) setCicloKpisText(stringify(kpS.value));
  }, [kpS]);

  const transicionesPreview = useMemo(() => {
    try {
      const raw = transicionesText.trim() ? JSON.parse(transicionesText) : {};
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { rows: [] as { origen: string; destinos: string }[], error: null as string | null };
      const rows = Object.entries(raw as Record<string, unknown>).map(([origen, dest]) => ({
        origen,
        destinos: Array.isArray(dest) ? (dest as unknown[]).map(String).join(' · ') : JSON.stringify(dest),
      }));
      return { rows, error: null as string | null };
    } catch {
      return { rows: [] as { origen: string; destinos: string }[], error: 'JSON inválido' };
    }
  }, [transicionesText]);

  const estatusVulnPreview = useMemo(() => {
    try {
      const raw = estatusVulnText.trim() ? JSON.parse(estatusVulnText) : [];
      if (!Array.isArray(raw)) return { items: [] as { id: string; label: string; trans: string }[], error: 'Se esperaba un array' };
      const items = raw.map((x: { id?: string; label?: string; transiciones_permitidas?: string[] }) => ({
        id: String(x?.id ?? ''),
        label: String(x?.label ?? ''),
        trans: Array.isArray(x?.transiciones_permitidas) ? x.transiciones_permitidas.join(', ') : '—',
      }));
      return { items, error: null as string | null };
    } catch {
      return { items: [] as { id: string; label: string; trans: string }[], error: 'JSON inválido' };
    }
  }, [estatusVulnText]);

  const freezeResumen = useMemo(() => {
    try {
      const raw = freezeText.trim() ? JSON.parse(freezeText) : null;
      if (raw === null || typeof raw !== 'object') return { ok: true as const, parts: [] as string[], error: null as string | null };
      const o = raw as Record<string, unknown>;
      const parts: string[] = [];
      if (typeof o.enabled === 'boolean') parts.push(`Freeze ${o.enabled ? 'activo' : 'inactivo'}`);
      if (o.dia_cierre_mensual != null) parts.push(`Cierre día ${String(o.dia_cierre_mensual)}`);
      const mods = o.modulos_bloqueados;
      if (Array.isArray(mods)) parts.push(`Módulos bloqueados: ${mods.length}`);
      const pc = o.periodos_cerrados;
      if (Array.isArray(pc)) parts.push(`Periodos cerrados registrados: ${pc.length}`);
      return { ok: true as const, parts, error: null as string | null };
    } catch {
      return { ok: false as const, parts: [] as string[], error: 'JSON inválido' };
    }
  }, [freezeText]);

  const kanbanPreview = useMemo(() => {
    try {
      const raw = kanbanText.trim() ? JSON.parse(kanbanText) : {};
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        return { columnas: [] as string[], error: null as string | null };
      }
      const co = (raw as Record<string, unknown>).columnas_orden;
      const columnas = Array.isArray(co) ? co.map(String) : [];
      return { columnas, error: null as string | null };
    } catch {
      return { columnas: [] as string[], error: 'JSON inválido' };
    }
  }, [kanbanText]);

  const saveTransiciones = () => {
    let parsed: unknown;
    try {
      parsed = transicionesText.trim() ? JSON.parse(transicionesText) : {};
    } catch {
      toast.error('JSON inválido (transiciones de liberación).');
      return;
    }
    if (parsed !== null && typeof parsed !== 'object') {
      toast.error('Debe ser un objeto JSON (mapa origen → destinos).');
      return;
    }
    upsert.mutate(
      {
        key: KEYS.transiciones,
        value: parsed,
        description: trS?.description,
      },
      {
        onSuccess: () => {
          toast.success('Transiciones de liberación guardadas');
          void qc.invalidateQueries({ queryKey: ['operacion', 'service_releases', 'config'] });
        },
        onError: (e) => {
          logger.error('admin.operacion.save_transiciones', { error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  };

  const saveEstatusVuln = () => {
    let parsed: unknown;
    try {
      parsed = estatusVulnText.trim() ? JSON.parse(estatusVulnText) : [];
    } catch {
      toast.error('JSON inválido (catálogo de estatus de vulnerabilidad).');
      return;
    }
    if (!Array.isArray(parsed)) {
      toast.error('Debe ser un array JSON de entradas de estatus (BRD D1).');
      return;
    }
    upsert.mutate(
      {
        key: KEYS.estatusVuln,
        value: parsed,
        description: estS?.description ?? 'Catálogo estatus vulnerabilidad (D1): id, label, transiciones, ciclo',
      },
      {
        onSuccess: () => {
          toast.success('Catálogo de estatus (vulnerabilidades) guardado');
          void qc.invalidateQueries({ queryKey: ['vulnerabilidads', 'config', 'flujo'] });
        },
        onError: (e) => {
          logger.error('admin.operacion.save_estatus_vuln', { error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  };

  const saveKanban = () => {
    let parsed: unknown;
    try {
      parsed = kanbanText.trim() ? JSON.parse(kanbanText) : {};
    } catch {
      toast.error('JSON inválido (kanban de liberación).');
      return;
    }
    if (parsed !== null && typeof parsed !== 'object') {
      toast.error('Debe ser un objeto JSON (p. ej. columnas_orden).');
      return;
    }
    upsert.mutate(
      {
        key: KEYS.kanban,
        value: parsed,
        description: knS?.description,
      },
      {
        onSuccess: () => {
          toast.success('Orden de kanban guardado');
          void qc.invalidateQueries({ queryKey: ['operacion', 'service_releases', 'config'] });
        },
        onError: (e) => {
          logger.error('admin.operacion.save_kanban', { error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  };

  const saveJsonSetting = (key: string, text: string, description?: string, okMsg?: string) => {
    let parsed: unknown;
    try {
      parsed = text.trim() ? JSON.parse(text) : {};
    } catch {
      toast.error(`JSON inválido (${key})`);
      return;
    }
    if (parsed === null || typeof parsed !== 'object') {
      toast.error(`Debe ser un objeto JSON (${key})`);
      return;
    }
    upsert.mutate(
      { key, value: parsed, description },
      {
        onSuccess: () => toast.success(okMsg ?? `${key} guardado`),
        onError: (e) => {
          logger.error('admin.operacion.save_json_setting', { key, error: e });
          toast.error(extractErrorMessage(e, 'Error al guardar'));
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageWrapper className="p-6">
        <p className="text-muted-foreground">Cargando ajustes…</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Operación (liberaciones y flujos)"
        description="C1–C3: `flujo.transiciones_liberacion` y `kanban.liberacion` en almacenamiento; la UI de liberaciones y el dashboard de kanban leen la misma configuración."
      />
      <p className="-mt-4 mb-2 text-xs text-muted-foreground">
        ¿Vista técnica completa y búsqueda?{' '}
        <Link href="/admin/settings" className="font-medium text-primary underline-offset-4 hover:underline">
          Configuración del sistema
        </Link>
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" />
            Scoring mensual de madurez (spec 12)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ejecuta el motor de los 4 pilares y persiste snapshots jerárquicos. Requiere rol admin/backoffice.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Año</label>
              <Input
                type="number"
                className="mt-1 w-28"
                value={scoringAnio}
                min={2000}
                max={2100}
                onChange={(e) => setScoringAnio(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mes</label>
              <Input
                type="number"
                className="mt-1 w-24"
                value={scoringMes}
                min={1}
                max={12}
                onChange={(e) => setScoringMes(Number(e.target.value))}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              scoringRun.mutate(
                { anio: scoringAnio, mes: scoringMes },
                {
                  onSuccess: (r) => {
                    toast.success(`Scoring ejecutado · células: ${r.celulas_computadas ?? '—'}`);
                  },
                  onError: (e) => {
                    toast.error(extractErrorMessage(e, 'Error al ejecutar scoring'));
                  },
                },
              );
            }}
            disabled={scoringRun.isPending}
          >
            {scoringRun.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Ejecutar scoring
          </Button>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            Registros en historico ({scoringAnio}-{String(scoringMes).padStart(2, '0')}):{' '}
            {scoringHist.isLoading ? '…' : (scoringHist.data?.length ?? 0)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transiciones entre estados (service releases)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mapa: estado origen → lista de estados destino (spec 19.2 / liberaciones). Vacío o ausente = sin validación estricta en el backend.
            Vista efectiva: {opRead ? 'sincronizada' : '—'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[220px] font-mono text-xs"
            value={transicionesText}
            onChange={(e) => setTransicionesText(e.target.value)}
            spellCheck={false}
            placeholder='{ "Borrador": [ "En Revision de Diseno" ] }'
          />
          {transicionesPreview.error && (
            <p className="text-xs text-destructive">{transicionesPreview.error}</p>
          )}
          {!transicionesPreview.error && transicionesPreview.rows.length > 0 && (
            <div className="rounded-md border border-border overflow-x-auto">
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableTh>Estado origen</DataTableTh>
                    <DataTableTh>Destinos permitidos</DataTableTh>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {transicionesPreview.rows.map((row) => (
                    <DataTableRow key={row.origen}>
                      <DataTableCell className="font-medium text-sm">{row.origen}</DataTableCell>
                      <DataTableCell className="text-xs text-muted-foreground">{row.destinos || '—'}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}
          <div className="flex justify-end">
            <Button type="button" onClick={saveTransiciones} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar transiciones
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orden de columnas (kanban de liberaciones)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Objeto con `columnas_orden: string[]` (valores de `estado_actual`). Afecta el dashboard de tablero.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            value={kanbanText}
            onChange={(e) => setKanbanText(e.target.value)}
            spellCheck={false}
            placeholder='{ "columnas_orden": [ "Borrador", "En Revision de Diseno" ] }'
          />
          {kanbanPreview.error && <p className="text-xs text-destructive">{kanbanPreview.error}</p>}
          {!kanbanPreview.error && kanbanPreview.columnas.length > 0 && (
            <ol className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {kanbanPreview.columnas.map((c, i) => (
                <li key={`${c}-${i}`} className="rounded-md border border-border px-2 py-1">
                  <span className="font-mono text-[10px] text-muted-foreground/80">{i + 1}.</span> {c}
                </li>
              ))}
            </ol>
          )}
          <div className="flex justify-end">
            <Button type="button" onClick={saveKanban} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar kanban
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catálogo de estatus de vulnerabilidad (D1)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Array en `system_settings` bajo `catalogo.estatus_vulnerabilidad` — cada ítem: `id`, `label`, `transiciones_permitidas`,
            `clasificacion_ciclo`, `es_terminal`. La API expone el mismo esquema en `GET /vulnerabilidads/config/flujo`.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {flujoVuln?.estatus?.length ? (
            <p className="text-xs text-muted-foreground">Resumen: {flujoVuln.estatus.length} estatus activos en lectura.</p>
          ) : null}
          <Textarea
            className="min-h-[240px] font-mono text-xs"
            value={estatusVulnText}
            onChange={(e) => setEstatusVulnText(e.target.value)}
            spellCheck={false}
            placeholder='[ { "id": "Abierta", "label": "Abierta", "transiciones_permitidas": ["En Remediación"] } ]'
          />
          {estatusVulnPreview.error && (
            <p className="text-xs text-destructive">{estatusVulnPreview.error}</p>
          )}
          {!estatusVulnPreview.error && estatusVulnPreview.items.length > 0 && (
            <div className="rounded-md border border-border overflow-x-auto max-h-[240px] overflow-y-auto">
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableTh>id</DataTableTh>
                    <DataTableTh>Label</DataTableTh>
                    <DataTableTh>Transiciones</DataTableTh>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {estatusVulnPreview.items.map((row) => (
                    <DataTableRow key={row.id}>
                      <DataTableCell className="font-mono text-xs">{row.id}</DataTableCell>
                      <DataTableCell className="text-sm">{row.label}</DataTableCell>
                      <DataTableCell className="text-xs text-muted-foreground max-w-[320px]">{row.trans}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}
          <div className="flex justify-end">
            <Button type="button" onClick={saveEstatusVuln} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar catálogo D1
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Freeze mensual (sección 35)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configura el cierre de periodo y módulos bloqueados tras el cierre.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {freezeResumen.error ? (
            <p className="text-xs text-destructive">{freezeResumen.error}</p>
          ) : freezeResumen.parts.length > 0 ? (
            <Alert>
              <AlertTitle className="text-sm">Resumen de configuración</AlertTitle>
              <AlertDescription className="text-xs space-x-2 flex flex-wrap gap-1">
                {freezeResumen.parts.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </AlertDescription>
            </Alert>
          ) : null}
          <Textarea
            className="min-h-[180px] font-mono text-xs"
            value={freezeText}
            onChange={(e) => setFreezeText(e.target.value)}
            spellCheck={false}
            placeholder='{ "enabled": true, "dia_cierre_mensual": 5, "modulos_bloqueados": ["programas","indicadores","okr"], "periodos_cerrados": [] }'
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCerrarOpen(true)}>
              Registrar cierre en histórico (spec 35)
            </Button>
            <Button
              type="button"
              onClick={() => saveJsonSetting(KEYS.freeze, freezeText, frS?.description, 'Freeze mensual guardado')}
              disabled={upsert.isPending}
            >
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar freeze
            </Button>
          </div>
          <Dialog open={cerrarOpen} onOpenChange={setCerrarOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cerrar periodo en histórico</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                Añade una entrada a <code className="rounded bg-muted px-1">periodos_cerrados</code> sin sobrescribir el JSON
                completo (requiere backoffice).
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Año</label>
                  <Input
                    type="number"
                    className="mt-1"
                    min={2000}
                    max={2100}
                    value={cpAnio}
                    onChange={(e) => setCpAnio(Number(e.target.value))}
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs font-medium text-muted-foreground">Mes</label>
                  <Input
                    type="number"
                    className="mt-1"
                    min={1}
                    max={12}
                    value={cpMes}
                    onChange={(e) => setCpMes(Number(e.target.value))}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  disabled={cerrarPeriodo.isPending}
                  onClick={() =>
                    cerrarPeriodo.mutate(
                      { anio: cpAnio, mes: cpMes },
                      {
                        onSuccess: (r) => {
                          toast.success(`Periodo cerrado · total en histórico: ${r.total_periodos_cerrados}`);
                          setCerrarOpen(false);
                          void qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
                        },
                        onError: (e) => {
                          logger.error('admin.operacion.freeze.cerrar', { error: e });
                          toast.error(extractErrorMessage(e, 'No se pudo registrar'));
                        },
                      },
                    )
                  }
                >
                  {cerrarPeriodo.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar cierre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ciclo de vida de programas (sección 27)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            value={cicloProgramasText}
            onChange={(e) => setCicloProgramasText(e.target.value)}
            spellCheck={false}
            placeholder='{ "permitir_clonacion": true, "congelar_historico": true }'
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() =>
                saveJsonSetting(
                  KEYS.cicloProgramas,
                  cicloProgramasText,
                  prS?.description,
                  'Ciclo de vida de programas guardado',
                )
              }
              disabled={upsert.isPending}
            >
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar ciclo programas
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ciclo de vida de KPIs (sección 28)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            value={cicloKpisText}
            onChange={(e) => setCicloKpisText(e.target.value)}
            spellCheck={false}
            placeholder='{ "congelar_historico_por_defecto": true, "permitir_recalculo_retroactivo": true }'
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => saveJsonSetting(KEYS.cicloKpis, cicloKpisText, kpS?.description, 'Ciclo de KPIs guardado')}
              disabled={upsert.isPending}
            >
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar ciclo KPIs
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
